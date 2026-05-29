import { useAuth } from "@clerk/expo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";
import Constants from "expo-constants";

import { ENTITLEMENT_IDENTIFIER } from "@/constants/subscriptionProducts";

const REVENUECAT_TEST_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? "";
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "";
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "";

function getRevenueCatApiKey(): string {
  if (__DEV__ || Platform.OS === "web" || Constants.executionEnvironment === "storeClient") {
    return REVENUECAT_TEST_API_KEY;
  }
  if (Platform.OS === "ios") return REVENUECAT_IOS_API_KEY;
  if (Platform.OS === "android") return REVENUECAT_ANDROID_API_KEY;
  return REVENUECAT_TEST_API_KEY;
}

export function initializeRevenueCat(): void {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) throw new Error("RevenueCat API key is not configured");
  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
}

interface SubscriptionContextValue {
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  purchase: (pkg: PurchasesPackage) => Promise<CustomerInfo>;
  restorePurchases: () => Promise<CustomerInfo>;
  isPurchasing: boolean;
  isRestoring: boolean;
  refreshCustomerInfo: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Load initial customer info and offerings
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [info, offers] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);
        if (!cancelled) {
          setCustomerInfo(info);
          setOfferings(offers);
        }
      } catch {
        // RevenueCat unavailable (e.g. no network) — app continues with free tier
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Identify user with RevenueCat when Clerk userId becomes available
  useEffect(() => {
    if (!userId) return;
    Purchases.logIn(userId).catch(() => {
      // Non-fatal: subscription state still works per device
    });
  }, [userId]);

  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch {
      // Non-fatal
    }
  }, []);

  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<CustomerInfo> => {
    setIsPurchasing(true);
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(info);
      return info;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<CustomerInfo> => {
    setIsRestoring(true);
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return info;
    } finally {
      setIsRestoring(false);
    }
  }, []);

  const isPremium =
    customerInfo?.entitlements.active?.[ENTITLEMENT_IDENTIFIER] !== undefined;

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isLoading,
        customerInfo,
        offerings,
        purchase,
        restorePurchases,
        isPurchasing,
        isRestoring,
        refreshCustomerInfo,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within a SubscriptionProvider");
  return ctx;
}
