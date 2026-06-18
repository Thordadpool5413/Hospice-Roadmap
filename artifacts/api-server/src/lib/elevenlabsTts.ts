import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "./logger.js";

const RAGNA_VOICE_NAME = (process.env["ELEVENLABS_VOICE_NAME"] || "ragna").toLowerCase();
const MODEL_ID = process.env["ELEVENLABS_MODEL_ID"] || "eleven_multilingual_v2";
const ELEVENLABS_BASE = "https://api.elevenlabs.io";

const connectors = new ReplitConnectors();

let cachedVoiceId: string | null = process.env["ELEVENLABS_VOICE_ID"]?.trim() || null;

async function listVoicesViaConnector(): Promise<Array<{ voice_id: string; name: string }>> {
  const response = await connectors.proxy("elevenlabs", "/v1/voices");
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs connector voices list failed (${response.status}): ${body}`);
  }
  const payload = (await response.json()) as { voices: Array<{ voice_id: string; name: string }> };
  return payload.voices ?? [];
}

async function listVoicesViaApiKey(apiKey: string): Promise<Array<{ voice_id: string; name: string }>> {
  const response = await fetch(`${ELEVENLABS_BASE}/v1/voices`, {
    headers: {
      "xi-api-key": apiKey,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs API voices list failed (${response.status}): ${body}`);
  }
  const payload = (await response.json()) as { voices: Array<{ voice_id: string; name: string }> };
  return payload.voices ?? [];
}

async function resolveRagnaVoiceId(): Promise<string> {
  if (cachedVoiceId) return cachedVoiceId;

  const apiKey = process.env["ELEVENLABS_API_KEY"]?.trim();
  let voices: Array<{ voice_id: string; name: string }> = [];
  let source = "connector";

  try {
    voices = await listVoicesViaConnector();
  } catch (connectorErr: unknown) {
    if (!apiKey) throw connectorErr;
    source = "api_key";
    logger.warn({ err: connectorErr }, "ElevenLabs connector unavailable — falling back to ELEVENLABS_API_KEY");
    voices = await listVoicesViaApiKey(apiKey);
  }

  const match = voices.find((v) => v.name.toLowerCase() === RAGNA_VOICE_NAME);
  if (!match) {
    const names = voices.map((v) => v.name).join(", ");
    logger.warn({ availableVoices: names, source }, `ElevenLabs: no voice named "${RAGNA_VOICE_NAME}" found`);
    throw new Error(`ElevenLabs voice "${RAGNA_VOICE_NAME}" not found. Available: ${names}`);
  }

  cachedVoiceId = match.voice_id;
  logger.info({ voiceId: cachedVoiceId, source }, `ElevenLabs: resolved "${RAGNA_VOICE_NAME}" voice`);
  return cachedVoiceId;
}

async function synthesizeViaConnector(voiceId: string, text: string): Promise<Buffer> {
  const response = await connectors.proxy(
    "elevenlabs",
    `/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      body: {
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
        },
      },
      headers: {
        Accept: "audio/mpeg",
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs connector TTS failed (${response.status}): ${body}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function synthesizeViaApiKey(voiceId: string, text: string, apiKey: string): Promise<Buffer> {
  const response = await fetch(`${ELEVENLABS_BASE}/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs API TTS failed (${response.status}): ${body}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export type ElevenLabsStatus = {
  configured: boolean;
  voiceName: string;
  voiceId: string | null;
  connector: "replit" | "api_key" | "voice_id_env" | "unavailable";
  availableVoiceNames: string[];
  error: string | null;
};

export async function getElevenLabsStatus(): Promise<ElevenLabsStatus> {
  const status: ElevenLabsStatus = {
    configured: false,
    voiceName: RAGNA_VOICE_NAME,
    voiceId: cachedVoiceId,
    connector: "unavailable",
    availableVoiceNames: [],
    error: null,
  };

  if (cachedVoiceId && process.env["ELEVENLABS_VOICE_ID"]?.trim()) {
    status.configured = true;
    status.connector = "voice_id_env";
    status.voiceId = cachedVoiceId;
    return status;
  }

  const apiKey = process.env["ELEVENLABS_API_KEY"]?.trim();

  try {
    let voices: Array<{ voice_id: string; name: string }> = [];
    try {
      voices = await listVoicesViaConnector();
      status.connector = "replit";
    } catch (connectorErr: unknown) {
      if (!apiKey) throw connectorErr;
      voices = await listVoicesViaApiKey(apiKey);
      status.connector = "api_key";
    }

    status.availableVoiceNames = voices.map((v) => v.name);
    const match = voices.find((v) => v.name.toLowerCase() === RAGNA_VOICE_NAME);
    if (match) {
      status.configured = true;
      status.voiceId = match.voice_id;
    } else {
      status.error = `Voice "${RAGNA_VOICE_NAME}" not found in ElevenLabs account.`;
    }
  } catch (err: unknown) {
    status.error = err instanceof Error ? err.message : "ElevenLabs status check failed.";
  }

  return status;
}

export async function synthesizeElevenLabsSpeech(text: string): Promise<Buffer> {
  const voiceId = await resolveRagnaVoiceId();
  const apiKey = process.env["ELEVENLABS_API_KEY"]?.trim();

  try {
    return await synthesizeViaConnector(voiceId, text);
  } catch (connectorErr: unknown) {
    if (!apiKey) throw connectorErr;
    logger.warn({ err: connectorErr }, "ElevenLabs connector TTS failed — falling back to ELEVENLABS_API_KEY");
    return synthesizeViaApiKey(voiceId, text, apiKey);
  }
}