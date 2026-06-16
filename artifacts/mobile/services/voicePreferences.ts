import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "ragna_preferred_voice";
export const RAGNA_VOICE_ID = "ragna";

const ALLOWED_VOICE_IDS = new Set([RAGNA_VOICE_ID]);

let cachedPreferredVoice: string | null | undefined;

export async function getPreferredVoice(): Promise<string | null> {
  if (cachedPreferredVoice !== undefined) {
    return cachedPreferredVoice;
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === "marin") {
      cachedPreferredVoice = RAGNA_VOICE_ID;
      return cachedPreferredVoice;
    }
    cachedPreferredVoice =
      stored && ALLOWED_VOICE_IDS.has(stored) ? stored : RAGNA_VOICE_ID;
    return cachedPreferredVoice;
  } catch {
    cachedPreferredVoice = RAGNA_VOICE_ID;
    return cachedPreferredVoice;
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