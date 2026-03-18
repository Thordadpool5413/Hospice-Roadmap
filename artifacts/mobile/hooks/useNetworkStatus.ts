import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

const CHECK_INTERVAL_MS = 15000;

function getHealthUrl(): string {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname.replace(".expo.", ".");
    return `https://${host}/api/healthz`;
  }
  const envUrl = process.env["EXPO_PUBLIC_API_URL"];
  const base = envUrl ?? "http://localhost:8080/api";
  return `${base}/healthz`;
}

async function checkReachable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(getHealthUrl(), {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    return res.ok;
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
