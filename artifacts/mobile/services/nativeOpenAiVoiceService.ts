import {
  AudioModule,
  RecordingPresets,
  createAudioPlayer,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from "expo-audio";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import * as Speech from "expo-speech";
import { Image, Platform } from "react-native";

import { getAuthToken } from "@workspace/api-client-react";

import { getClientId } from "./clientIdentity";
import { apiBase, mergeJsonHeaders } from "./apiClient";

export interface NativeOpenAiVoiceTranscriptResult {
  userTranscript: string;
}

export interface NativeOpenAiVoiceTurnResult {
  userTranscript: string;
  assistantTranscript: string;
  didAutoPlayAudio: boolean;
  autoPlayErrorMessage?: string;
  usedSpeechFallback?: boolean;
}

interface StopNativeOpenAiVoiceRecordingAndSendOptions {
  patientContext?: string;
  voice?: string;
}

export interface NativeOpenAiVoicePlaybackResult {
  audioBase64?: string;
  audioMimeType?: string;
  audioUrl?: string;
  didAutoPlayAudio: boolean;
  autoPlayErrorMessage?: string;
  usedSpeechFallback?: boolean;
}

export interface NativeOpenAiVoicePlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
}

type ActiveRecorder = InstanceType<typeof AudioModule.AudioRecorder>;

let activeRecording: ActiveRecorder | null = null;
let activeSound: AudioPlayer | null = null;
let activeSoundSubscription: { remove: () => void } | null = null;
let fallbackSpeechText: string | null = null;
let isUsingSpeechFallback = false;
// Tracks how many characters of `fallbackSpeechText` have already been
// spoken. Updated from `Speech.speak`'s `onBoundary` callback so that when
// the device cannot natively resume (e.g. AirPods pause on iOS without
// `Speech.resume`), we can re-speak only the remainder instead of starting
// the reply over from the beginning.
let spokenCharOffset = 0;
let speechCarrierPlayer: AudioPlayer | null = null;
let speechCarrierSubscription: { remove: () => void } | null = null;
let silentCarrierUri: string | null = null;
let suppressSpeechCarrierBridge = false;
let playbackState: NativeOpenAiVoicePlaybackState = {
  isPlaying: false,
  isPaused: false,
};
const playbackListeners = new Set<
  (state: NativeOpenAiVoicePlaybackState) => void
>();

function emitPlaybackState(nextState: NativeOpenAiVoicePlaybackState): void {
  playbackState = nextState;
  playbackListeners.forEach((listener) => listener(nextState));
}

function isExpoGoStoreClient(): boolean {
  const executionEnvironment = (Constants as { executionEnvironment?: string })
    .executionEnvironment;
  const appOwnership = (Constants as { appOwnership?: string }).appOwnership;
  return executionEnvironment === "storeClient" || appOwnership === "expo";
}

function getSpeechControls(): {
  pause?: () => void;
  resume?: () => void;
  stop?: () => void;
} {
  return Speech as unknown as {
    pause?: () => void;
    resume?: () => void;
    stop?: () => void;
  };
}

async function configureRecordingMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    interruptionMode: "doNotMix",
    shouldPlayInBackground: false,
  });
}

async function configurePlaybackMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
    interruptionMode: "doNotMix",
    shouldPlayInBackground: true,
  });
}

interface LockScreenMetadata {
  title: string;
  artist: string;
  albumTitle?: string;
  artworkUrl?: string;
}

async function authClientHeaders(): Promise<Record<string, string>> {
  const [token, clientId] = await Promise.all([getAuthToken(), getClientId()]);
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    x_client_id: clientId,
  };
}

const LOCK_SCREEN_DEFAULTS = {
  title: "Ragna",
  artist: "Hospice Roadmap",
} as const;

let ragnaArtworkUrl: string | undefined;
function getRagnaArtworkUrl(): string | undefined {
  if (ragnaArtworkUrl !== undefined) return ragnaArtworkUrl || undefined;
  try {
    const resolved = Image.resolveAssetSource(
      require("../assets/images/ragna-lockscreen.png"),
    );
    ragnaArtworkUrl = resolved?.uri ?? "";
    return ragnaArtworkUrl || undefined;
  } catch (err) {
    console.warn("[voice] resolve ragna artwork failed", err);
    ragnaArtworkUrl = "";
    return undefined;
  }
}

