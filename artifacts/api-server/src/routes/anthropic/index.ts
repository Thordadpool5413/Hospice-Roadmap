import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, or, isNull } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db/schema";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { HOSPICE_SYSTEM_PROMPT } from "./systemPrompt.js";
import { buildResponsePlan } from "../../intelligence/hospice/planner.js";
import { MODELS } from "../../config/models.js";

const router: IRouter = Router();

function safeParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]+\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

/**
 * Build a WHERE clause that finds conversations belonging to the authenticated
 * user. Covers three cases:
 *  1. New rows  — userId = clerkUserId
 *  2. Claimed legacy rows — userId = clerkUserId (set by claim-device)
 *  3. Transitional rows created before the userId column existed but after
 *     Clerk auth was added — clientId = clerkUserId (the old workaround)
 */
function ownerFilter(userId: string) {
  return or(
    eq(conversations.userId, userId),
    and(isNull(conversations.userId), eq(conversations.clientId, userId)),
  )!;
}

router.get("/conversations", async (req: Request, res: Response) => {
  const userId = getAuth(req).userId!;
  try {
    const all = await db
      .select()
      .from(conversations)
      .where(ownerFilter(userId))
      .orderBy(conversations.createdAt);
    res.json(all);
  } catch (err: unknown) {
    req.log.error({ err }, "Error listing conversations");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/conversations", async (req: Request, res: Response) => {
  const userId = getAuth(req).userId!;
  try {
    const { title } = req.body as { title: string };
    if (!title || typeof title !== "string") {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const [conv] = await db
      .insert(conversations)
      .values({ title: title.trim(), userId })
      .returning();
    res.status(201).json(conv);
  } catch (err: unknown) {
    req.log.error({ err }, "Error creating conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/conversations/:id", async (req: Request, res: Response) => {
  const userId = getAuth(req).userId!;
  try {
    const id = Number(req.params["id"]);
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), ownerFilter(userId)));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);
    res.json({ ...conv, messages: msgs });
  } catch (err: unknown) {
    req.log.error({ err }, "Error getting conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.delete("/conversations/:id", async (req: Request, res: Response) => {
  const userId = getAuth(req).userId!;
  try {
    const id = Number(req.params["id"]);
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), ownerFilter(userId)));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    await db
      .delete(conversations)
      .where(and(eq(conversations.id, id), ownerFilter(userId)));
    res.status(204).send();
  } catch (err: unknown) {
    req.log.error({ err }, "Error deleting conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

router.get("/conversations/:id/messages", async (req: Request, res: Response) => {
  const userId = getAuth(req).userId!;
  try {
    const id = Number(req.params["id"]);
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), ownerFilter(userId)));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);
    res.json(msgs);
  } catch (err: unknown) {
    req.log.error({ err }, "Error listing messages");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

router.post("/conversations/:id/messages", async (req: Request, res: Response) => {
  const userId = getAuth(req).userId!;
  const id = Number(req.params["id"]);
  const { content, patientContext } = req.body as {
    content: string;
    patientContext?: string;
  };

  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "content is required" });
    return;
  }

  let fullResponse = "";

  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), ownerFilter(userId)));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await db.insert(messages).values({
      conversationId: id,
      role: "user",
      content: content.trim(),
    });

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    const chatMessages: { role: "user" | "assistant"; content: string }[] =
      history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    let responsePlanKnowledge = "";
    try {
      const plan = buildResponsePlan(content, patientContext ?? "");
      responsePlanKnowledge = plan.injectedKnowledge;
    } catch (planErr) {
      req.log.warn({ err: planErr }, "Intelligence planner failed — serving base prompt only");
    }

    const systemPrompt = [
      HOSPICE_SYSTEM_PROMPT,
      patientContext
        ? `\n\n═══════════════════════════════════════\nPATIENT CONTEXT FOR THIS SESSION\n═══════════════════════════════════════\n${patientContext}`
        : "",
      responsePlanKnowledge
        ? `\n\n═══════════════════════════════════════\nINTELLIGENCE PACKAGE — FOLLOW THIS PLAN\n═══════════════════════════════════════\n${responsePlanKnowledge}`
        : "",
    ]
      .filter(Boolean)
      .join("");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    try {
      const stream = anthropic.messages.stream({
        model: MODELS.claude.smart,
        max_tokens: 8192,
        system: systemPrompt,
        messages: chatMessages,
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          fullResponse += event.delta.text;
          res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } finally {
      if (fullResponse) {
        await db.insert(messages).values({
          conversationId: id,
          role: "assistant",
          content: fullResponse,
        });
      }
    }
  } catch (err: unknown) {
    req.log.error({ err }, "Error sending message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send message" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
      res.end();
    }
  }
});

