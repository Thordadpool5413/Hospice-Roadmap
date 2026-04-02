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
 *   isInternetReachable — mirrors isOnline; null before the first check.
 *   hasCheckedNetwork   — true after the first network probe completes.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

import { apiBase } from "@/services/apiClient";

const CHECK_INTERVAL_MS = 5_000;
const OFFLINE_RETRY_MS = 3_000;
const PROBE_TIMEOUT_MS = 8_000;

async function checkServerReachable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(`${apiBase()}/healthz`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(id);
    return res.ok;
  } catch {
    return false;
  }
}

export interface AppNetworkState {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  hasCheckedNetwork: boolean;
}

export function useAppNetwork(): AppNetworkState {
  const [state, setState] = useState<AppNetworkState>({
    isOnline: true,       // Optimistic default — avoids false-negatives on launch.
    isInternetReachable: null,
    hasCheckedNetwork: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    const reachable = await checkServerReachable();
    setState({
      isOnline: reachable,
      isInternetReachable: reachable,
      hasCheckedNetwork: true,
    });
  }, []);

  useEffect(() => {
    check();

    if (Platform.OS === "web") {
      const onOnline = () =>
        setState({ isOnline: true, isInternetReachable: true, hasCheckedNetwork: true });
      const onOffline = () =>
        setState({ isOnline: false, isInternetReachable: false, hasCheckedNetwork: true });
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }

    // When offline, retry every OFFLINE_RETRY_MS; when online, every CHECK_INTERVAL_MS.
    // This recovers quickly from a cold-start probe failure without hammering the server.
    let scheduled: ReturnType<typeof setTimeout> | null = null;
    function schedule(online: boolean) {
      if (scheduled) clearTimeout(scheduled);
      scheduled = setTimeout(async () => {
        const reachable = await checkServerReachable();
        setState({
          isOnline: reachable,
          isInternetReachable: reachable,
          hasCheckedNetwork: true,
        });
        schedule(reachable);
      }, online ? CHECK_INTERVAL_MS : OFFLINE_RETRY_MS);
    }

    // Kick off the adaptive schedule after the first check resolves.
    checkServerReachable().then((reachable) => {
      setState({ isOnline: reachable, isInternetReachable: reachable, hasCheckedNetwork: true });
      schedule(reachable);
    });

    const sub = AppState.addEventListener(
      "change",
      (status: AppStateStatus) => {
        if (status === "active") check();
      }
    );

    return () => {
      if (scheduled) clearTimeout(scheduled);
      sub.remove();
    };
  }, [check]);

  return state;
}