// Strip markdown noise then take the first sentence (or a hard-trimmed
// prefix) so the lock-screen subtitle stays glanceable.
function summarizeReplyForLockScreen(text: string | null | undefined): string | undefined {
  if (!text) return undefined;
  const cleaned = text
    .replace(/[#*_`>~]+/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return undefined;
  const sentenceMatch = cleaned.match(/^(.+?[.!?])(\s|$)/);
  let summary = sentenceMatch ? sentenceMatch[1] : cleaned;
  const MAX = 120;
  if (summary.length > MAX) {
    summary = summary.slice(0, MAX - 1).trimEnd() + "…";
  }
  return summary;
}

let currentReplySummary: string | undefined;
const replySummaryListeners = new Set<(summary: string | undefined) => void>();

function setCurrentReplySummary(summary: string | undefined): void {
  if (summary === currentReplySummary) return;
  currentReplySummary = summary;
  replySummaryListeners.forEach((listener) => listener(summary));
}

export function subscribeNativeOpenAiVoiceReplySummary(
  listener: (summary: string | undefined) => void,
): () => void {
  replySummaryListeners.add(listener);
  listener(currentReplySummary);
  return () => {
    replySummaryListeners.delete(listener);
  };
}

function buildLockScreenMetadata(summary?: string): LockScreenMetadata {
  const artworkUrl = getRagnaArtworkUrl();
  const trimmed = summary?.trim();
  const meta: LockScreenMetadata = {
    title: trimmed && trimmed.length > 0 ? trimmed : LOCK_SCREEN_DEFAULTS.title,
    artist: LOCK_SCREEN_DEFAULTS.artist,
  };
  if (trimmed && trimmed.length > 0) {
    meta.albumTitle = LOCK_SCREEN_DEFAULTS.title;
  }
  if (artworkUrl) {
    meta.artworkUrl = artworkUrl;
  }
  return meta;
}

function activateLockScreenControls(player: AudioPlayer): void {
  try {
    player.setActiveForLockScreen(
      true,
      buildLockScreenMetadata(currentReplySummary),
      {
        showSeekForward: false,
        showSeekBackward: false,
      },
    );
  } catch (err) {
    console.warn("[voice] setActiveForLockScreen failed", err);
  }
}

function getActiveLockScreenPlayer(): AudioPlayer | null {
  return activeSound ?? speechCarrierPlayer ?? null;
}

function applyLockScreenSummary(summary: string | undefined): void {
  setCurrentReplySummary(summary);
  const player = getActiveLockScreenPlayer();
  if (!player) return;
  try {
    player.updateLockScreenMetadata(buildLockScreenMetadata(summary));
  } catch (err) {
    console.warn("[voice] updateLockScreenMetadata failed", err);
  }
}

function deactivateLockScreenControls(player: AudioPlayer): void {
  try {
    player.clearLockScreenControls();
  } catch (err) {
    console.warn("[voice] clearLockScreenControls failed", err);
  }
}

// A tiny silent WAV used as a "carrier" audio track so the lock-screen,
// CarPlay, and Android Auto media session stay attached to a real
// AudioPlayer while we are speaking through expo-speech as a fallback.
// Expo-audio's native MediaController wires MPRemoteCommandCenter (iOS) and
// MediaSession (Android) directly to whichever AudioPlayer is currently
// active for lock screen, so giving the fallback path its own carrier lets
// AirPods / Bluetooth / car head-units drive it the same way they drive the
// real audio path.
function buildSilentWavBase64(seconds: number): string {
  const sampleRate = 8000;
  const numSamples = Math.max(1, Math.floor(sampleRate * seconds));
  const bytesPerSample = 2;
  const dataSize = numSamples * bytesPerSample;
  const totalSize = 44 + dataSize;

  const buf = new Uint8Array(totalSize);
  const dv = new DataView(buf.buffer);
  // "RIFF"
  buf[0] = 0x52; buf[1] = 0x49; buf[2] = 0x46; buf[3] = 0x46;
  dv.setUint32(4, totalSize - 8, true);
  // "WAVE"
  buf[8] = 0x57; buf[9] = 0x41; buf[10] = 0x56; buf[11] = 0x45;
  // "fmt "
  buf[12] = 0x66; buf[13] = 0x6d; buf[14] = 0x74; buf[15] = 0x20;
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); // PCM
  dv.setUint16(22, 1, true); // mono
  dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, sampleRate * bytesPerSample, true);
  dv.setUint16(32, bytesPerSample, true);
  dv.setUint16(34, 16, true);
  // "data"
  buf[36] = 0x64; buf[37] = 0x61; buf[38] = 0x74; buf[39] = 0x61;
  dv.setUint32(40, dataSize, true);
  // Sample data already zero-filled = silence for signed 16-bit PCM.

  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  const encoder = (
    globalThis as unknown as { btoa?: (input: string) => string }
  ).btoa;
  if (!encoder) {
    throw new Error("Base64 encoder not available on this runtime.");
  }
  return encoder(binary);
}

