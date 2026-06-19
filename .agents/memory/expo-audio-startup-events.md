---
name: Expo Go expo-audio startup events unreliable
description: playbackStatusUpdate isLoaded/playing never resolves in Expo Go; don't gate on it
---

## Rule
Do NOT await `playbackStatusUpdate` events (`isLoaded`/`playing`) as a startup confirmation gate in `createAndAutoplaySound`. Call `player.play()` and return immediately. The module-level lifecycle subscription already handles `didJustFinish` and cleanup.

**Why:** In Expo Go, `playbackStatusUpdate` events either fire late or never reach `isLoaded: true` + `playing: true` within any reasonable timeout. A 5-second await-for-playing gate caused every ElevenLabs playback attempt to time out and throw, which triggered `startSpeechFallback()` → iOS robot voice — even though the audio was actually ready to play.

**How to apply:** In `nativeOpenAiVoiceService.ts` `createAndAutoplaySound`, after `player.play()`, call `activateLockScreenControls` and `emitPlaybackState` immediately. No `if (!player.playing) { await new Promise... }` block. Trust that expo-audio loads and plays asynchronously; the `playbackStatusUpdate` subscription (attached before `play()`) handles all post-play lifecycle events.
