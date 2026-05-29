import { router } from "expo-router";
import { useCallback } from "react";

export type PaywallFromPlan = "caregiver";

interface OpenPaywallOptions {
  fromPlan?: PaywallFromPlan;
}

export function usePaywall() {
  const openPaywall = useCallback((options?: OpenPaywallOptions) => {
    if (options?.fromPlan) {
      router.push(`/paywall?fromPlan=${options.fromPlan}` as any);
    } else {
      router.push("/paywall");
    }
  }, []);

  return { openPaywall };
}
