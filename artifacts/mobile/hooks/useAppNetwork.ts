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

import { apiBase } from "@/services/apiClient";

const CHECK_INTERVAL_MS = 5_000;
const OFFLINE_RETRY_MS = 3_000;
const PROBE_TIMEOUT_MS = 8_000;
const GENERIC_PROBE_URLS = [
  "https://captive.apple.com/hotspot-detect.html",
  "https://www.gstatic.com/generate_204",
];
const LOCAL_API_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/api/i;

export interface AppNetworkState {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  hasCheckedNetwork: boolean;
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

async function checkServerReachable(): Promise<boolean> {
  try {
    const baseUrl = apiBase();
    if (Platform.OS !== "web" && LOCAL_API_PATTERN.test(baseUrl)) {
      return false;
    }
    const res = await fetchWithTimeout(`${baseUrl}/healthz`);
    return res.ok;
  } catch {
    return false;
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
  const apiReachable = await checkServerReachable();
  if (apiReachable) {
    return {
      isOnline: true,
      isInternetReachable: true,
      hasCheckedNetwork: true,
    };
  }

  const internetReachable = await checkInternetReachable();
  return {
    isOnline: internetReachable,
    isInternetReachable: internetReachable,
    hasCheckedNetwork: true,
  };
}

export function useAppNetwork(): AppNetworkState {
  const [state, setState] = useState<AppNetworkState>({
    isOnline: true,
    isInternetReachable: null,
    hasCheckedNetwork: false,
  });

  const check = useCallback(async () => {
    if (Platform.OS === "web") {
      const online =
        typeof navigator !== "undefined" ? navigator.onLine : true;
      setState({
        isOnline: online,
        isInternetReachable: online,
        hasCheckedNetwork: true,
      });
      return;
    }

    const nextState = await getNativeNetworkState();
    setState(nextState);
  }, []);

  useEffect(() => {
    void check();

    if (Platform.OS === "web") {
      const onOnline = () =>
        setState({
          isOnline: true,
          isInternetReachable: true,
          hasCheckedNetwork: true,
        });
      const onOffline = () =>
        setState({
          isOnline: false,
          isInternetReachable: false,
          hasCheckedNetwork: true,
        });
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
