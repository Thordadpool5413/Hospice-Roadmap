import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { MODELS } from "../config/models.js";
import twilio from "twilio";

const router: IRouter = Router();

// ─── Twilio client (lazy, so missing creds fail at request time not startup) ──

function getTwilioClient() {
  const sid = process.env["TWILIO_ACCOUNT_SID"];
  const token = process.env["TWILIO_AUTH_TOKEN"];
  if (!sid || !token) {
    throw new Error("Twilio credentials are not configured.");
  }
  return twilio(sid, token);
}

function getTwilioFromNumber(): string {
  const from = process.env["TWILIO_FROM_NUMBER"];
  if (!from) throw new Error("TWILIO_FROM_NUMBER is not configured.");
  return from;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const E164_RE = /^\+[1-9]\d{7,14}$/;

function sanitizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim().replace(/[\s\-().]/g, "");
  return E164_RE.test(cleaned) ? cleaned : null;
}

// ─── POST /family-updates/draft ───────────────────────────────────────────────

router.post("/draft", async (req: Request, res: Response) => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as {
    symptomSummary?: unknown;
    journalExcerpt?: unknown;
    patientName?: unknown;
  };

  const symptomSummary =
    typeof body.symptomSummary === "string" ? body.symptomSummary.trim() : "";
  const journalExcerpt =
    typeof body.journalExcerpt === "string" ? body.journalExcerpt.trim() : "";
  const patientName =
    typeof body.patientName === "string" ? body.patientName.trim() : "your loved one";

  if (!symptomSummary && !journalExcerpt) {
    res.status(400).json({
      error:
        "At least one of symptomSummary or journalExcerpt is required to generate an update.",
    });
    return;
  }

  const contextParts: string[] = [];
  if (symptomSummary) {
    contextParts.push(`Symptom check-in data:\n${symptomSummary}`);
  }
  if (journalExcerpt) {
    contextParts.push(`Most recent journal entry:\n${journalExcerpt}`);
  }

  const userPrompt = `You are helping a family caregiver send a warm, human, plain-language update to family members about their loved one's hospice care today.

Patient name: ${patientName}

Source material (do NOT include clinical numbers — translate them into human language):
${contextParts.join("\n\n")}

Write a family care update message (100–160 words) that:
- Opens with the patient's name and today's overall feel (hard day / quiet day / a little better, etc.)
- Translates any symptom scores into plain human terms (e.g., "pain was a bit higher than usual this morning")
- Includes any meaningful moments or observations from the journal if present
- Ends with one gentle, reassuring sentence about the care team or the caregiver's attention
- Sounds like it was written by the caregiver themselves — warm, personal, NOT clinical
- Uses no hashtags, bullet points, or headers — just flowing paragraphs

Return ONLY the message text. No subject line, no preamble, no closing signature.`;

  try {
    const message = await anthropic.messages.create({
      model: MODELS.claude.fast,
      max_tokens: 400,
      messages: [{ role: "user", content: userPrompt }],
    });

    const draft =
      message.content[0]?.type === "text" ? message.content[0].text.trim() : "";

    if (!draft) {
      res.status(500).json({ error: "AI did not return a draft message." });
      return;
    }

    res.json({ draft });
  } catch (err: unknown) {
    req.log.error({ err }, "Family update draft generation failed");
    res.status(500).json({ error: "Failed to generate draft message." });
  }
});

// ─── POST /family-updates/send ────────────────────────────────────────────────

router.post("/send", async (req: Request, res: Response) => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as {
    message?: unknown;
    phoneNumbers?: unknown;
  };

  const message =
    typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length < 10) {
    res.status(400).json({ error: "message must be at least 10 characters." });
    return;
  }
  if (message.length > 1600) {
    res.status(400).json({ error: "message must be 1600 characters or fewer." });
    return;
  }

  if (!Array.isArray(body.phoneNumbers) || body.phoneNumbers.length === 0) {
    res.status(400).json({ error: "phoneNumbers array is required and must not be empty." });
    return;
  }
  if (body.phoneNumbers.length > 6) {
    res.status(400).json({ error: "A maximum of 6 phone numbers may receive an update." });
    return;
  }

  const validNumbers: string[] = [];
  for (const raw of body.phoneNumbers) {
    const phone = sanitizePhone(raw);
    if (!phone) {
      res.status(400).json({
        error: `Invalid phone number: "${raw}". All numbers must be in E.164 format (e.g., +15551234567).`,
      });
      return;
    }
    validNumbers.push(phone);
  }

  let twilioClient: ReturnType<typeof twilio>;
  let fromNumber: string;
  try {
    twilioClient = getTwilioClient();
    fromNumber = getTwilioFromNumber();
  } catch (err: unknown) {
    const e = err as { message?: string };
    req.log.error({ err }, "Twilio not configured");
    res.status(503).json({
      error: "SMS service is not available.",
      message: e?.message ?? "Twilio credentials are missing.",
    });
    return;
  }

  const results: Array<{ to: string; status: "sent" | "failed"; sid?: string; error?: string }> = [];

  for (const to of validNumbers) {
    try {
      const smsResult = await twilioClient.messages.create({
        body: message,
        from: fromNumber,
        to,
      });
      results.push({ to, status: "sent", sid: smsResult.sid });
    } catch (err: unknown) {
      const e = err as { message?: string };
      req.log.error({ err, to }, "Failed to send SMS to recipient");
      results.push({ to, status: "failed", error: e?.message ?? "Unknown error" });
    }
  }

  const sentCount = results.filter((r) => r.status === "sent").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  res.json({
    sentCount,
    failedCount,
    results,
  });
});

export default router;
