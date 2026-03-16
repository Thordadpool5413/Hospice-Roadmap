import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

const CONNECTIVITY_URL = "https://clients3.google.com/generate_204";
const CHECK_INTERVAL_MS = 12000;

async function checkReachable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(CONNECTIVITY_URL, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    if (Platform.OS === "web") {
      setIsOnline(navigator.onLine);
      return;
    }
    const reachable = await checkReachable();
    setIsOnline(reachable);
  }, []);

  useEffect(() => {
    check();

    if (Platform.OS === "web") {
      const onOnline = () => setIsOnline(true);
      const onOffline = () => setIsOnline(false);
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }

    intervalRef.current = setInterval(check, CHECK_INTERVAL_MS);

    const sub = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") check();
      }
    );

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, [check]);

  return { isOnline };
}
