import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@ragna_hide_reply_preview_v1";

let cachedHidden: boolean | undefined;

export async function getHideReplyPreview(): Promise<boolean> {
  if (cachedHidden !== undefined) {
    return cachedHidden;
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    cachedHidden = stored === "1";
    return cachedHidden;
  } catch {
    cachedHidden = false;
    return false;
  }
}

export async function setHideReplyPreview(hidden: boolean): Promise<void> {
  cachedHidden = hidden;
  try {
    if (hidden) {
      await AsyncStorage.setItem(STORAGE_KEY, "1");
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore persistence failures.
  }
}
