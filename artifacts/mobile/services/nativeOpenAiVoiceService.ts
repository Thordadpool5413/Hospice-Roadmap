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
import { Platform } from "react-native";

import { apiBase, mergeJsonHeaders } from "./apiClient";
import { getClientId } from "./clientIdentity";

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

const LOCK_SCREEN_METADATA = {
  title: "Ragna",
  artist: "Hospice Roadmap",
} as const;

function activateLockScreenControls(player: AudioPlayer): void {
  try {
    player.setActiveForLockScreen(true, { ...LOCK_SCREEN_METADATA }, {
      showSeekForward: false,
      showSeekBackward: false,
    });
  } catch (err) {
    console.warn("[voice] setActiveForLockScreen failed", err);
  }
}

function deactivateLockScreenControls(player: AudioPlayer): void {
  try {
    player.clearLockScreenControls();
  } catch (err) {
    console.warn("[voice] clearLockScreenControls failed", err);
  }
}

function stopSpeechFallback(clearText = false): void {
  const controls = getSpeechControls();
  controls.stop?.();
  isUsingSpeechFallback = false;
  if (clearText) {
    fallbackSpeechText = null;
  }
  emitPlaybackState({ isPlaying: false, isPaused: false });
}

async function startSpeechFallback(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  await stopActiveSound();
  await configurePlaybackMode();

  fallbackSpeechText = trimmed;
  isUsingSpeechFallback = true;
  emitPlaybackState({ isPlaying: true, isPaused: false });

  Speech.speak(trimmed, {
    language: "en-US",
    onDone: () => {
      isUsingSpeechFallback = false;
      emitPlaybackState({ isPlaying: false, isPaused: false });
    },
    onStopped: () => {
      isUsingSpeechFallback = false;
      emitPlaybackState({ isPlaying: false, isPaused: false });
    },
    onError: () => {
      isUsingSpeechFallback = false;
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
  const player = createAudioPlayer(source);
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
}: {
  audioBase64?: string;
  audioMimeType?: string;
  audioUrl?: string;
}): Promise<void> {
  await stopActiveSound();
  stopSpeechFallback();
  await configurePlaybackMode();

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
}: {
  audioBase64?: string;
  audioMimeType?: string;
  audioUrl?: string;
}): Promise<void> {
  await playAudioReply({ audioBase64, audioMimeType, audioUrl });
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
      emitPlaybackState({ isPlaying: true, isPaused: true });
      return;
    }
    controls.stop?.();
    isUsingSpeechFallback = false;
    emitPlaybackState({ isPlaying: false, isPaused: false });
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
      emitPlaybackState({ isPlaying: true, isPaused: false });
      return;
    }
    await startSpeechFallback(fallbackSpeechText);
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

  const clientId = await getClientId();
  const response = await fetch(`${apiBase()}/openai/mobile-transcribe`, {
    method: "POST",
    headers: {
      x_client_id: clientId,
    },
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

  const clientId = await getClientId();
  const response = await fetch(`${apiBase()}/openai/mobile-voice-turn`, {
    method: "POST",
    headers: {
      x_client_id: clientId,
    },
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

  const clientId = await getClientId();
  const response = await fetch(`${apiBase()}/openai/speak`, {
    method: "POST",
    headers: mergeJsonHeaders({ x_client_id: clientId }),
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
