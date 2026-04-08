import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

import { apiBase, mergeJsonHeaders } from "./apiClient";
import { getClientId } from "./clientIdentity";

export interface NativeOpenAiVoiceTranscriptResult {
  userTranscript: string;
}

export interface NativeOpenAiVoiceTurnResult {
  userTranscript: string;
  assistantTranscript: string;
  audioBase64?: string;
  audioMimeType?: string;
  audioUrl?: string;
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

let activeRecording: Audio.Recording | null = null;
let activeSound: Audio.Sound | null = null;
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

async function configureRecordingMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    staysActiveInBackground: false,
  });
}

async function configurePlaybackMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    staysActiveInBackground: false,
  });
}

async function stopActiveSound(): Promise<void> {
  if (!activeSound) {
    emitPlaybackState({ isPlaying: false, isPaused: false });
    return;
  }
  const sound = activeSound;
  activeSound = null;
  try {
    await sound.stopAsync();
  } catch {}
  try {
    await sound.unloadAsync();
  } catch {}
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

  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Microphone permission is required to use voice chat.");
  }

  if (activeRecording) {
    try {
      await activeRecording.stopAndUnloadAsync();
    } catch {}
    activeRecording = null;
  }

  await configureRecordingMode();

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );
  await recording.startAsync();
  activeRecording = recording;
}

async function createAndAutoplaySound(
  source: { uri: string },
  cleanupUri?: string,
): Promise<void> {
  const { sound } = await Audio.Sound.createAsync(source, {
    shouldPlay: true,
    volume: 1,
    isMuted: false,
    progressUpdateIntervalMillis: 250,
  });

  activeSound = sound;
  emitPlaybackState({ isPlaying: true, isPaused: false });

  sound.setOnPlaybackStatusUpdate((status) => {
    if (!status.isLoaded) return;

    if (status.didJustFinish) {
      sound.unloadAsync().catch(() => {});
      if (cleanupUri) {
        FileSystem.deleteAsync(cleanupUri, { idempotent: true }).catch(
          () => {},
        );
      }
      if (activeSound === sound) {
        activeSound = null;
      }
      emitPlaybackState({ isPlaying: false, isPaused: false });
      return;
    }

    if (status.isPlaying) {
      emitPlaybackState({ isPlaying: true, isPaused: false });
      return;
    }

    if (activeSound === sound && status.positionMillis > 0) {
      emitPlaybackState({ isPlaying: true, isPaused: true });
    }
  });
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
  await configurePlaybackMode();

  if (audioBase64) {
    await playFromBase64(audioBase64, audioMimeType);
    return;
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
  if (!activeSound) return;
  await activeSound.pauseAsync();
  emitPlaybackState({ isPlaying: true, isPaused: true });
}

export async function resumeNativeOpenAiVoicePlayback(): Promise<void> {
  if (!activeSound) return;
  await activeSound.playAsync();
  emitPlaybackState({ isPlaying: true, isPaused: false });
}

export async function stopNativeOpenAiVoicePlayback(): Promise<void> {
  await stopActiveSound();
}

export async function stopNativeOpenAiVoice(): Promise<void> {
  if (activeRecording) {
    try {
      await activeRecording.stopAndUnloadAsync();
    } catch {}
    activeRecording = null;
  }

  await stopActiveSound();
  await configurePlaybackMode();
}

export async function stopNativeOpenAiVoiceRecordingAndTranscribe(): Promise<NativeOpenAiVoiceTranscriptResult> {
  if (!activeRecording) {
    throw new Error("Voice recording has not started yet.");
  }

  const recording = activeRecording;
  activeRecording = null;

  await recording.stopAndUnloadAsync();
  await configurePlaybackMode();

  const uri = recording.getURI();
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

export async function stopNativeOpenAiVoiceRecordingAndCompleteTurn({
  patientContext,
  voice,
}: {
  patientContext?: string;
  voice: string;
}): Promise<NativeOpenAiVoiceTurnResult> {
  if (!activeRecording) {
    throw new Error("Voice recording has not started yet.");
  }

  const recording = activeRecording;
  activeRecording = null;

  await recording.stopAndUnloadAsync();
  await configurePlaybackMode();

  const uri = recording.getURI();
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

  formData.append("voice", voice);
  if (patientContext?.trim()) {
    formData.append("patientContext", patientContext.trim());
  }

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

  return (await response.json()) as NativeOpenAiVoiceTurnResult;
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
    }
  }

  return {
    audioBase64: payload.audioBase64,
    audioMimeType: payload.audioMimeType,
    audioUrl: payload.audioUrl,
    didAutoPlayAudio,
    autoPlayErrorMessage,
    usedSpeechFallback: false,
  };
}
