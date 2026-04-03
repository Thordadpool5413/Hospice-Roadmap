import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "ragna_active_conversation_id";

let cachedConversationId: number | null | undefined;

export async function getActiveConversationId(): Promise<number | null> {
  if (cachedConversationId !== undefined) {
    return cachedConversationId;
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      cachedConversationId = null;
      return null;
    }

    const parsed = Number(stored);
    cachedConversationId = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    return cachedConversationId;
  } catch {
    cachedConversationId = null;
    return null;
  }
}

export async function setActiveConversationId(conversationId: number): Promise<void> {
  cachedConversationId = conversationId;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(conversationId));
  } catch {
    // Ignore persistence failures — the in-memory cache still helps for this session.
  }
}

export async function clearActiveConversationId(): Promise<void> {
  cachedConversationId = null;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore persistence failures.
  }
}
