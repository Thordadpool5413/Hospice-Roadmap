import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db/schema";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { HOSPICE_SYSTEM_PROMPT } from "./systemPrompt.js";

const router: IRouter = Router();

const CLIENT_ID_REGEX = /^client_[a-z0-9_]+$/;

function requireClientId(req: Request, res: Response): string | null {
  const raw = req.header("x_client_id");
  const clientId = raw?.trim() ?? "";
  if (!clientId || !CLIENT_ID_REGEX.test(clientId)) {
    res.status(401).json({ error: "Missing or invalid client identity" });
    return null;
  }
  return clientId;
}

router.get("/conversations", async (req: Request, res: Response) => {
  const clientId = requireClientId(req, res);
  if (!clientId) return;
  try {
    const all = await db
      .select()
      .from(conversations)
      .where(eq(conversations.clientId, clientId))
      .orderBy(conversations.createdAt);
    res.json(all);
  } catch (err: unknown) {
    console.error("Error listing conversations:", err);
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/conversations", async (req: Request, res: Response) => {
  const clientId = requireClientId(req, res);
  if (!clientId) return;
  try {
    const { title } = req.body as { title: string };
    if (!title || typeof title !== "string") {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const [conv] = await db
      .insert(conversations)
      .values({ title: title.trim(), clientId })
      .returning();
    res.status(201).json(conv);
  } catch (err: unknown) {
    console.error("Error creating conversation:", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/conversations/:id", async (req: Request, res: Response) => {
  const clientId = requireClientId(req, res);
  if (!clientId) return;
  try {
    const id = Number(req.params["id"]);
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.clientId, clientId)));
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
    console.error("Error getting conversation:", err);
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.delete("/conversations/:id", async (req: Request, res: Response) => {
  const clientId = requireClientId(req, res);
  if (!clientId) return;
  try {
    const id = Number(req.params["id"]);
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.clientId, clientId)));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    await db.delete(conversations).where(and(eq(conversations.id, id), eq(conversations.clientId, clientId)));
    res.status(204).send();
  } catch (err: unknown) {
    console.error("Error deleting conversation:", err);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

router.get("/conversations/:id/messages", async (req: Request, res: Response) => {
  const clientId = requireClientId(req, res);
  if (!clientId) return;
  try {
    const id = Number(req.params["id"]);
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.clientId, clientId)));
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
    console.error("Error listing messages:", err);
    res.status(500).json({ error: "Failed to list messages" });
  }
});

router.post("/conversations/:id/messages", async (req: Request, res: Response) => {
  const clientId = requireClientId(req, res);
  if (!clientId) return;
  const id = Number(req.params["id"]);
  const { content, patientContext } = req.body as {
    content: string;
    patientContext?: string;
  };

  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "content is required" });
    return;
  }

  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.clientId, clientId)));
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

    const systemPrompt = patientContext
      ? `${HOSPICE_SYSTEM_PROMPT}\n\n═══════════════════════════════════════\nPATIENT CONTEXT FOR THIS SESSION\n═══════════════════════════════════════\n${patientContext}`
      : HOSPICE_SYSTEM_PROMPT;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    let fullResponse = "";

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
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

    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: unknown) {
    console.error("Error sending message:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send message" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
      res.end();
    }
  }
});

router.post("/profile-synthesize", async (req: Request, res: Response) => {
  const clientId = requireClientId(req, res);
  if (!clientId) return;
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

  const prompt = `You are maintaining Vera's living understanding of a family navigating the hospice journey. Vera is a hospice care AI companion. This understanding deepens with every conversation.

${currentProfile ? `Current understanding:\n${currentProfile}` : "This is the first conversation — no prior understanding yet."}

New conversation memory:
Date: ${new Date(memory.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
Summary: ${memory.summary}
Key facts: ${memory.keyFacts.join("; ")}
Emotional tone this session: ${memory.emotionalTone}
Topics discussed: ${memory.mainTopics.join(", ")}${tileContext}

Write an updated, synthesized understanding in 3-5 sentences. This is Vera's "living knowledge" of this family — not a transcript summary, but a deepening human understanding:
- Who they are (patient name/age/diagnosis if known, caregiver role and name if known)
- What they are carrying emotionally (fears, recurring worries, what seems unresolved)
- What patterns have emerged across conversations (what topics keep coming up, what they need most)
- How their emotional state has changed over time, if at all
- What Vera should keep in mind going forward — what to gently follow up on, what they may not be ready for yet

Write in third person as if Vera is describing her understanding of this family to herself. Be specific and human, not clinical. If the same concern keeps appearing, name it explicitly. If something seems unresolved, say so.

Output ONLY the 3-5 sentence paragraph. No preamble, no labels, no explanation.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 450,
      messages: [{ role: "user", content: prompt }],
    });

    const profile = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    res.json({ profile });
  } catch (err: unknown) {
    console.error("Error synthesizing profile:", err);
    res.status(500).json({ error: "Failed to synthesize profile" });
  }
});

router.post("/conversations/:id/memory", async (req: Request, res: Response) => {
  const clientId = requireClientId(req, res);
  if (!clientId) return;
  const id = Number(req.params["id"]);
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.clientId, clientId)));
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
      .map((m) => `${m.role === "user" ? "User" : "Vera"}: ${m.content}`)
      .join("\n\n");

    const memoryPrompt = `You are a memory extraction system for Vera, a hospice care AI companion. Given the following conversation transcript, extract a concise memory in JSON format that Vera can use in future sessions to feel continuous and aware of this family's journey.

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
      model: "claude-haiku-4-5",
      max_tokens: 400,
      messages: [{ role: "user", content: memoryPrompt }],
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    let memory: unknown;
    try {
      memory = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]+\}/);
      if (!jsonMatch) {
        res.status(500).json({ error: "Failed to parse memory" });
        return;
      }
      memory = JSON.parse(jsonMatch[0]);
    }

    res.json(memory);
  } catch (err: unknown) {
    console.error("Error generating memory:", err);
    res.status(500).json({ error: "Failed to generate memory" });
  }
});

export default router;
