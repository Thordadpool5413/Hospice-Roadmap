import { getClientId } from "./clientIdentity";

function apiBase(): string {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname.replace(".expo.", ".");
    return `https://${host}/api`;
  }
  const envUrl = process.env["EXPO_PUBLIC_API_URL"];
  return envUrl ?? "http://localhost:8080/api";
}

async function jsonHeaders(): Promise<Record<string, string>> {
  const clientId = await getClientId();
  return {
    "Content-Type": "application/json",
    "x_client_id": clientId,
  };
}

async function baseHeaders(): Promise<Record<string, string>> {
  const clientId = await getClientId();
  return { "x_client_id": clientId };
}

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

export async function createConversation(title: string): Promise<AiConversation> {
  const res = await fetch(`${apiBase()}/anthropic/conversations`, {
    method: "POST",
    headers: await jsonHeaders(),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create conversation");
  return res.json() as Promise<AiConversation>;
}

export async function getConversation(id: number): Promise<AiConversation> {
  const res = await fetch(`${apiBase()}/anthropic/conversations/${id}`, {
    headers: await baseHeaders(),
  });
  if (!res.ok) throw new Error("Failed to get conversation");
  return res.json() as Promise<AiConversation>;
}

export async function deleteConversation(id: number): Promise<void> {
  const res = await fetch(`${apiBase()}/anthropic/conversations/${id}`, {
    method: "DELETE",
    headers: await baseHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete conversation");
}

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
    const res = await fetch(`${apiBase()}/anthropic/profile-synthesize`, {
      method: "POST",
      headers: await jsonHeaders(),
      body: JSON.stringify({ currentProfile, memory, tileHistory }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { profile: string };
    return data.profile ?? null;
  } catch {
    return null;
  }
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
    const res = await fetch(
      `${apiBase()}/anthropic/conversations/${conversationId}/memory`,
      {
        method: "POST",
        headers: await baseHeaders(),
      }
    );
    if (!res.ok) return null;
    return res.json() as Promise<{
      summary: string;
      keyFacts: string[];
      emotionalTone: string;
      mainTopics: string[];
    }>;
  } catch {
    return null;
  }
}

function parseSseText(raw: string, onChunk: (t: string) => void, onDone: () => void, onError: (e: string) => void) {
  const lines = raw.split("\n");
  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    try {
      const data = JSON.parse(line.slice(6)) as {
        content?: string;
        done?: boolean;
        error?: string;
      };
      if (data.error) { onError(data.error); return; }
      if (data.done) { onDone(); return; }
      if (data.content) onChunk(data.content);
    } catch {
      // ignore malformed SSE lines
    }
  }
}

export async function streamMessage(
  conversationId: number,
  content: string,
  patientContext: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  try {
    const res = await fetch(
      `${apiBase()}/anthropic/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: await jsonHeaders(),
        body: JSON.stringify({ content, patientContext }),
      }
    );

    if (!res.ok) {
      onError("Failed to connect to AI");
      return;
    }

    // React Native native may not support ReadableStream — fall back to full text
    if (!res.body) {
      const raw = await res.text();
      parseSseText(raw, onChunk, onDone, onError);
      // If parseSseText didn't call onDone, call it now
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
          };
          if (data.error) { onError(data.error); return; }
          if (data.done) { onDone(); return; }
          if (data.content) onChunk(data.content);
        } catch {
          // ignore malformed SSE lines
        }
      }
    }

    onDone();
  } catch (err: unknown) {
    onError(err instanceof Error ? err.message : "Unknown error");
  }
}
