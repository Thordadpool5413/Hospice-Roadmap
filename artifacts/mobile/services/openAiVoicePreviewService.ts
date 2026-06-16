import { Platform } from "react-native";

import { getAuthToken } from "@workspace/api-client-react";

import { apiBase, mergeJsonHeaders } from "./apiClient";
import {
  speakNativeOpenAiVoiceText,
  stopNativeOpenAiVoice,
} from "./nativeOpenAiVoiceService";
import { RAGNA_VOICE_ID } from "./voicePreferences";

let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;

function cleanupPreviewAudio() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = "";
    activeAudio = null;
  }

  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
}

export function stopOpenAiVoicePreview(): void {
  if (Platform.OS === "web") {
    cleanupPreviewAudio();
    return;
  }
  void stopNativeOpenAiVoice();
}

export async function previewOpenAiVoice(
  voice: string = RAGNA_VOICE_ID,
  text: string,
): Promise<void> {
  if (Platform.OS !== "web") {
    await speakNativeOpenAiVoiceText({
      text,
      voice,
    });
    return;
  }

  if (typeof window === "undefined" || typeof Audio === "undefined") {
    throw new Error("Voice preview is unavailable in this environment.");
  }

  cleanupPreviewAudio();

  const token = await getAuthToken();
  const response = await fetch(`${apiBase()}/openai/preview`, {
    method: "POST",
    headers: mergeJsonHeaders(token ? { Authorization: `Bearer ${token}` } : undefined),
    body: JSON.stringify({ voice, text }),
  });

  if (!response.ok) {
    let message = "Failed to load voice preview.";
    try {
      const data = (await response.json()) as { error?: string; message?: string };
      message = data.error ?? data.message ?? message;
    } catch {
      const raw = await response.text();
      if (raw) message = raw;
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  activeObjectUrl = URL.createObjectURL(blob);
  activeAudio = new Audio(activeObjectUrl);
  activeAudio.onended = () => {
    cleanupPreviewAudio();
  };
  await activeAudio.play();
}