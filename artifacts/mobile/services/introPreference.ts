import AsyncStorage from "@react-native-async-storage/async-storage";

const INTRO_SEEN_KEY = "@intro_videos_seen";
const INTRO_VERSION_KEY = "@intro_videos_version";
export const INTRO_VIDEO_VERSION = "1";

export async function hasSeenIntroVideos(): Promise<boolean> {
  try {
    const [seen, version] = await Promise.all([
      AsyncStorage.getItem(INTRO_SEEN_KEY),
      AsyncStorage.getItem(INTRO_VERSION_KEY),
    ]);
    return seen === "1" && version === INTRO_VIDEO_VERSION;
  } catch {
    return false;
  }
}

export async function markIntroVideosSeen(): Promise<void> {
  await AsyncStorage.multiSet([
    [INTRO_SEEN_KEY, "1"],
    [INTRO_VERSION_KEY, INTRO_VIDEO_VERSION],
  ]);
}

export async function clearIntroVideosSeen(): Promise<void> {
  await AsyncStorage.multiRemove([INTRO_SEEN_KEY, INTRO_VERSION_KEY]);
}