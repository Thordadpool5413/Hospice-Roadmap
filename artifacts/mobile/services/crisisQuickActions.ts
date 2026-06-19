import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

const isExpoGo = Constants.executionEnvironment === "storeClient";

let QuickActions: typeof import("expo-quick-actions") | null = null;
if (Platform.OS === "ios" && !isExpoGo) {
  try {
    QuickActions = require("expo-quick-actions");
  } catch {
    QuickActions = null;
  }
}

const CRISIS_ACTION_ID = "need-help-now";

export async function setupCrisisQuickActions(): Promise<void> {
  if (!QuickActions) return;
  try {
    await QuickActions.setItems([
      {
        id: CRISIS_ACTION_ID,
        title: "I need help now",
        subtitle: "Crisis guidance in 3 taps",
        icon: "symbol:exclamationmark.triangle.fill",
      },
      {
        id: "emergency-card",
        title: "Emergency card",
        subtitle: "Contacts & patient info",
        icon: "symbol:phone.fill",
      },
    ]);
  } catch {
    // Quick actions unavailable on this build
  }
}

export function handleQuickActionRoute(
  actionId: string | undefined,
  routerPush: (path: string) => void,
): boolean {
  if (!actionId) return false;
  if (actionId === CRISIS_ACTION_ID) {
    routerPush("/need-help-now");
    return true;
  }
  if (actionId === "emergency-card") {
    routerPush("/emergency-card");
    return true;
  }
  return false;
}

export function handleDeepLinkRoute(
  url: string | null,
  routerPush: (path: string) => void,
): boolean {
  if (!url) return false;
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path?.replace(/^\//, "") ?? "";
    if (path === "need-help-now" || parsed.hostname === "need-help-now") {
      routerPush("/need-help-now");
      return true;
    }
    if (path === "emergency-card" || parsed.hostname === "emergency-card") {
      routerPush("/emergency-card");
      return true;
    }
    if (path === "unsure-wizard" || parsed.hostname === "unsure-wizard") {
      routerPush("/unsure-wizard");
      return true;
    }
  } catch {
    // ignore malformed URLs
  }
  return false;
}

export const LOCK_SCREEN_SHORTCUT_HINT =
  "Tip: In the Shortcuts app, create a Lock Screen shortcut that opens mobile://need-help-now for one-tap crisis access.";