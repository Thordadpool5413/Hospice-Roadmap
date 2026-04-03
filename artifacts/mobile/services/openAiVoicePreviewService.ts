import { Platform } from "react-native";

import { apiBase, mergeJsonHeaders } from "./apiClient";
import { getClientId } from "./clientIdentity";

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
  if (Platform.OS !== "web") return;
  cleanupPreviewAudio();
}

export async function previewOpenAiVoice(voice: string, text: string): Promise<void> {
  if (Platform.OS !== "web" || typeof window === "undefined" || typeof Audio === "undefined") {
    throw new Error("Voice preview currently runs in the web app preview.");
  }

  cleanupPreviewAudio();

  const clientId = await getClientId();
  const response = await fetch(`${apiBase()}/openai/preview`, {
    method: "POST",
    headers: mergeJsonHeaders({ x_client_id: clientId }),
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
