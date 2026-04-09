import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "ragna_client_id";

function generateClientId(): string {
  const ts = Date.now();
  const rand = Math.random()
    .toString(36)
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);
  return `client_${ts}_${rand}`;
}

let cached: string | null = null;

export async function getClientId(): Promise<string> {
  if (cached) return cached;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      cached = stored;
      return stored;
    }
    const id = generateClientId();
    await AsyncStorage.setItem(STORAGE_KEY, id);
    cached = id;
    return id;
  } catch {
    if (!cached) cached = generateClientId();
    return cached;
  }
}
