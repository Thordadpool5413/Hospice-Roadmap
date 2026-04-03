import { Router, type IRouter, type Request, type Response } from "express";

import { HOSPICE_SYSTEM_PROMPT } from "./anthropic/systemPrompt.js";

const router: IRouter = Router();

const CLIENT_ID_REGEX = /^client_[a-z0-9_]+$/;
const ALLOWED_VOICES = new Set([
  "alloy",
  "ash",
  "ballad",
  "cedar",
  "coral",
  "echo",
  "marin",
  "sage",
  "shimmer",
  "verse",
]);
const DEFAULT_PREVIEW_TEXT =
  "Hi, I’m Ragna. I’m here to help you understand hospice, prepare for what comes next, and feel a little less alone in the hard moments.";

function requireClientId(req: Request, res: Response): string | null {
  const raw = req.header("x_client_id");
  const clientId = raw?.trim() ?? "";
  if (!clientId || !CLIENT_ID_REGEX.test(clientId)) {
    res.status(401).json({ error: "Missing or invalid client identity" });
    return null;
  }
  return clientId;
}

function buildVoiceInstructions(patientContext: string): string {
  return [
    HOSPICE_SYSTEM_PROMPT,
    "VOICE MODE GUIDANCE: Speak naturally, warmly, and clearly. Keep answers concise unless the person asks for more. Ask one follow up question at a time. If something sounds urgent, say so plainly and encourage immediate contact with the hospice team or emergency services when appropriate.",
    patientContext
      ? `PATIENT CONTEXT FOR THIS SESSION:\n${patientContext.slice(0, 12000)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

router.post("/realtime/session", async (req: Request, res: Response) => {
  const clientId = requireClientId(req, res);
  if (!clientId) return;

  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server." });
    return;
  }

  const { sdp, patientContext, voice } = req.body as {
    sdp?: string;
    patientContext?: string;
    voice?: string;
  };

  if (!sdp || typeof sdp !== "string") {
    res.status(400).json({ error: "sdp is required" });
    return;
  }

  const selectedVoice =
    typeof voice === "string" && ALLOWED_VOICES.has(voice) ? voice : "marin";

  try {
    const form = new FormData();
    form.set("sdp", sdp);
    form.set(
      "session",
      JSON.stringify({
        type: "realtime",
        model: "gpt-realtime",
        instructions: buildVoiceInstructions(
          typeof patientContext === "string" ? patientContext : "",
        ),
        audio: {
          output: {
            voice: selectedVoice,
          },
        },
      }),
    );

    const openAiResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });

    const answerSdp = await openAiResponse.text();

    if (!openAiResponse.ok) {
      console.error("OpenAI realtime session error:", {
        clientId,
        status: openAiResponse.status,
        body: answerSdp,
      });
      res
        .status(openAiResponse.status >= 400 && openAiResponse.status < 500 ? openAiResponse.status : 502)
        .json({ error: answerSdp || "Failed to create realtime voice session." });
      return;
    }

    res.type("application/sdp").send(answerSdp);
  } catch (error: unknown) {
    console.error("Realtime voice session failure:", error);
    res.status(500).json({ error: "Failed to create realtime voice session." });
  }
});

router.post("/preview", async (req: Request, res: Response) => {
  const clientId = requireClientId(req, res);
  if (!clientId) return;

  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server." });
    return;
  }

  const { voice, text } = req.body as {
    voice?: string;
    text?: string;
  };

  const selectedVoice =
    typeof voice === "string" && ALLOWED_VOICES.has(voice) ? voice : "marin";
  const previewText =
    typeof text === "string" && text.trim().length > 0
      ? text.trim().slice(0, 280)
      : DEFAULT_PREVIEW_TEXT;

  try {
    const openAiResponse = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: selectedVoice,
        input: previewText,
        format: "mp3",
      }),
    });

    if (!openAiResponse.ok) {
      const errorBody = await openAiResponse.text();
      console.error("OpenAI voice preview error:", {
        clientId,
        status: openAiResponse.status,
        body: errorBody,
      });
      res
        .status(openAiResponse.status >= 400 && openAiResponse.status < 500 ? openAiResponse.status : 502)
        .json({ error: errorBody || "Failed to generate voice preview." });
      return;
    }

    const audioBuffer = Buffer.from(await openAiResponse.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(audioBuffer);
  } catch (error: unknown) {
    console.error("OpenAI voice preview failure:", error);
    res.status(500).json({ error: "Failed to generate voice preview." });
  }
});

export default router;
