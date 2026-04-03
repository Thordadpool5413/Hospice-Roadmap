import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "ragna_preferred_voice";

const ALLOWED_VOICE_IDS = new Set([
  "marin",
  "cedar",
  "alloy",
  "sage",
  "shimmer",
  "echo",
]);

let cachedPreferredVoice: string | null | undefined;

export async function getPreferredVoice(): Promise<string | null> {
  if (cachedPreferredVoice !== undefined) {
    return cachedPreferredVoice;
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    cachedPreferredVoice =
      stored && ALLOWED_VOICE_IDS.has(stored) ? stored : null;
    return cachedPreferredVoice;
  } catch {
    cachedPreferredVoice = null;
    return null;
  }
}

export async function setPreferredVoice(voiceId: string): Promise<void> {
  if (!ALLOWED_VOICE_IDS.has(voiceId)) return;
  cachedPreferredVoice = voiceId;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, voiceId);
  } catch {
    // Ignore persistence failures.
  }
}