async function ensureSilentCarrierUri(): Promise<string> {
  if (silentCarrierUri) return silentCarrierUri;
  const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDir) {
    throw new Error("Unable to access local storage for silent carrier.");
  }
  const uri = `${baseDir}ragna-silent-carrier.wav`;
  const base64 = buildSilentWavBase64(1);
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  silentCarrierUri = uri;
  return uri;
}

async function stopSpeechCarrier(): Promise<void> {
  const player = speechCarrierPlayer;
  const sub = speechCarrierSubscription;
  speechCarrierPlayer = null;
  speechCarrierSubscription = null;
  if (!player) return;
  try {
    sub?.remove();
  } catch {
    // ignore
  }
  try {
    deactivateLockScreenControls(player);
  } catch {
    // ignore
  }
  try {
    player.pause();
  } catch {
    // ignore
  }
  try {
    player.remove();
  } catch {
    // ignore
  }
}

async function startSpeechCarrier(): Promise<void> {
  await stopSpeechCarrier();
  try {
    const uri = await ensureSilentCarrierUri();
    const carrier = createAudioPlayer(
      { uri },
      { keepAudioSessionActive: true },
    );
    carrier.loop = true;
    carrier.volume = 0;
    speechCarrierPlayer = carrier;

    const subscription = carrier.addListener(
      "playbackStatusUpdate",
      (status: AudioStatus) => {
        if (!status.isLoaded) return;
        if (suppressSpeechCarrierBridge) return;
        if (!isUsingSpeechFallback) return;
        if (speechCarrierPlayer !== carrier) return;

        const controls = getSpeechControls();
        if (status.playing && playbackState.isPaused && fallbackSpeechText) {
          // Remote command (AirPods / BT / lock screen / Android Auto) said
          // "play" — resume speech to match.
          if (controls.resume) {
            controls.resume();
            emitPlaybackState({ isPlaying: true, isPaused: false });
          } else {
            // Older expo-speech builds lack pause/resume. Re-speak from the
            // last spoken word so the caregiver picks up where they left
            // off, not from the start of the reply.
            startSpeechFallback(fallbackSpeechText, {
              startOffset: spokenCharOffset,
            }).catch(() => {});
          }
        } else if (!status.playing && !playbackState.isPaused) {
          // Remote command said "pause" — mirror that on the speech engine.
          controls.pause?.();
          emitPlaybackState({ isPlaying: true, isPaused: true });
        }
      },
    );
    speechCarrierSubscription = subscription;

    carrier.play();
    activateLockScreenControls(carrier);
  } catch (err) {
    console.warn("[voice] silent speech carrier failed", err);
    await stopSpeechCarrier();
  }
}

function pauseSpeechCarrier(): void {
  const carrier = speechCarrierPlayer;
  if (!carrier) return;
  suppressSpeechCarrierBridge = true;
  try {
    carrier.pause();
  } catch {
    // ignore
  } finally {
    suppressSpeechCarrierBridge = false;
  }
}

function resumeSpeechCarrier(): void {
  const carrier = speechCarrierPlayer;
  if (!carrier) return;
  suppressSpeechCarrierBridge = true;
  try {
    carrier.play();
  } catch {
    // ignore
  } finally {
    suppressSpeechCarrierBridge = false;
  }
}

function stopSpeechFallback(clearText = false): void {
  const controls = getSpeechControls();
  controls.stop?.();
  isUsingSpeechFallback = false;
  if (clearText) {
    fallbackSpeechText = null;
    setCurrentReplySummary(undefined);
    spokenCharOffset = 0;
  }
  void stopSpeechCarrier();
  emitPlaybackState({ isPlaying: false, isPaused: false });
}

