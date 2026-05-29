import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { ClerkProvider, ClerkLoaded } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import React, { useEffect, useRef } from "react";
import { Alert, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CloudSyncProvider } from "@/components/CloudSyncManager";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LockScreen } from "@/components/LockScreen";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SyncSuccessToast } from "@/components/SyncSuccessToast";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { AppLockProvider, useAppLock } from "@/context/AppLockContext";
import { AppProvider } from "@/context/AppContext";
import { JournalProvider } from "@/context/JournalContext";
import { RagnaLearningProvider, useRagnaLearning } from "@/context/RagnaLearningContext";
import { RemindersProvider } from "@/context/RemindersContext";
import { SymptomProvider } from "@/context/SymptomContext";
import { useVeraMemory, VeraMemoryProvider } from "@/context/VeraMemoryContext";
import { initializeRevenueCat, SubscriptionProvider } from "@/context/SubscriptionContext";
import { synthesizeFromActivity } from "@/services/aiService";

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

try {
  initializeRevenueCat();
} catch (err: unknown) {
  const e = err as { message?: string };
  Alert.alert("RevenueCat Unavailable", e?.message ?? "Subscription features may not be available.");
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

// LearningSync bridges RagnaLearningContext and VeraMemoryContext.
// It silently synthesizes the living profile from app-activity observations
// whenever 3+ significant events have accumulated and 2 hours have passed
// since the last synthesis — no user action required.
function LearningSync() {
  const { observations, significantCount, lastSignificantAt } = useRagnaLearning();
  const { livingProfile, updateLivingProfile } = useVeraMemory();
  const lastSynthesisAt = useRef<number>(0);

  useEffect(() => {
    if (significantCount < 3) return;
    if (!lastSignificantAt) return;
    const twoHours = 2 * 60 * 60 * 1000;
    if (Date.now() - lastSynthesisAt.current < twoHours) return;
    lastSynthesisAt.current = Date.now();
    const sigObs = observations
      .filter((o) => o.significant)
      .slice(0, 8)
      .map((o) => ({ summary: o.summary, type: o.type, date: o.date }));
    synthesizeFromActivity(livingProfile, sigObs)
      .then((profile) => {
        if (profile) updateLivingProfile(profile);
      })
      .catch(() => {});
  }, [lastSignificantAt, significantCount]);

  return null;
}

// LockOverlay renders the full-screen lock screen above all app content
// whenever the app lock is enabled and the lock state is active.
function LockOverlay() {
  const { isLocked, isLockEnabled, unlock } = useAppLock();
  if (!isLockEnabled || !isLocked) return null;
  return <LockScreen onUnlock={unlock} />;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="resource/[id]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Back",
          headerTransparent: true,
          headerTintColor: "#EEF4FF",
        }}
      />
      <Stack.Screen
        name="provider/[id]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Back",
          headerTransparent: true,
          headerTintColor: "#EEF4FF",
        }}
      />
      <Stack.Screen
        name="journey/[stage]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Back",
          headerTransparent: true,
          headerTintColor: "#EEF4FF",
        }}
      />
      <Stack.Screen
        name="evaluation"
        options={{
          headerShown: true,
          headerTitle: "Eligibility Assessment",
          headerBackTitle: "Back",
          headerTintColor: "#EEF4FF",
          headerStyle: { backgroundColor: "#091734" },
          headerTitleStyle: { color: "#EEF4FF", fontFamily: "Inter_700Bold" },
        }}
      />
      <Stack.Screen
        name="support"
        options={{
          headerShown: true,
          headerTitle: "Contact Support",
          headerBackTitle: "Back",
          headerTintColor: "#EEF4FF",
          headerStyle: { backgroundColor: "#091734" },
          headerTitleStyle: { color: "#EEF4FF", fontFamily: "Inter_700Bold" },
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          headerShown: true,
          headerTitle: "Privacy Policy",
          headerBackTitle: "Back",
          headerTintColor: "#EEF4FF",
          headerStyle: { backgroundColor: "#091734" },
          headerTitleStyle: { color: "#EEF4FF", fontFamily: "Inter_700Bold" },
        }}
      />
      <Stack.Screen
        name="terms"
        options={{
          headerShown: true,
          headerTitle: "Terms of Use",
          headerBackTitle: "Back",
          headerTintColor: "#EEF4FF",
          headerStyle: { backgroundColor: "#091734" },
          headerTitleStyle: { color: "#EEF4FF", fontFamily: "Inter_700Bold" },
        }}
      />
      <Stack.Screen
        name="symptom-tracker"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="goals-of-care"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="active-dying"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="painad"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="situation-finder"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="guidance/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="emergency-card"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="journal"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="journal-entry"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="reminders"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="resources"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="data-controls"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="medication-lookup"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="patient-profile"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ragna-privacy"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="hospice-interview"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="legal"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="account"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="paywall"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="call-scripts"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="family-updates"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="hospice-journey-context"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Handle escalation notification taps — navigate to Ragna with a pre-loaded message.
  // Handles both: (a) foreground/background taps via the listener, and (b) cold-start
  // (app launched from terminated state) via getLastNotificationResponseAsync.
  useEffect(() => {
    if (!Notifications) return;

    function routeEscalationNotification(data: Record<string, unknown> | undefined) {
      if (!data || data.type !== "escalation") return;
      const initialMessage = typeof data.initialMessage === "string" ? data.initialMessage : undefined;
      if (!initialMessage) return;
      setTimeout(() => {
        try {
          router.push({ pathname: "/(tabs)/help", params: { initialMessage } } as any);
        } catch {
          // Navigation not yet ready — skip
        }
      }, 300);
    }

    // Cold-start: check if the app was opened by tapping an escalation notification
    Notifications!.getLastNotificationResponseAsync()
      .then((lastResponse) => {
        if (!lastResponse) return;
        const data = lastResponse.notification.request.content.data as Record<string, unknown> | undefined;
        routeEscalationNotification(data);
      })
      .catch(() => {});

    // Foreground / background tap listener
    const subscription = Notifications!.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      routeEscalationNotification(data);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const id = "rn-web-scroll-fix";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    // React Native Web: Pressable calls setPointerCapture() which locks the
    // pointer stream to itself after a click, preventing the parent ScrollView
    // from receiving subsequent drag events.  touch-action: pan-y instructs
    // the browser to handle vertical scrolling natively even when JS holds
    // pointer capture — this is the W3C-standard fix for this pattern.
    el.textContent = [
      "div[style*='overflow: scroll'] { touch-action: pan-y !important; }",
      "div[style*='overflow:scroll']  { touch-action: pan-y !important; }",
      "div[style*='overflow: auto']   { touch-action: pan-y !important; }",
      "div[style*='overflow:auto']    { touch-action: pan-y !important; }",
    ].join("\n");
    document.head.appendChild(el);
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      proxyUrl={proxyUrl}
    >
      <ClerkLoaded>
        <SafeAreaProvider>
          <ErrorBoundary>
            <AccessibilityProvider>
            <AppProvider>
              <JournalProvider>
              <RemindersProvider>
              <SymptomProvider>
              <VeraMemoryProvider>
              <RagnaLearningProvider>
              <QueryClientProvider client={queryClient}>
                <SubscriptionProvider>
                <AppLockProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <CloudSyncProvider>
                    <View style={{ flex: 1 }}>
                      <LearningSync />
                      <RootLayoutNav />
                      <OfflineBanner />
                      <SyncSuccessToast />
                      <LockOverlay />
                    </View>
                  </CloudSyncProvider>
                </GestureHandlerRootView>
                </AppLockProvider>
                </SubscriptionProvider>
              </QueryClientProvider>
              </RagnaLearningProvider>
              </VeraMemoryProvider>
              </SymptomProvider>
              </RemindersProvider>
              </JournalProvider>
            </AppProvider>
            </AccessibilityProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
