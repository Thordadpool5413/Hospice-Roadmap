---
name: ElevenLabs audio URL auth bug
description: iOS expo-audio player can't send auth tokens when fetching audio URLs — must register the audio cache GET endpoint as a public route before requireAuth.
---

# ElevenLabs audio cache URL must be a public route

## Rule
`GET /openai/speak/:audioId` (the audio cache playback endpoint) must be registered as a public route — BEFORE `requireAuth` — in `routes/index.ts`. The matching `POST /openai/speak` (which generates the audio) stays auth-protected.

## Why
`expo-audio`'s `createAudioPlayer({ uri })` makes a plain HTTP GET without any Authorization header. When the cache endpoint was inside the `router.use("/openai", requireAuth, ...)` block, the audio player got a 401 JSON response, failed to parse it as audio, threw "Audio playback did not start," and the app fell through to the expo-speech device-TTS fallback. The user heard the phone's built-in robot voice instead of ElevenLabs.

## How to apply
- The shared cache lives in `artifacts/api-server/src/lib/speechCache.ts` (module-level Map, 10-min TTL, UUID keys).
- `openai.ts` imports `setSpeechCacheEntry` / `pruneSpeechCache` to write into it.
- `routes/index.ts` imports `getSpeechCacheEntry` / `pruneSpeechCache` to serve the public GET and HEAD routes.
- The UUID key makes the endpoint practically unguessable; no sensitive data is stored in the cache.
- Do NOT re-add the GET/HEAD handlers inside the `openai.ts` auth-protected router — they are intentionally absent from there.