async function startSpeechFallback(
  text: string,
  options: { startOffset?: number } = {},
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  await stopActiveSound();
  await configurePlaybackMode();

  fallbackSpeechText = trimmed;
  isUsingSpeechFallback = true;
  setCurrentReplySummary(summarizeReplyForLockScreen(trimmed));
  emitPlaybackState({ isPlaying: true, isPaused: false });

  // Clamp the requested resume offset to the bounds of the reply. If we
  // somehow get a stale or invalid offset, fall back to speaking the full
  // text rather than dropping any of it.
  const requestedOffset = Math.max(0, options.startOffset ?? 0);
  const baseOffset =
    requestedOffset >= trimmed.length ? 0 : requestedOffset;
  const remainder = baseOffset > 0 ? trimmed.slice(baseOffset) : trimmed;
  spokenCharOffset = baseOffset;

  // Start the silent carrier first so AirPods / Bluetooth / lock-screen /
  // CarPlay / Android Auto transport buttons have something registered to
  // talk to while expo-speech is reading the reply.
  await startSpeechCarrier();
  applyLockScreenSummary(currentReplySummary);

  Speech.speak(remainder, {
    language: "en-US",
    onBoundary: (event: { charIndex?: number; charLength?: number }) => {
      // `charIndex` is relative to the string handed to Speech.speak, so
      // translate it back to an absolute offset within fallbackSpeechText.
      // Some platforms omit `charLength`; treating it as 0 still moves the
      // offset forward word-by-word as boundaries fire.
      const charIndex =
        typeof event?.charIndex === "number" && event.charIndex >= 0
          ? event.charIndex
          : 0;
      const charLength =
        typeof event?.charLength === "number" && event.charLength > 0
          ? event.charLength
          : 0;
      const next = baseOffset + charIndex + charLength;
      if (next > spokenCharOffset && next <= trimmed.length) {
        spokenCharOffset = next;
      }
    },
    onDone: () => {
      isUsingSpeechFallback = false;
      spokenCharOffset = 0;
      void stopSpeechCarrier();
      emitPlaybackState({ isPlaying: false, isPaused: false });
    },
    onStopped: () => {
      // Intentionally preserve `spokenCharOffset` here — `Speech.stop` is
      // also what we call to pause on devices without native pause/resume,
      // and we need the offset to be available so the next resume picks up
      // from where the caregiver left off.
      isUsingSpeechFallback = false;
      void stopSpeechCarrier();
      emitPlaybackState({ isPlaying: false, isPaused: false });
    },
    onError: () => {
      isUsingSpeechFallback = false;
      spokenCharOffset = 0;
      void stopSpeechCarrier();
      emitPlaybackState({ isPlaying: false, isPaused: false });
    },
  });
}

async function stopActiveSound(): Promise<void> {
  if (!activeSound) {
    if (!isUsingSpeechFallback) {
      emitPlaybackState({ isPlaying: false, isPaused: false });
    }
    return;
  }
  const sound = activeSound;
  const subscription = activeSoundSubscription;
  activeSound = null;
  activeSoundSubscription = null;
  try {
    sound.pause();
  } catch (err) {
    console.warn("[voice] sound.pause failed", err);
  }
  try {
    subscription?.remove();
  } catch (err) {
    console.warn("[voice] sound listener remove failed", err);
  }
  deactivateLockScreenControls(sound);
  try {
    sound.remove();
  } catch (err) {
    console.warn("[voice] sound.remove failed", err);
  }
  setCurrentReplySummary(undefined);
  emitPlaybackState({ isPlaying: false, isPaused: false });
}

export function subscribeNativeOpenAiVoicePlayback(
  listener: (state: NativeOpenAiVoicePlaybackState) => void,
): () => void {
  playbackListeners.add(listener);
  listener(playbackState);
  return () => {
    playbackListeners.delete(listener);
  };
}

export function isNativeOpenAiVoiceSupported(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

export async function startNativeOpenAiVoiceRecording(): Promise<void> {
  if (!isNativeOpenAiVoiceSupported()) {
    throw new Error(
      "Native voice recording is only available on iPhone and Android builds.",
    );
  }

  await stopActiveSound();
  stopSpeechFallback(true);

  const permission = await requestRecordingPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Microphone permission is required to use voice chat.");
  }

  if (activeRecording) {
    try {
      await activeRecording.stop();
    } catch (err) {
      console.warn("[voice] stop previous recording failed", err);
    }
    activeRecording = null;
  }

  await configureRecordingMode();

  const recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
  await recorder.prepareToRecordAsync();
  recorder.record();
  activeRecording = recorder;
}

