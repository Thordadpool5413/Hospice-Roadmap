import { randomUUID } from "crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";

import { HOSPICE_SYSTEM_PROMPT } from "./anthropic/systemPrompt.js";
import { MODELS } from "../config/models.js";
import { synthesizeElevenLabsSpeech } from "../lib/elevenlabsTts.js";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
  },
});

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
  "Hi, I'm Ragna. I'm here to help you understand hospice, prepare for what comes next, and feel a little less alone in the hard moments.";
const SPEECH_CACHE_TTL_MS = 10 * 60 * 1000;
const speechCache = new Map<string, { buffer: Buffer; mimeType: string; expiresAt: number }>();

function pruneSpeechCache(): void {
  const now = Date.now();
  for (const [key, value] of speechCache.entries()) {
    if (value.expiresAt <= now) {
      speechCache.delete(key);
    }
  }
}

function buildPublicBaseUrl(req: Request): string {
  const forwardedProto = req.header("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = req.header("x-forwarded-host")?.split(",")[0]?.trim();
  const proto = forwardedProto || req.protocol || "https";
  const host = forwardedHost || req.get("host") || "";
  return `${proto}://${host}`;
}

function getOpenAiApiKey(res: Response): string | null {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server." });
    return null;
  }
  return apiKey;
}

function normalizeVoice(voice: unknown): string {
  return typeof voice === "string" && ALLOWED_VOICES.has(voice) ? voice : "marin";
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

function extractAssistantText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const choices = (payload as { choices?: Array<{ message?: { content?: unknown } }> }).choices;
  const content = choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part || typeof part !== "object") return "";
        if (typeof (part as { text?: unknown }).text === "string") {
          return ((part as { text?: string }).text ?? "").trim();
        }
        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  return "";
}

router.get("/speak/:audioId", (req: Request, res: Response) => {
  pruneSpeechCache();
  const entry = speechCache.get(req.params["audioId"] as string);
  if (!entry) {
    res.status(404).json({ error: "Spoken reply audio not found or expired." });
    return;
  }

  res.setHeader("Content-Type", entry.mimeType);
  res.setHeader("Content-Length", String(entry.buffer.length));
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(entry.buffer);
});

router.head("/speak/:audioId", (req: Request, res: Response) => {
  pruneSpeechCache();
  const entry = speechCache.get(req.params["audioId"] as string);
  if (!entry) {
    res.status(404).end();
    return;
  }

  res.setHeader("Content-Type", entry.mimeType);
  res.setHeader("Content-Length", String(entry.buffer.length));
  res.setHeader("Cache-Control", "no-store");
  res.status(200).end();
});

router.post("/realtime/session", async (req: Request, res: Response) => {
  const apiKey = getOpenAiApiKey(res);
  if (!apiKey) return;

  const { sdp, patientContext, voice } = req.body as {
    sdp?: string;
    patientContext?: string;
    voice?: string;
  };

  if (!sdp || typeof sdp !== "string") {
    res.status(400).json({ error: "sdp is required" });
    return;
  }

  const selectedVoice = normalizeVoice(voice);

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
      req.log.error({ status: openAiResponse.status, body: answerSdp }, "OpenAI realtime session error");
      res
        .status(openAiResponse.status >= 400 && openAiResponse.status < 500 ? openAiResponse.status : 502)
        .json({ error: answerSdp || "Failed to create realtime voice session." });
      return;
    }

    res.type("application/sdp").send(answerSdp);
  } catch (error: unknown) {
    req.log.error({ err: error }, "Realtime voice session failure");
    res.status(500).json({ error: "Failed to create realtime voice session." });
  }
});

router.post("/mobile-transcribe", upload.single("audio"), async (req: Request, res: Response) => {
  const apiKey = getOpenAiApiKey(res);
  if (!apiKey) return;

  const file = req.file;
  if (!file?.buffer?.length) {
    res.status(400).json({ error: "An audio recording is required." });
    return;
  }

  try {
    const transcriptionForm = new FormData();
    transcriptionForm.set(
      "file",
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype || "audio/m4a" }),
      file.originalname || `voice-${Date.now()}.m4a`,
    );
    transcriptionForm.set("model", MODELS.openai.transcription);

    const transcriptionResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: transcriptionForm,
    });

    const transcriptionPayload = (await transcriptionResponse.json()) as { text?: string; error?: { message?: string } };
    const userTranscript = transcriptionPayload.text?.trim() ?? "";

    if (!transcriptionResponse.ok || !userTranscript) {
      req.log.error({ status: transcriptionResponse.status, body: transcriptionPayload }, "OpenAI transcription error");
      res.status(502).json({
        error: transcriptionPayload.error?.message || "Failed to transcribe the recorded audio.",
      });
      return;
    }

    res.json({ userTranscript });
  } catch (error: unknown) {
    req.log.error({ err: error }, "OpenAI mobile transcription failure");
    res.status(500).json({ error: "Failed to transcribe mobile audio." });
  }
});

