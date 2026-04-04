import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { apiBase } from "./apiClient";
import { getClientId } from "./clientIdentity";

export interface NativeOpenAiVoiceTurnResult {
  userTranscript: string;
  assistantTranscript: string;
}

let activeRecording: Audio.Recording | null = null;
let activeSound: Audio.Sound | null = null;

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
  if (!activeSound) return;
  const sound = activeSound;
  activeSound = null;
  try {
    await sound.stopAsync();
  } catch {}
  try {
    await sound.unloadAsync();
  } catch {}
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

async function playAudioReply(
  audioBase64: string,
  audioMimeType?: string,
): Promise<void> {
  await stopActiveSound();
  await configurePlaybackMode();

  const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDir) {
    throw new Error("Unable to access local storage for audio playback.");
  }

  const extension = audioMimeType?.includes("mpeg") ? "mp3" : "m4a";
  const fileUri = `${baseDir}ragna-voice-reply-${Date.now()}.${extension}`;
  await FileSystem.writeAsStringAsync(fileUri, audioBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { sound } = await Audio.Sound.createAsync(
    { uri: fileUri },
    { shouldPlay: true },
  );
  activeSound = sound;
  sound.setOnPlaybackStatusUpdate((status) => {
    if (!status.isLoaded || !status.didJustFinish) return;
    sound.unloadAsync().catch(() => {});
    FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
    if (activeSound === sound) {
      activeSound = null;
    }
  });
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

export async function stopNativeOpenAiVoiceRecordingAndSend({
  patientContext,
  voice,
}: {
  patientContext: string;
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
  formData.append("patientContext", patientContext);
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
    userTranscript: string;
    assistantTranscript: string;
    audioBase64: string;
    audioMimeType?: string;
  };

  await playAudioReply(payload.audioBase64, payload.audioMimeType);

  return {
    userTranscript: payload.userTranscript,
    assistantTranscript: payload.assistantTranscript,
  };
}