router.post("/conversations/:id/voice-exchange", async (req: Request, res: Response) => {
  const userId = getAuth(req).userId!;

  const id = Number(req.params["id"]);
  const { userTranscript, assistantTranscript } = req.body as {
    userTranscript?: string;
    assistantTranscript?: string;
  };

  if (!userTranscript || typeof userTranscript !== "string") {
    res.status(400).json({ error: "userTranscript is required" });
    return;
  }

  if (!assistantTranscript || typeof assistantTranscript !== "string") {
    res.status(400).json({ error: "assistantTranscript is required" });
    return;
  }

  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), ownerFilter(userId)));

    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await db.insert(messages).values([
      {
        conversationId: id,
        role: "user",
        content: userTranscript.trim(),
      },
      {
        conversationId: id,
        role: "assistant",
        content: assistantTranscript.trim(),
      },
    ]);

    res.status(204).send();
  } catch (err: unknown) {
    req.log.error({ err }, "Error saving voice exchange");
    res.status(500).json({ error: "Failed to save voice exchange" });
  }
});

router.post("/conversations/:id/memory", async (req: Request, res: Response) => {
  const userId = getAuth(req).userId!;
  const id = Number(req.params["id"]);
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), ownerFilter(userId)));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    if (msgs.length < 2) {
      res.status(422).json({ error: "Not enough messages to generate memory" });
      return;
    }

    const transcript = msgs
      .map((m) => `${m.role === "user" ? "User" : "Ragna"}: ${m.content}`)
      .join("\n\n");

    const memoryPrompt = `You are a memory extraction system for Ragna, a hospice care AI companion. Given the following conversation transcript, extract a concise memory in JSON format that Ragna can use in future sessions to feel continuous and aware of this family's journey.

Output ONLY valid JSON — no markdown, no explanation, no code fences. Use this exact format:
{
  "summary": "2-sentence plain English summary of what was discussed and any key outcomes or guidance given",
  "keyFacts": ["specific fact 1 about patient or caregiver situation", "specific fact 2", "specific fact 3"],
  "emotionalTone": "one of exactly: distressed, calm, seeking-info, grieving, hopeful, mixed",
  "mainTopics": ["topic label 1", "topic label 2"]
}

Rules:
- keyFacts: 2-5 items, each a concrete specific fact (e.g. "Patient is named John, 78yo with CHF" not "patient has a diagnosis")
- summary: focus on what the person needed, what they were feeling, what guidance helped
- emotionalTone: pick the single best word from the allowed list
- mainTopics: 1-3 short topic labels (e.g. "pain management", "breathing difficulty", "caregiver support")

Transcript:
${transcript.slice(0, 12000)}`;

    const response = await anthropic.messages.create({
      model: MODELS.claude.fast,
      max_tokens: 400,
      messages: [{ role: "user", content: memoryPrompt }],
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    const memory = safeParseJson(raw);
    if (!memory) {
      req.log.error({ raw }, "Failed to parse memory JSON from LLM response");
      res.status(500).json({ error: "Failed to parse memory" });
      return;
    }

    res.json(memory);
  } catch (err: unknown) {
    req.log.error({ err }, "Error generating memory");
    res.status(500).json({ error: "Failed to generate memory" });
  }
});

/**
 * POST /api/anthropic/claim-device
 *
 * Links an existing device-generated clientId to the authenticated Clerk
 * userId. Call this once on first sign-in when the device has a stored
 * client_id that was used before auth was required.
 *
 * Body: { clientId: string }
 * Auth: Clerk JWT (required)
 *
 * Returns: { claimed: number } — number of rows updated.
 */
router.post("/claim-device", async (req: Request, res: Response) => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { clientId } = req.body as { clientId?: unknown };

  if (!clientId || typeof clientId !== "string" || clientId.trim().length === 0) {
    res.status(400).json({ error: "clientId is required" });
    return;
  }

  const trimmedClientId = clientId.trim();

  if (!/^client_[a-z0-9_]+$/.test(trimmedClientId)) {
    res.status(400).json({ error: "Invalid clientId format" });
    return;
  }

  try {
    const result = await db
      .update(conversations)
      .set({ userId })
      .where(
        and(
          eq(conversations.clientId, trimmedClientId),
          isNull(conversations.userId),
        ),
      )
      .returning({ id: conversations.id });

    req.log.info(
      { userId, clientId: trimmedClientId, claimed: result.length },
      "Device conversations claimed",
    );

    res.json({ claimed: result.length });
  } catch (err: unknown) {
    req.log.error({ err }, "Error claiming device conversations");
    res.status(500).json({ error: "Failed to claim device conversations" });
  }
});

