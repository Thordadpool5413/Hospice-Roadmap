import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "./logger.js";

const RAGNA_VOICE_NAME = "ragna";
const MODEL_ID = "eleven_multilingual_v2";

const connectors = new ReplitConnectors();

let cachedVoiceId: string | null = null;

async function resolveRagnaVoiceId(): Promise<string> {
  if (cachedVoiceId) return cachedVoiceId;

  const response = await connectors.proxy("elevenlabs", "/v1/voices");

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs voices list failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as { voices: Array<{ voice_id: string; name: string }> };
  const match = payload.voices.find(
    (v) => v.name.toLowerCase() === RAGNA_VOICE_NAME,
  );

  if (!match) {
    const names = payload.voices.map((v) => v.name).join(", ");
    logger.warn({ availableVoices: names }, `ElevenLabs: no voice named "${RAGNA_VOICE_NAME}" found`);
    throw new Error(`ElevenLabs voice "${RAGNA_VOICE_NAME}" not found. Available: ${names}`);
  }

  cachedVoiceId = match.voice_id;
  logger.info({ voiceId: cachedVoiceId }, `ElevenLabs: resolved "${RAGNA_VOICE_NAME}" voice`);
  return cachedVoiceId;
}

export async function synthesizeElevenLabsSpeech(text: string): Promise<Buffer> {
  const voiceId = await resolveRagnaVoiceId();

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
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${body}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
