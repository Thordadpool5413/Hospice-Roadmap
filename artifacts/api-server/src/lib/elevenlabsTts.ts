import { logger } from "./logger.js";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";
const RAGNA_VOICE_NAME = "ragna";
const MODEL_ID = "eleven_multilingual_v2";

let cachedVoiceId: string | null = null;

async function resolveRagnaVoiceId(apiKey: string): Promise<string> {
  if (cachedVoiceId) return cachedVoiceId;

  const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
    headers: { "xi-api-key": apiKey },
  });

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
  const apiKey = process.env["ELEVENLABS_API_KEY"];
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured on the server.");
  }

  const voiceId = await resolveRagnaVoiceId(apiKey);

  const response = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
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
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${body}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
