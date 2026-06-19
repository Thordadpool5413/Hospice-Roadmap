---
name: liveSpeechPreviewEnabled blocks ElevenLabs in chat tab
description: Setting liveSpeechPreviewEnabled=true on iOS hard-routes to Speech.speak() and prevents ElevenLabs from ever being called
---

## Rule
Keep `liveSpeechPreviewEnabled = false` in `help.tsx`. Do not set it based on `Platform.OS === "ios"`.

**Why:** When `liveSpeechPreviewEnabled` is `true`:
1. Every streaming token chunk calls `enqueueLiveSpeechPreview(chunk)` → `Speech.speak()` → iOS robot voice fires during streaming.
2. The streaming-complete callback hits `if (shouldSpeakLive) { finalizeLiveSpeechPreview(); return; }` — an **early return** that prevents `synthesizeAssistantVoice()` from ever being called. ElevenLabs TTS is completely unreachable on iOS when this flag is true.

Setting it to `false` means:
- No `Speech.speak()` during streaming
- `synthesizeAssistantVoice()` is called after streaming completes → ElevenLabs path is reached

**How to apply:** In `help.tsx` around line 350, the declaration should be `const liveSpeechPreviewEnabled = false;`. Do not restore the `nativeVoiceSupported && Platform.OS === "ios"` expression without also restructuring the streaming-complete callback to not early-return before `synthesizeAssistantVoice()`.
