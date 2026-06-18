const SPEECH_CACHE_TTL_MS = 10 * 60 * 1000;

interface SpeechCacheEntry {
  buffer: Buffer;
  mimeType: string;
  expiresAt: number;
}

const speechCache = new Map<string, SpeechCacheEntry>();

export function pruneSpeechCache(): void {
  const now = Date.now();
  for (const [key, value] of speechCache.entries()) {
    if (value.expiresAt <= now) {
      speechCache.delete(key);
    }
  }
}

export function getSpeechCacheEntry(audioId: string): SpeechCacheEntry | undefined {
  return speechCache.get(audioId);
}

export function setSpeechCacheEntry(audioId: string, buffer: Buffer, mimeType: string): void {
  speechCache.set(audioId, {
    buffer,
    mimeType,
    expiresAt: Date.now() + SPEECH_CACHE_TTL_MS,
  });
}
