/**
 * useAppNetwork — single shared hook for app-wide network state.
 *
 * Replaces direct NetInfo subscriptions and ad-hoc health-check patterns
 * in individual screens. Polls the API health endpoint on native; uses
 * browser events on web.
 *
 * Return shape:
 *   isOnline            — false only when connectivity is clearly absent.
 *                         Defaults to true until proven otherwise so the app
 *                         doesn't incorrectly block features on startup.
 *   isInternetReachable — mirrors internet reachability on native and web.
 *                         null before the first check.
 *   hasCheckedNetwork   — true after the first network probe completes.
 */

import { useCallback, useEffect, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

import { apiBase, ApiBaseConfigurationError } from "@/services/apiClient";

const CHECK_INTERVAL_MS = 5_000;
const OFFLINE_RETRY_MS = 3_000;
const PROBE_TIMEOUT_MS = 8_000;
const GENERIC_PROBE_URLS = [
  "https://captive.apple.com/hotspot-detect.html",
  "https://www.gstatic.com/generate_204",
];

export type AppNetworkIssue =
  | "online"
  | "offline"
  | "api-unreachable"
  | "api-misconfigured";

export interface AppNetworkState {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  hasCheckedNetwork: boolean;
  issue: AppNetworkIssue;
  statusMessage: string | null;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(id);
  }
}

function buildNetworkState(
  issue: AppNetworkIssue,
  isInternetReachable: boolean | null,
): AppNetworkState {
  switch (issue) {
    case "online":
      return {
        isOnline: true,
        isInternetReachable: true,
        hasCheckedNetwork: true,
        issue: "online",
        statusMessage: null,
      };
    case "api-misconfigured":
      return {
        isOnline: false,
        isInternetReachable,
        hasCheckedNetwork: true,
        issue: "api-misconfigured",
        statusMessage:
          "This app build is missing its secure server connection settings. Update the app or contact support.",
      };
    case "api-unreachable":
      return {
        isOnline: false,
        isInternetReachable,
        hasCheckedNetwork: true,
        issue: "api-unreachable",
        statusMessage:
          "Hospice Roadmap can't reach its server right now. AI and provider search are temporarily unavailable.",
      };
    case "offline":
    default:
      return {
        isOnline: false,
        isInternetReachable: false,
        hasCheckedNetwork: true,
        issue: "offline",
        statusMessage:
          "No internet connection. AI and provider search will work again when you're back online.",
      };
  }
}

async function checkServerReachable(): Promise<AppNetworkIssue> {
  try {
    const baseUrl = apiBase();
    const res = await fetchWithTimeout(`${baseUrl}/healthz`);
    return res.ok ? "online" : "api-unreachable";
  } catch (error) {
    if (error instanceof ApiBaseConfigurationError) {
      return "api-misconfigured";
    }
    return "api-unreachable";
  }
}

async function checkInternetReachable(): Promise<boolean> {
  for (const url of GENERIC_PROBE_URLS) {
    try {
      const res = await fetchWithTimeout(url);
      if (res.ok || res.status === 204) {
        return true;
      }
    } catch {
      // Try the next probe URL.
    }
  }
  return false;
}

async function getNativeNetworkState(): Promise<AppNetworkState> {
  const serverIssue = await checkServerReachable();
  if (serverIssue === "online") {
    return buildNetworkState("online", true);
  }

  const internetReachable = await checkInternetReachable();
  if (!internetReachable) {
    return buildNetworkState("offline", false);
  }

  return buildNetworkState(serverIssue, true);
}

export function useAppNetwork(): AppNetworkState {
  const [state, setState] = useState<AppNetworkState>({
    isOnline: true,
    isInternetReachable: null,
    hasCheckedNetwork: false,
    issue: "online",
    statusMessage: null,
  });

  const check = useCallback(async () => {
    if (Platform.OS === "web") {
      const online =
        typeof navigator !== "undefined" ? navigator.onLine : true;
      setState(buildNetworkState(online ? "online" : "offline", online));
      return;
    }

    const nextState = await getNativeNetworkState();
    setState(nextState);
  }, []);

  useEffect(() => {
    void check();

    if (Platform.OS === "web") {
      const onOnline = () =>
        setState(buildNetworkState("online", true));
      const onOffline = () =>
        setState(buildNetworkState("offline", false));
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }

    let scheduled: ReturnType<typeof setTimeout> | null = null;
    function schedule(online: boolean) {
      if (scheduled) clearTimeout(scheduled);
      scheduled = setTimeout(async () => {
        const nextState = await getNativeNetworkState();
        setState(nextState);
        schedule(nextState.isOnline);
      }, online ? CHECK_INTERVAL_MS : OFFLINE_RETRY_MS);
    }

    void getNativeNetworkState().then((nextState) => {
      setState(nextState);
      schedule(nextState.isOnline);
    });

    const sub = AppState.addEventListener(
      "change",
      (status: AppStateStatus) => {
        if (status === "active") {
          void check();
        }
      },
    );

    return () => {
      if (scheduled) clearTimeout(scheduled);
      sub.remove();
    };
  }, [check]);

  return state;
}
