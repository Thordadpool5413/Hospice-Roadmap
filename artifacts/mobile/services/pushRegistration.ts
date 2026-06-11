/**
 * Remote push registration.
 *
 * After Clerk sign-in the app requests notification permission, obtains an Expo
 * push token, and registers it with the server (`POST /api/push/register`) so
 * the server can proactively reach the device. On sign-out it unregisters
 * (`DELETE /api/push/unregister`).
 *
 * Graceful degradation: on web or in Expo Go (remote push was removed from
 * Expo Go in SDK 53), or when permission is denied, nothing crashes — a debug
 * log is emitted and registration is skipped silently with no user-facing error.
 *
 * Re-registration avoidance: the last successfully-registered token is cached in
 * AsyncStorage keyed by userId. We skip the network call when the same user
 * still has the same token. The cache is keyed by userId so a different user
 * signing in on the same device always re-registers.
 *
 * Platform note: this is iOS/TestFlight-focused. Android delivery additionally
 * requires FCM V1 credentials and a notification channel — out of scope here.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { getAuthToken } from "@workspace/api-client-react";
import { apiBase, makeRequestTimeoutSignal, mergeJsonHeaders } from "./apiClient";

const isExpoGo = Constants.executionEnvironment === "storeClient";
const notificationsAvailable = Platform.OS !== "web" && !isExpoGo;

let Notifications: typeof import("expo-notifications") | null = null;
if (notificationsAvailable) {
  try {
    Notifications = require("expo-notifications");
  } catch {
    Notifications = null;
  }
}

const REGISTERED_TOKEN_KEY = "@push_registered_token_v1";

interface CachedRegistration {
  userId: string;
  token: string;
}

async function readCache(): Promise<CachedRegistration | null> {
  try {
    const raw = await AsyncStorage.getItem(REGISTERED_TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRegistration;
    if (typeof parsed?.userId === "string" && typeof parsed?.token === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeCache(entry: CachedRegistration): Promise<void> {
  try {
    await AsyncStorage.setItem(REGISTERED_TOKEN_KEY, JSON.stringify(entry));
  } catch {
    // Non-fatal: a failed cache write just means we re-register next launch.
  }
}

async function clearCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REGISTERED_TOKEN_KEY);
  } catch {
    // Non-fatal.
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return mergeJsonHeaders(token ? { Authorization: `Bearer ${token}` } : undefined);
}

function getProjectId(): string | undefined {
  const c = Constants as unknown as {
    expoConfig?: { extra?: { eas?: { projectId?: string | null } | null } | null } | null;
    easConfig?: { projectId?: string | null } | null;
  };
  return (
    c.expoConfig?.extra?.eas?.projectId ??
    c.easConfig?.projectId ??
    undefined
  );
}

/**
 * Request permission, obtain an Expo push token, and register it with the
 * server for the given user. Safe to call on every sign-in — it no-ops when
 * the same user already has the same token registered.
 */
export async function registerForPushNotifications(userId: string): Promise<void> {
  if (!Notifications) {
    console.debug("[push] notifications unavailable (web/Expo Go) — skipping registration");
    return;
  }
  if (!userId) {
    console.debug("[push] no userId — skipping registration");
    return;
  }

  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") {
      console.debug("[push] permission not granted — skipping registration");
      return;
    }

    const projectId = getProjectId();
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const expoPushToken = tokenResponse?.data;
    if (!expoPushToken) {
      console.debug("[push] no Expo push token returned — skipping registration");
      return;
    }

    // Skip the network round-trip when this user already registered this token.
    const cached = await readCache();
    if (cached && cached.userId === userId && cached.token === expoPushToken) {
      return;
    }

    const res = await fetch(`${apiBase()}/push/register`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ expoPushToken, platform: Platform.OS }),
      signal: makeRequestTimeoutSignal(15_000),
    });

    if (res.ok) {
      await writeCache({ userId, token: expoPushToken });
    } else {
      console.debug("[push] register request failed", res.status);
    }
  } catch (err) {
    console.debug("[push] registration error", err);
  }
}

/**
 * Unregister this device's push token on sign-out. Best-effort: failures (e.g.
 * offline) are swallowed. The local cache is cleared regardless of network
 * outcome so the next sign-in always re-registers; any row left on the server
 * is later pruned via the DeviceNotRegistered cleanup path.
 *
 * Only this device's specific token is removed (never an all-tokens delete) so
 * signing out here can't disable push on the user's other devices. When there
 * is no cached token there is nothing this device registered, so we skip the
 * network call and just clear local state.
 *
 * Call this BEFORE Clerk `signOut()` so the auth token is still valid for the
 * authenticated DELETE.
 */
export async function unregisterForPushNotifications(): Promise<void> {
  try {
    const cached = await readCache();
    if (cached?.token) {
      await fetch(`${apiBase()}/push/unregister`, {
        method: "DELETE",
        headers: await authHeaders(),
        body: JSON.stringify({ expoPushToken: cached.token }),
        signal: makeRequestTimeoutSignal(15_000),
      });
    }
  } catch (err) {
    console.debug("[push] unregister error", err);
  } finally {
    await clearCache();
  }
}