async function createAndAutoplaySound(
  source: { uri: string },
  cleanupUri?: string,
): Promise<void> {
  // keepAudioSessionActive keeps the audio session (and the iOS
  // MPRemoteCommandCenter / Android MediaSession wiring) alive across short
  // pauses, so an AirPods or CarPlay "play" after a pause still resumes the
  // same player instead of being dropped.
  const player = createAudioPlayer(source, { keepAudioSessionActive: true });
  activeSound = player;

  const subscription = player.addListener(
    "playbackStatusUpdate",
    (status: AudioStatus) => {
      if (!status.isLoaded) return;

      if (status.didJustFinish) {
        if (activeSound === player) {
          activeSound = null;
          activeSoundSubscription = null;
        }
        try {
          subscription.remove();
        } catch {
          // ignore
        }
        deactivateLockScreenControls(player);
        try {
          player.remove();
        } catch (err) {
          console.warn("[voice] sound.remove after finish failed", err);
        }
        if (cleanupUri) {
          FileSystem.deleteAsync(cleanupUri, { idempotent: true }).catch(
            () => {},
          );
        }
        setCurrentReplySummary(undefined);
        emitPlaybackState({ isPlaying: false, isPaused: false });
        return;
      }

      if (status.playing) {
        emitPlaybackState({ isPlaying: true, isPaused: false });
        return;
      }

      if (activeSound === player && status.currentTime > 0) {
        emitPlaybackState({ isPlaying: true, isPaused: true });
      }
    },
  );
  activeSoundSubscription = subscription;

  try {
    player.volume = 1;
    player.play();

    if (!player.playing) {
      await new Promise<void>((resolve) => setTimeout(resolve, 150));
    }

    if (!player.playing) {
      throw new Error("Audio playback did not start.");
    }

    activateLockScreenControls(player);
    emitPlaybackState({ isPlaying: true, isPaused: false });
  } catch (error) {
    if (activeSound === player) {
      activeSound = null;
      activeSoundSubscription = null;
    }
    try {
      subscription.remove();
    } catch {
      // ignore
    }
    deactivateLockScreenControls(player);
    try {
      player.remove();
    } catch (err) {
      console.warn("[voice] sound.remove after error failed", err);
    }
    if (cleanupUri) {
      FileSystem.deleteAsync(cleanupUri, { idempotent: true }).catch(() => {});
    }
    throw error;
  }
}

async function playFromBase64(
  audioBase64: string,
  audioMimeType?: string,
): Promise<void> {
  const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDir) {
    throw new Error("Unable to access local storage for audio playback.");
  }

  const extension = (audioMimeType || "audio/mpeg").includes("mpeg")
    ? "mp3"
    : "m4a";
  const fileUri = `${baseDir}ragna-voice-reply-${Date.now()}.${extension}`;
  await FileSystem.writeAsStringAsync(fileUri, audioBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  try {
    await createAndAutoplaySound({ uri: fileUri }, fileUri);
  } catch (error) {
    FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
    throw error;
  }
}

function shouldPreferAudioUrl(audioUrl?: string): boolean {
  return Boolean(audioUrl) && (isExpoGoStoreClient() || Platform.OS === "ios");
}

async function playAudioReply({
  audioBase64,
  audioMimeType,
  audioUrl,
  assistantTranscript,
}: {
  audioBase64?: string;
  audioMimeType?: string;
  audioUrl?: string;
  assistantTranscript?: string;
}): Promise<void> {
  await stopActiveSound();
  stopSpeechFallback();
  await configurePlaybackMode();
  setCurrentReplySummary(summarizeReplyForLockScreen(assistantTranscript));

  if (shouldPreferAudioUrl(audioUrl) && audioUrl) {
    await createAndAutoplaySound({ uri: audioUrl });
    return;
  }

  if (audioBase64) {
    try {
      await playFromBase64(audioBase64, audioMimeType);
      return;
    } catch (error) {
      if (audioUrl) {
        await createAndAutoplaySound({ uri: audioUrl });
        return;
      }
      throw error;
    }
  }

  if (audioUrl) {
    await createAndAutoplaySound({ uri: audioUrl });
    return;
  }

  throw new Error("Ragna's voice reply could not be played on this device.");
}