router.post("/profile-synthesize", async (req: Request, res: Response) => {
  const { currentProfile, memory, tileHistory } = req.body as {
    currentProfile?: string;
    memory: {
      summary: string;
      keyFacts: string[];
      emotionalTone: string;
      mainTopics: string[];
      date: string;
    };
    tileHistory?: string[];
  };

  const tileContext = tileHistory && tileHistory.length > 0
    ? `\nRecent concern areas the user has selected (most recent first): ${tileHistory.slice(0, 10).join(", ")}`
    : "";

  const prompt = `You are maintaining Ragna's living understanding of a family navigating the hospice journey. Ragna is a hospice care AI companion. This understanding deepens with every conversation.

${currentProfile ? `Current understanding:\n${currentProfile}` : "This is the first conversation — no prior understanding yet."}

New conversation memory:
Date: ${new Date(memory.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
Summary: ${memory.summary}
Key facts: ${memory.keyFacts.join("; ")}
Emotional tone this session: ${memory.emotionalTone}
Topics discussed: ${memory.mainTopics.join(", ")}${tileContext}

Write an updated, synthesized understanding in 3-5 sentences. This is Ragna's "living knowledge" of this family — not a transcript summary, but a deepening human understanding:
- Who they are (patient name/age/diagnosis if known, caregiver role and name if known)
- What they are carrying emotionally (fears, recurring worries, what seems unresolved)
- What patterns have emerged across conversations (what topics keep coming up, what they need most)
- How their emotional state has changed over time, if at all
- What Ragna should keep in mind going forward — what to gently follow up on, what they may not be ready for yet

Write in third person as if Ragna is describing her understanding of this family to herself. Be specific and human, not clinical. If the same concern keeps appearing, name it explicitly. If something seems unresolved, say so.

Output ONLY the 3-5 sentence paragraph. No preamble, no labels, no explanation.`;

  try {
    const response = await anthropic.messages.create({
      model: MODELS.claude.fast,
      max_tokens: 450,
      messages: [{ role: "user", content: prompt }],
    });

    const profile = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    res.json({ profile });
  } catch (err: unknown) {
    req.log.error({ err }, "Error synthesizing profile");
    res.status(500).json({ error: "Failed to synthesize profile" });
  }
});

router.post("/score-hospice", async (req: Request, res: Response) => {
  const { interview } = req.body as { interview: Record<string, unknown> };
  if (!interview || typeof interview !== "object") {
    res.status(400).json({ error: "interview data is required" });
    return;
  }

  const scoringPrompt = `You are Ragna, a hospice expert with 30 years of clinical and administrative experience. A family has just completed a structured interview with a hospice agency and shared their answers with you. Analyze the interview data carefully and provide an honest, clinical assessment.

INTERVIEW DATA:
${JSON.stringify(interview, null, 2)}

Analyze this hospice interview data and respond with ONLY valid JSON — no markdown, no code fences, no explanation. Use exactly this format:

{
  "overallScore": <integer 0-100>,
  "recommendation": "<one of: Strong Candidate | Maybe | Probably Not | Absolutely Not>",
  "recommendationReason": "<1-2 sentence plain explanation of why this label fits>",
  "categoryScores": [
    {"name": "Communication & Transparency", "score": <1-5>, "color": "<green|yellow|red>", "finding": "<1 sentence specific to their answers>"},
    {"name": "Routine Care Commitment", "score": <1-5>, "color": "<green|yellow|red>", "finding": "<1 sentence>"},
    {"name": "Crisis Care Readiness", "score": <1-5>, "color": "<green|yellow|red>", "finding": "<1 sentence>"},
    {"name": "Honesty About Revocation & Discharge", "score": <1-5>, "color": "<green|yellow|red>", "finding": "<1 sentence>"},
    {"name": "Financial Transparency", "score": <1-5>, "color": "<green|yellow|red>", "finding": "<1 sentence>"},
    {"name": "First Impression", "score": <1-5>, "color": "<green|yellow|red>", "finding": "<1 sentence>"}
  ],
  "greenFlags": ["<specific green flag from their data>", "<another if present>"],
  "redFlags": ["<specific red flag from their data>", "<another if present>"],
  "questionsToAsk": ["<follow-up question the family should ask this hospice>", "<another>", "<another>"],
  "narrative": "<Ragna's 3-4 sentence honest narrative about this hospice — written warmly but directly, as if speaking to the family. Highlight the most important thing they should know.>"
}

Scoring rules:
- Be honest and direct. Families are making one of the most important decisions of their lives.
- A score of 80+ = Strong Candidate. 60-79 = Maybe. 40-59 = Probably Not. <40 = Absolutely Not.
- "Dodged the question" or "unclear" answers should lower scores.
- Named real facilities, named real people, gave examples = raise scores.
- Using agency staff "often" + vague after-hours = significant red flag.
- "They almost never do CHC" = serious red flag (they are discouraging a Medicare benefit).
- Trust scores the family gave in Section 7 should inform but not solely determine your assessment.
- Output ONLY the JSON object.`;

  try {
    const response = await anthropic.messages.create({
      model: MODELS.claude.smart,
      max_tokens: 1800,
      messages: [{ role: "user", content: scoringPrompt }],
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    const result = safeParseJson(raw);
    if (!result) {
      req.log.error({ raw }, "Failed to parse scoring result JSON from LLM response");
      res.status(500).json({ error: "Failed to parse scoring result" });
      return;
    }
    res.json(result);
  } catch (err: unknown) {
    req.log.error({ err }, "Error scoring hospice");
    res.status(500).json({ error: "Failed to score hospice interview" });
  }
});

export default router;