router.post("/mobile-voice-turn", upload.single("audio"), async (req: Request, res: Response) => {
  const apiKey = getOpenAiApiKey(res);
  if (!apiKey) return;

  const file = req.file;
  if (!file?.buffer?.length) {
    res.status(400).json({ error: "An audio recording is required." });
    return;
  }

  const patientContext = typeof req.body?.patientContext === "string" ? req.body.patientContext : "";
  const selectedVoice = normalizeVoice(req.body?.voice);

  try {
    const transcriptionForm = new FormData();
    transcriptionForm.set(
      "file",
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype || "audio/m4a" }),
      file.originalname || `voice-${Date.now()}.m4a`,
    );
    transcriptionForm.set("model", MODELS.openai.transcription);

    const transcriptionResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: transcriptionForm,
    });

    const transcriptionPayload = (await transcriptionResponse.json()) as { text?: string; error?: { message?: string } };
    const userTranscript = transcriptionPayload.text?.trim() ?? "";

    if (!transcriptionResponse.ok || !userTranscript) {
      req.log.error({ status: transcriptionResponse.status, body: transcriptionPayload }, "OpenAI transcription error");
      res.status(502).json({
        error: transcriptionPayload.error?.message || "Failed to transcribe the recorded audio.",
      });
      return;
    }

    const completionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELS.openai.chat,
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content: buildVoiceInstructions(patientContext),
          },
          {
            role: "user",
            content: userTranscript,
          },
        ],
      }),
    });

    const completionPayload = await completionResponse.json();
    const assistantTranscript = extractAssistantText(completionPayload);

    if (!completionResponse.ok || !assistantTranscript) {
      req.log.error({ status: completionResponse.status, body: completionPayload }, "OpenAI chat completion error");
      res.status(502).json({ error: "Failed to generate a spoken response." });
      return;
    }

    let audioBuffer: Buffer;
    try {
      audioBuffer = await synthesizeElevenLabsSpeech(assistantTranscript);
    } catch (elErr: unknown) {
      req.log.warn({ err: elErr }, "ElevenLabs TTS failed for voice-turn, falling back to OpenAI TTS");
      const speechResponse = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODELS.openai.tts,
          voice: selectedVoice,
          input: assistantTranscript,
          format: "mp3",
        }),
      });

      if (!speechResponse.ok) {
        const speechError = await speechResponse.text();
        req.log.error({ status: speechResponse.status, body: speechError }, "OpenAI speech generation error");
        res.status(502).json({ error: speechError || "Failed to generate reply audio." });
        return;
      }
      audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
    }

    const audioBase64 = audioBuffer.toString("base64");

    res.json({
      userTranscript,
      assistantTranscript,
      audioBase64,
      audioMimeType: "audio/mpeg",
    });
  } catch (error: unknown) {
    req.log.error({ err: error }, "OpenAI mobile voice turn failure");
    res.status(500).json({ error: "Failed to process mobile voice turn." });
  }
});

router.post("/speak", async (req: Request, res: Response) => {
  const apiKey = getOpenAiApiKey(res);
  if (!apiKey) return;

  const { voice, text } = req.body as {
    voice?: string;
    text?: string;
  };

  const selectedVoice = normalizeVoice(voice);
  const speakText = typeof text === "string" ? text.trim().slice(0, 4000) : "";
  if (!speakText) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  try {
    let audioBuffer: Buffer;
    try {
      audioBuffer = await synthesizeElevenLabsSpeech(speakText);
    } catch (elErr: unknown) {
      req.log.warn({ err: elErr }, "ElevenLabs TTS failed for speak, falling back to OpenAI TTS");
      const speechResponse = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODELS.openai.tts,
          voice: selectedVoice,
          input: speakText,
          format: "mp3",
        }),
      });

      if (!speechResponse.ok) {
        const speechError = await speechResponse.text();
        req.log.error({ status: speechResponse.status, body: speechError }, "OpenAI speech generation error");
        res.status(502).json({ error: speechError || "Failed to generate reply audio." });
        return;
      }
      audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
    }

    pruneSpeechCache();
    const audioBase64 = audioBuffer.toString("base64");
    const audioId = randomUUID();
    speechCache.set(audioId, {
      buffer: audioBuffer,
      mimeType: "audio/mpeg",
      expiresAt: Date.now() + SPEECH_CACHE_TTL_MS,
    });

    res.json({
      audioBase64,
      audioUrl: `${buildPublicBaseUrl(req)}/api/openai/speak/${audioId}`,
      audioMimeType: "audio/mpeg",
    });
  } catch (error: unknown) {
    req.log.error({ err: error }, "OpenAI speak failure");
    res.status(500).json({ error: "Failed to generate reply audio." });
  }
});

router.post("/preview", async (req: Request, res: Response) => {
  const apiKey = getOpenAiApiKey(res);
  if (!apiKey) return;

  const { voice, text } = req.body as {
    voice?: string;
    text?: string;
  };

  const selectedVoice = normalizeVoice(voice);
  const previewText =
    typeof text === "string" && text.trim().length > 0
      ? text.trim().slice(0, 280)
      : DEFAULT_PREVIEW_TEXT;

  try {
    let audioBuffer: Buffer;
    try {
      audioBuffer = await synthesizeElevenLabsSpeech(previewText);
    } catch (elErr: unknown) {
      req.log.warn({ err: elErr }, "ElevenLabs TTS failed for preview, falling back to OpenAI TTS");
      const openAiResponse = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODELS.openai.tts,
          voice: selectedVoice,
          input: previewText,
          format: "mp3",
        }),
      });

      if (!openAiResponse.ok) {
        const errorBody = await openAiResponse.text();
        req.log.error({ status: openAiResponse.status, body: errorBody }, "OpenAI voice preview error");
        res
          .status(openAiResponse.status >= 400 && openAiResponse.status < 500 ? openAiResponse.status : 502)
          .json({ error: errorBody || "Failed to generate voice preview." });
        return;
      }
      audioBuffer = Buffer.from(await openAiResponse.arrayBuffer());
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(audioBuffer);
  } catch (error: unknown) {
    req.log.error({ err: error }, "OpenAI voice preview failure");
    res.status(500).json({ error: "Failed to generate voice preview." });
  }
});

export default router;