export async function playNativeOpenAiVoiceAudio({
  audioBase64,
  audioMimeType,
  audioUrl,
  assistantTranscript,
}: {
  audioBase64?: string;
  audioMimeType?: string;
  audioUrl?: string;
  assistantTranscript?: string;
}): Promise<void> {
  await playAudioReply({ audioBase64, audioMimeType, audioUrl, assistantTranscript });
}

export function updateNativeOpenAiVoiceReplySummary(text: string | null | undefined): void {
  applyLockScreenSummary(summarizeReplyForLockScreen(text));
}

export async function pauseNativeOpenAiVoicePlayback(): Promise<void> {
  if (activeSound) {
    activeSound.pause();
    emitPlaybackState({ isPlaying: true, isPaused: true });
    return;
  }

  if (isUsingSpeechFallback) {
    const controls = getSpeechControls();
    if (controls.pause) {
      controls.pause();
      pauseSpeechCarrier();
      emitPlaybackState({ isPlaying: true, isPaused: true });
      return;
    }
    // Older expo-speech builds have no `pause`. Stop the engine but keep
    // `fallbackSpeechText` and `spokenCharOffset` intact so the caregiver
    // can resume from where they left off; report a paused (not stopped)
    // state so the UI surfaces a resume affordance.
    controls.stop?.();
    isUsingSpeechFallback = false;
    void stopSpeechCarrier();
    emitPlaybackState({ isPlaying: true, isPaused: true });
  }
}

export async function resumeNativeOpenAiVoicePlayback(): Promise<void> {
  if (activeSound) {
    activeSound.play();
    emitPlaybackState({ isPlaying: true, isPaused: false });
    return;
  }

  if (fallbackSpeechText) {
    const controls = getSpeechControls();
    if (isUsingSpeechFallback && controls.resume) {
      controls.resume();
      resumeSpeechCarrier();
      emitPlaybackState({ isPlaying: true, isPaused: false });
      return;
    }
    // No native resume — re-speak from the last word boundary we saw via
    // onBoundary so the caregiver picks up mid-reply instead of from the
    // start. `startSpeechFallback` clamps a stale/invalid offset back to 0.
    await startSpeechFallback(fallbackSpeechText, {
      startOffset: spokenCharOffset,
    });
  }
}

export async function stopNativeOpenAiVoicePlayback(): Promise<void> {
  await stopActiveSound();
  stopSpeechFallback(true);
}

export async function stopNativeOpenAiVoice(): Promise<void> {
  if (activeRecording) {
    try {
      await activeRecording.stop();
    } catch (err) {
      console.warn("[voice] stop on shutdown failed", err);
    }
    activeRecording = null;
  }

  await stopActiveSound();
  stopSpeechFallback(true);
  await configurePlaybackMode();
}

