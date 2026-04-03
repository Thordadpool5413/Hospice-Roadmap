import { Platform } from "react-native";

import { apiBase, mergeJsonHeaders } from "./apiClient";
import { getClientId } from "./clientIdentity";

export type OpenAiVoiceStatus =
  | "idle"
  | "requesting-mic"
  | "connecting"
  | "ready"
  | "listening"
  | "speaking"
  | "error";

export interface OpenAiVoiceSession {
  stop: () => void;
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
}

interface StartOpenAiVoiceSessionOptions {
  patientContext?: string;
  voice?: string;
  onStatusChange?: (status: OpenAiVoiceStatus) => void;
  onTranscript?: (line: string) => void;
  onUserTranscript?: (text: string) => void;
  onAssistantTranscript?: (text: string) => void;
  onError?: (message: string) => void;
}

type RealtimeEvent =
  | { type: "output_audio_buffer.started" }
  | { type: "output_audio_buffer.stopped" }
  | { type: "input_audio_buffer.speech_started" }
  | { type: "response.audio_transcript.done"; transcript?: string }
  | { type: "conversation.item.input_audio_transcription.completed"; transcript?: string }
  | { type: "error"; error?: { message?: string } }
  | { type: string; [key: string]: unknown };

function createManagedRemoteAudio(): HTMLAudioElement {
  const audio = document.createElement("audio");
  audio.autoplay = true;
  audio.playsInline = true;
  audio.controls = false;
  audio.preload = "auto";
  audio.style.position = "fixed";
  audio.style.width = "1px";
  audio.style.height = "1px";
  audio.style.opacity = "0";
  audio.style.pointerEvents = "none";
  audio.style.bottom = "0";
  audio.style.left = "0";
  document.body.appendChild(audio);
  return audio;
}

function removeManagedAudio(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  try {
    audio.pause();
    audio.srcObject = null;
    audio.removeAttribute("src");
    audio.load();
  } catch {
  }
  if (audio.parentNode) {
    audio.parentNode.removeChild(audio);
  }
}

async function waitForIceGatheringComplete(peerConnection: RTCPeerConnection): Promise<void> {
  if (peerConnection.iceGatheringState === "complete") return;

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => {
      peerConnection.removeEventListener("icegatheringstatechange", handleStateChange);
      resolve();
    }, 2000);

    function handleStateChange() {
      if (peerConnection.iceGatheringState === "complete") {
        window.clearTimeout(timeout);
        peerConnection.removeEventListener("icegatheringstatechange", handleStateChange);
        resolve();
      }
    }

    peerConnection.addEventListener("icegatheringstatechange", handleStateChange);
  });
}

export function isOpenAiVoiceSupported(): boolean {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof RTCPeerConnection !== "undefined"
  );
}

export async function startOpenAiVoiceSession({
  patientContext = "",
  voice = "marin",
  onStatusChange,
  onTranscript,
  onUserTranscript,
  onAssistantTranscript,
  onError,
}: StartOpenAiVoiceSessionOptions): Promise<OpenAiVoiceSession> {
  if (!isOpenAiVoiceSupported()) {
    throw new Error("Voice chat currently runs in the web app preview.");
  }

  onStatusChange?.("requesting-mic");
  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  onStatusChange?.("connecting");

  const remoteAudio = createManagedRemoteAudio();
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  peerConnection.ontrack = (event) => {
    const [stream] = event.streams;
    if (!stream) return;
    remoteAudio.srcObject = stream;
    void remoteAudio.play().catch(() => {
    });
  };

  const dataChannel = peerConnection.createDataChannel("oai-events");
  dataChannel.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as RealtimeEvent;
      switch (data.type) {
        case "input_audio_buffer.speech_started":
          onStatusChange?.("listening");
          break;
        case "output_audio_buffer.started":
          onStatusChange?.("speaking");
          break;
        case "output_audio_buffer.stopped":
          onStatusChange?.("ready");
          break;
        case "conversation.item.input_audio_transcription.completed":
          if (data.transcript) {
            onTranscript?.(`You: ${data.transcript}`);
            onUserTranscript?.(data.transcript);
          }
          onStatusChange?.("listening");
          break;
        case "response.audio_transcript.done":
          if (data.transcript) {
            onTranscript?.(`Ragna: ${data.transcript}`);
            onAssistantTranscript?.(data.transcript);
          }
          onStatusChange?.("ready");
          break;
        case "error":
          onError?.(data.error?.message ?? "Voice chat encountered an error.");
          onStatusChange?.("error");
          break;
        default:
          break;
      }
    } catch {
    }
  };

  peerConnection.onconnectionstatechange = () => {
    if (peerConnection.connectionState === "connected") {
      onStatusChange?.("ready");
      return;
    }

    if (peerConnection.connectionState === "failed") {
      onError?.("Voice connection failed. Refresh the app and try again in the web preview.");
      onStatusChange?.("error");
      return;
    }

    if (
      peerConnection.connectionState === "disconnected" ||
      peerConnection.connectionState === "closed"
    ) {
      onStatusChange?.("idle");
    }
  };

  peerConnection.oniceconnectionstatechange = () => {
    if (peerConnection.iceConnectionState === "failed") {
      onError?.("Voice network negotiation failed. Refresh the app and try again.");
      onStatusChange?.("error");
    }
  };

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  const offer = await peerConnection.createOffer({
    offerToReceiveAudio: true,
  });
  await peerConnection.setLocalDescription(offer);
  await waitForIceGatheringComplete(peerConnection);

  const clientId = await getClientId();
  const response = await fetch(`${apiBase()}/openai/realtime/session`, {
    method: "POST",
    headers: mergeJsonHeaders({ x_client_id: clientId }),
    body: JSON.stringify({
      sdp: peerConnection.localDescription?.sdp ?? offer.sdp,
      patientContext,
      voice,
    }),
  });

  if (!response.ok) {
    let message = "Failed to create voice session.";
    try {
      const data = (await response.json()) as { error?: string; message?: string };
      message = data.error ?? data.message ?? message;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  const answerSdp = await response.text();
  await peerConnection.setRemoteDescription({
    type: "answer",
    sdp: answerSdp,
  });

  const stop = () => {
    try {
      dataChannel.close();
    } catch {
    }

    try {
      peerConnection.getSenders().forEach((sender) => sender.track?.stop());
      localStream.getTracks().forEach((track) => track.stop());
      peerConnection.close();
    } catch {
    }

    removeManagedAudio(remoteAudio);
    onStatusChange?.("idle");
  };

  return {
    stop,
    peerConnection,
    dataChannel,
  };
}
