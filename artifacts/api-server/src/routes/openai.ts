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

export default router;
