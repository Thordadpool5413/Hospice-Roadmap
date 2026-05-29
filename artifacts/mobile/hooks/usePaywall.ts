import { router } from "expo-router";
import { useCallback } from "react";

export function usePaywall() {
  const openPaywall = useCallback(() => {
    router.push("/paywall");
  }, []);

  return { openPaywall };
}