export async function stopNativeOpenAiVoiceRecordingAndTranscribe(): Promise<NativeOpenAiVoiceTranscriptResult> {
  if (!activeRecording) {
    throw new Error("Voice recording has not started yet.");
  }

  const recording = activeRecording;
  try {
    await recording.stop();
  } catch (err) {
    console.warn("[voice] stop failed during transcribe", err);
  } finally {
    activeRecording = null;
  }
  await configurePlaybackMode();

  const uri = recording.uri;
  if (!uri) {
    throw new Error("The recorded audio could not be found.");
  }

  const fileName = `voice-transcript-${Date.now()}.m4a`;
  const formData = new FormData();
  formData.append("audio", {
    uri,
    name: fileName,
    type: Platform.OS === "ios" ? "audio/m4a" : "audio/mp4",
  } as never);

  const response = await fetch(`${apiBase()}/openai/mobile-transcribe`, {
    method: "POST",
    headers: await authClientHeaders(),
    body: formData,
  });

  if (!response.ok) {
    let message = "Voice transcription failed.";
    try {
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };
      message = data.error ?? data.message ?? message;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  return (await response.json()) as NativeOpenAiVoiceTranscriptResult;
}

export async function stopNativeOpenAiVoiceRecordingAndSend({
  patientContext = "",
  voice = "marin",
}: StopNativeOpenAiVoiceRecordingAndSendOptions = {}): Promise<NativeOpenAiVoiceTurnResult> {
  if (!activeRecording) {
    throw new Error("Voice recording has not started yet.");
  }

  const recording = activeRecording;
  try {
    await recording.stop();
  } catch (err) {
    console.warn("[voice] stop failed during send", err);
  } finally {
    activeRecording = null;
  }
  await configurePlaybackMode();

  const uri = recording.uri;
  if (!uri) {
    throw new Error("The recorded audio could not be found.");
  }

  const fileName = `voice-turn-${Date.now()}.m4a`;
  const formData = new FormData();
  formData.append("audio", {
    uri,
    name: fileName,
    type: Platform.OS === "ios" ? "audio/m4a" : "audio/mp4",
  } as never);
  if (patientContext) {
    formData.append("patientContext", patientContext);
  }
  formData.append("voice", voice);

  const response = await fetch(`${apiBase()}/openai/mobile-voice-turn`, {
    method: "POST",
    headers: await authClientHeaders(),
    body: formData,
  });

  if (!response.ok) {
    let message = "Voice turn failed.";
    try {
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };
      message = data.error ?? data.message ?? message;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  const payload = (await response.json()) as {
    userTranscript?: string;
    assistantTranscript?: string;
    audioBase64?: string;
    audioMimeType?: string;
    audioUrl?: string;
  };

  const userTranscript = payload.userTranscript?.trim() ?? "";
  const assistantTranscript = payload.assistantTranscript?.trim() ?? "";

  if (!userTranscript || !assistantTranscript) {
    throw new Error("Ragna did not return a complete voice reply.");
  }

  let didAutoPlayAudio = false;
  let autoPlayErrorMessage: string | undefined;
  let usedSpeechFallback = false;

  if (payload.audioBase64 || payload.audioUrl) {
    try {
      await playAudioReply({
        audioBase64: payload.audioBase64,
        audioMimeType: payload.audioMimeType,
        audioUrl: payload.audioUrl,
        assistantTranscript,
      });
      didAutoPlayAudio = true;
    } catch (error) {
      autoPlayErrorMessage =
        error instanceof Error
          ? error.message
          : "Ragna's reply was generated, but playback could not start automatically.";

      if (Platform.OS === "ios") {
        try {
          await startSpeechFallback(assistantTranscript);
          didAutoPlayAudio = true;
          usedSpeechFallback = true;
          autoPlayErrorMessage = undefined;
        } catch (fallbackErr) {
          console.warn("[voice] iOS speech fallback failed", fallbackErr);
        }
      }
    }
  }

  return {
    userTranscript,
    assistantTranscript,
    didAutoPlayAudio,
    autoPlayErrorMessage,
    usedSpeechFallback,
  };
}

export async function speakNativeOpenAiVoiceText({
  text,
  voice,
}: {
  text: string;
  voice: string;
}): Promise<NativeOpenAiVoicePlaybackResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { didAutoPlayAudio: false };
  }

  const response = await fetch(`${apiBase()}/openai/speak`, {
    method: "POST",
    headers: mergeJsonHeaders(await authClientHeaders()),
    body: JSON.stringify({
      text: trimmed,
      voice,
    }),
  });

  if (!response.ok) {
    let message = "Ragna voice playback failed.";
    try {
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };
      message = data.error ?? data.message ?? message;
    } catch {
      const textResponse = await response.text();
      if (textResponse) message = textResponse;
    }
    throw new Error(message);
  }

  const payload = (await response.json()) as {
    audioBase64?: string;
    audioMimeType?: string;
    audioUrl?: string;
  };

  let didAutoPlayAudio = false;
  let autoPlayErrorMessage: string | undefined;
  let usedSpeechFallback = false;

  if (payload.audioBase64 || payload.audioUrl) {
    try {
      await playAudioReply({
        audioBase64: payload.audioBase64,
        audioMimeType: payload.audioMimeType,
        audioUrl: payload.audioUrl,
        assistantTranscript: trimmed,
      });
      didAutoPlayAudio = true;
    } catch (error) {
      didAutoPlayAudio = false;
      autoPlayErrorMessage =
        error instanceof Error
          ? error.message
          : "Ragna voice audio was generated, but playback could not start automatically.";

      if (Platform.OS === "ios") {
        try {
          await startSpeechFallback(trimmed);
          didAutoPlayAudio = true;
          usedSpeechFallback = true;
          autoPlayErrorMessage = undefined;
        } catch (fallbackErr) {
          console.warn("[voice] iOS speech fallback failed", fallbackErr);
        }
      }
    }
  }

  return {
    audioBase64: payload.audioBase64,
    audioMimeType: payload.audioMimeType,
    audioUrl: payload.audioUrl,
    didAutoPlayAudio,
    autoPlayErrorMessage,
    usedSpeechFallback,
  };
}
