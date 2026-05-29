import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { db, familyUpdateLog, smsOptOuts } from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";
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

// ─── POST /family-updates/inbound (Twilio webhook — no auth) ──────────────────
// This handler is exported so routes/index.ts can mount it WITHOUT the
// requireAuth / requirePremium middleware that guards the rest of the router.

export async function twilioInboundHandler(req: Request, res: Response): Promise<void> {
  const authToken = process.env["TWILIO_AUTH_TOKEN"];

  // Fail-closed: validate whenever the auth token is present, unless the
  // caller has explicitly opted out with TWILIO_SKIP_SIGNATURE_VALIDATION=true
  // (development override only — never set this in production).
  const skipValidation = process.env["TWILIO_SKIP_SIGNATURE_VALIDATION"] === "true";
  if (authToken && !skipValidation) {
    const signature = (req.headers["x-twilio-signature"] as string) ?? "";
    const protocol = (req.headers["x-forwarded-proto"] as string) ?? req.protocol;
    const host = req.headers["host"] ?? "";
    const url = `${protocol}://${host}${req.originalUrl}`;
    const params = (req.body ?? {}) as Record<string, string>;
    const isValid = twilio.validateRequest(authToken, signature, url, params);
    if (!isValid) {
      res.status(403).type("text/plain").send("Forbidden");
      return;
    }
  }

  const from = typeof req.body?.From === "string" ? (req.body.From as string).trim() : null;
  const body = typeof req.body?.Body === "string" ? (req.body.Body as string).trim() : "";

  if (from && E164_RE.test(from) && /^stop$/i.test(body)) {
    try {
      await db
        .insert(smsOptOuts)
        .values({ phone: from, optedOutAt: new Date() })
        .onConflictDoUpdate({
          target: smsOptOuts.phone,
          set: { optedOutAt: new Date() },
        });
      req.log.info({ phone: from }, "SMS opt-out recorded via STOP reply");
    } catch (err: unknown) {
      // Return 500 so Twilio retries delivery — a lost STOP would violate TCPA compliance.
      req.log.error({ err, phone: from }, "Failed to record SMS opt-out; returning 500 for Twilio retry");
      res.status(500).type("text/plain").send("Internal Server Error");
      return;
    }
  }

  res.set("Content-Type", "text/xml").send("<Response/>");
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

  // ── Filter opted-out numbers ────────────────────────────────────────────────
  // Query MUST succeed — silently bypassing opt-outs would violate TCPA compliance.
  let optedOutSet: Set<string>;
  try {
    const rows = await db
      .select({ phone: smsOptOuts.phone })
      .from(smsOptOuts)
      .where(inArray(smsOptOuts.phone, validNumbers));
    optedOutSet = new Set(rows.map((r) => r.phone));
  } catch (err: unknown) {
    req.log.error({ err }, "Failed to query SMS opt-outs; aborting send to protect TCPA compliance");
    res.status(503).json({
      error: "Unable to verify opt-out status. Please try again in a moment.",
    });
    return;
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

  const results: Array<{
    to: string;
    status: "sent" | "failed" | "opted_out";
    sid?: string;
    error?: string;
  }> = [];

  for (const to of validNumbers) {
    if (optedOutSet.has(to)) {
      results.push({ to, status: "opted_out" });
      continue;
    }

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
  const optedOutCount = results.filter((r) => r.status === "opted_out").length;

  if (sentCount > 0) {
    try {
      await db.insert(familyUpdateLog).values({
        id: `fuh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId,
        sentAt: new Date(),
        recipientCount: sentCount,
        preview: message.slice(0, 200),
      });
    } catch (err: unknown) {
      req.log.error({ err }, "Failed to persist family update log entry");
    }
  }

  res.json({
    sentCount,
    failedCount,
    optedOutCount,
    results,
  });
});

// ─── GET /family-updates/opt-outs ─────────────────────────────────────────────

router.get("/opt-outs", async (req: Request, res: Response) => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const phonesParam =
    typeof req.query["phones"] === "string" ? req.query["phones"].trim() : "";
  if (!phonesParam) {
    res.json({ optedOut: [] });
    return;
  }

  const phones = phonesParam
    .split(",")
    .map((p) => p.trim())
    .filter((p) => E164_RE.test(p))
    .slice(0, 20);

  if (phones.length === 0) {
    res.json({ optedOut: [] });
    return;
  }

  try {
    const rows = await db
      .select({ phone: smsOptOuts.phone })
      .from(smsOptOuts)
      .where(inArray(smsOptOuts.phone, phones));
    res.json({ optedOut: rows.map((r) => r.phone) });
  } catch (err: unknown) {
    req.log.error({ err }, "Failed to fetch SMS opt-outs");
    res.status(500).json({ error: "Failed to fetch opt-out status." });
  }
});

// ─── GET /family-updates/history ──────────────────────────────────────────────

router.get("/history", async (req: Request, res: Response) => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(familyUpdateLog)
      .where(eq(familyUpdateLog.userId, userId))
      .orderBy(desc(familyUpdateLog.sentAt))
      .limit(10);

    const history = rows.map((row) => ({
      id: row.id,
      sentAt: row.sentAt.toISOString(),
      recipientCount: row.recipientCount,
      preview: row.preview,
    }));

    res.json({ history });
  } catch (err: unknown) {
    req.log.error({ err }, "Failed to fetch family update history");
    res.status(500).json({ error: "Failed to fetch history." });
  }
});

export default router;
