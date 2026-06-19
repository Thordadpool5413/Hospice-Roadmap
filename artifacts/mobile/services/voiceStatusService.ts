import { getAuthToken } from "@workspace/api-client-react";

import { apiBase } from "@/services/apiClient";

export type VoiceStatusResponse = {
  openaiConfigured: boolean;
  betaBypass: boolean;
  elevenLabs: {
    configured: boolean;
    voiceName: string;
    voiceId: string | null;
    connector: string;
    availableVoiceNames: string[];
    synthesisOk: boolean | null;
    synthesisBytes: number | null;
    error: string | null;
  };
};

export async function fetchVoiceStatus(): Promise<VoiceStatusResponse> {
  const token = await getAuthToken();
  const response = await fetch(`${apiBase()}/voice-status?probe=1`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Voice status check failed (${response.status})`);
  }

  return (await response.json()) as VoiceStatusResponse;
}