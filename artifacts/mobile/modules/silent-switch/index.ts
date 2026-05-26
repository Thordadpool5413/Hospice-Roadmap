import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

interface SilentSwitchNativeModule {
  isMuted: () => Promise<boolean | null>;
}

const nativeModule =
  Platform.OS === "ios"
    ? requireOptionalNativeModule<SilentSwitchNativeModule>("SilentSwitch")
    : null;

/**
 * Probes the iOS hardware silent (ringer) switch.
 *
 * - Returns `true`  when the device is muted by the silent switch.
 * - Returns `false` when the device is unmuted.
 * - Returns `null`  on platforms or builds where the probe is unavailable
 *   (Android, web, Expo Go, or when the native call failed). Callers
 *   should treat `null` as "unknown" and not draw any conclusion.
 */
export async function probeIosSilentSwitch(): Promise<boolean | null> {
  if (Platform.OS !== "ios" || !nativeModule) {
    return null;
  }
  try {
    const result = await nativeModule.isMuted();
    return typeof result === "boolean" ? result : null;
  } catch {
    return null;
  }
}

export function isIosSilentSwitchProbeAvailable(): boolean {
  return Platform.OS === "ios" && nativeModule !== null;
}
