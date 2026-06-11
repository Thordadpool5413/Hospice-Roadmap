import { getAuthToken } from "@workspace/api-client-react";

import { RagnaAction } from "@/types";

import { apiBase, fetchJson, mergeJsonHeaders } from "./apiClient";

// ─── Internal header helpers ─────────────────────────────────────────────────
// These are async because they must await the Clerk JWT.

async function jsonHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return mergeJsonHeaders(token ? { Authorization: `Bearer ${token}` } : undefined);
}

async function baseHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Public types ────────────────────────────────────────────────────────────

export interface AiMessage {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AiConversation {
  id: number;
  title: string;
  createdAt: string;
  messages?: AiMessage[];
}

// ─── Conversation CRUD ───────────────────────────────────────────────────────

export async function createConversation(title: string): Promise<AiConversation> {
  return fetchJson<AiConversation>(`${apiBase()}/anthropic/conversations`, {
    method: "POST",
    headers: await jsonHeaders(),
    body: JSON.stringify({ title }),
  });
}

export async function getConversation(id: number): Promise<AiConversation> {
  return fetchJson<AiConversation>(
    `${apiBase()}/anthropic/conversations/${id}`,
    { headers: await baseHeaders() }
  );
}

export async function deleteConversation(id: number): Promise<void> {
  // DELETE may return 204 with no body — use raw fetch so we don't try to
  // parse an empty response as JSON.
  const res = await fetch(`${apiBase()}/anthropic/conversations/${id}`, {
    method: "DELETE",
    headers: await baseHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete conversation");
}

export async function saveVoiceExchange(
  conversationId: number,
  userTranscript: string,
  assistantTranscript: string,
): Promise<void> {
  const res = await fetch(
    `${apiBase()}/anthropic/conversations/${conversationId}/voice-exchange`,
    {
      method: "POST",
      headers: await jsonHeaders(),
      body: JSON.stringify({ userTranscript, assistantTranscript }),
    },
  );

  if (!res.ok) {
    let message = "Failed to save voice exchange";
    try {
      const data = (await res.json()) as { error?: string; message?: string };
      message = data.error ?? data.message ?? message;
    } catch {
      // Ignore non-JSON responses.
    }
    throw new Error(message);
  }
}

// ─── Memory / profile synthesis ─────────────────────────────────────────────

export async function synthesizeProfile(
  currentProfile: string,
  memory: {
    summary: string;
    keyFacts: string[];
    emotionalTone: string;
    mainTopics: string[];
    date: string;
  },
  tileHistory: string[]
): Promise<string | null> {
  try {
    const data = await fetchJson<{ profile: string }>(
      `${apiBase()}/anthropic/profile-synthesize`,
      {
        method: "POST",
        headers: await jsonHeaders(),
        body: JSON.stringify({ currentProfile, memory, tileHistory }),
      }
    );
    return data.profile ?? null;
  } catch {
    return null;
  }
}

// Synthesizes the living profile from non-chat app activity (symptom check-ins,
// journal entries, GoC updates, etc.) using the same profile-synthesize endpoint.
// Frames the observations as a synthetic "memory" so the existing endpoint works
// without needing a new API route.
export async function synthesizeFromActivity(
  currentProfile: string,
  observations: Array<{ summary: string; type: string; date: string }>
): Promise<string | null> {
  if (observations.length === 0) return null;
  const topicMap: Record<string, string> = {
    symptom_checkin: "symptom management",
    symptom_high: "pain / urgent symptoms",
    journal_entry: "journaling / emotional processing",
    goals_updated: "goals of care",
    profile_updated: "care planning",
    medication_added: "medication management",
  };
  const topics = [...new Set(observations.map((o) => topicMap[o.type] ?? "care planning"))];
  const summary = `App activity since last conversation (${observations.length} events): ${observations.map((o) => o.summary).join("; ")}`;
  return synthesizeProfile(
    currentProfile,
    {
      summary,
      keyFacts: observations.slice(0, 6).map((o) => o.summary),
      emotionalTone: "engaged with the app",
      mainTopics: topics,
      date: new Date().toISOString(),
    },
    []
  );
}

export async function generateConversationMemory(
  conversationId: number
): Promise<{
  summary: string;
  keyFacts: string[];
  emotionalTone: string;
  mainTopics: string[];
} | null> {
  try {
    return await fetchJson<{
      summary: string;
      keyFacts: string[];
      emotionalTone: string;
      mainTopics: string[];
    }>(
      `${apiBase()}/anthropic/conversations/${conversationId}/memory`,
      {
        method: "POST",
        headers: await baseHeaders(),
      }
    );
  } catch {
    return null;
  }
}

// ─── SSE streaming ───────────────────────────────────────────────────────────
// Streaming uses raw fetch because fetchJson cannot incrementally consume a
// ReadableStream.  All other shared helpers (apiBase, mergeJsonHeaders) are
// still used to stay consistent.

function parseSseText(
  raw: string,
  onChunk: (t: string) => void,
  onDone: () => void,
  onError: (e: string) => void,
  onAction?: (action: RagnaAction) => void
) {
  const lines = raw.split("\n");
  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    try {
      const data = JSON.parse(line.slice(6)) as {
        content?: string;
        done?: boolean;
        error?: string;
        action?: RagnaAction;
      };
      if (data.error) { onError(data.error); return; }
      if (data.action && onAction) onAction(data.action);
      if (data.done) { onDone(); return; }
      if (data.content) onChunk(data.content);
    } catch {
      // Ignore malformed SSE lines.
    }
  }
}

export async function streamMessage(
  conversationId: number,
  content: string,
  patientContext: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  onAction?: (action: RagnaAction) => void
): Promise<void> {
  try {
    // Streaming requires a long-lived connection — no timeout signal here.
    const res = await fetch(
      `${apiBase()}/anthropic/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: await jsonHeaders(),
        body: JSON.stringify({ content, patientContext }),
      }
    );

    if (!res.ok) {
      let message = "Failed to connect to AI";
      try {
        const data = (await res.json()) as { error?: string; message?: string };
        message = data.error ?? data.message ?? message;
      } catch {
        try {
          const raw = await res.text();
          if (raw) {
            message = raw;
          }
        } catch {
          // Ignore non-text bodies.
        }
      }
      onError(message);
      return;
    }

    // React Native native may not support ReadableStream — fall back to full text.
    if (!res.body) {
      const raw = await res.text();
      parseSseText(raw, onChunk, onDone, onError, onAction);
      onDone();
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6)) as {
            content?: string;
            done?: boolean;
            error?: string;
            action?: RagnaAction;
          };
          if (data.error) { onError(data.error); return; }
          if (data.action && onAction) onAction(data.action);
          if (data.done) { onDone(); return; }
          if (data.content) onChunk(data.content);
        } catch {
          // Ignore malformed SSE lines.
        }
      }
    }

    onDone();
  } catch (err: unknown) {
    onError(err instanceof Error ? err.message : "Unknown error");
  }
}

// ─── Device claim ─────────────────────────────────────────────────────────────

/**
 * Links a device-generated clientId to the authenticated Clerk userId on the
 * server side. Should be called once per device on first sign-in.
 *
 * Returns the number of conversation rows that were claimed, or null if the
 * request failed (non-throwing — callers should treat null as a soft failure
 * and retry on the next sign-in if the @device_claimed flag was not set).
 */
export async function claimDevice(clientId: string): Promise<number | null> {
  try {
    const data = await fetchJson<{ claimed: number }>(
      `${apiBase()}/anthropic/claim-device`,
      {
        method: "POST",
        headers: await jsonHeaders(),
        body: JSON.stringify({ clientId }),
      },
    );
    return data.claimed;
  } catch {
    return null;
  }
}
