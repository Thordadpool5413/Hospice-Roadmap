import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { ClerkProvider, ClerkLoaded, ClerkLoading, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import React, { useEffect, useRef, useState } from "react";
import { AppState, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CloudSyncProvider } from "@/components/CloudSyncManager";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { AppSplashScreen } from "@/components/AppSplashScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LockScreen } from "@/components/LockScreen";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SyncConflictBanner } from "@/components/SyncConflictBanner";
import { SyncSuccessToast } from "@/components/SyncSuccessToast";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { AppLockProvider, useAppLock } from "@/context/AppLockContext";
import { AppProvider } from "@/context/AppContext";
import { JournalProvider } from "@/context/JournalContext";
import { RagnaLearningProvider, useRagnaLearning } from "@/context/RagnaLearningContext";
import { RemindersProvider } from "@/context/RemindersContext";
import { SymptomProvider } from "@/context/SymptomContext";
import { CaregiverWellnessProvider } from "@/context/CaregiverWellnessContext";
import { useRagnaMemory, RagnaMemoryProvider } from "@/context/RagnaMemoryContext";
import { initializeRevenueCat, SubscriptionProvider } from "@/context/SubscriptionContext";
import { synthesizeFromActivity } from "@/services/aiService";
import { registerForPushNotifications } from "@/services/pushRegistration";
import { registerDevice } from "@/services/deviceRegistration";
import { consumeExplicitSignOut } from "@/services/signOutState";

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

// Safe module-scope initialization — never call Alert.alert() here because
// the React Native bridge is not ready when module-level code executes on iOS.
try {
  initializeRevenueCat();
} catch (err: unknown) {
  const e = err as { message?: string };
  // Log to Metro console so the error is visible when debugging with Expo Go.
  console.warn("[RevenueCat] Initialization skipped:", e?.message ?? "unknown error");
  console.warn("[RevenueCat] Initialization failed:", e?.message ?? "Subscription features may not be available.");
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function getRuntimeExtraConfig(): {
  clerkPublishableKey?: string;
  clerkProxyUrl?: string;
} {
  const constants = Constants as unknown as {
    expoConfig?: {
      extra?: {
        clerkPublishableKey?: string | null;
        clerkProxyUrl?: string | null;
      } | null;
    } | null;
    manifest?: {
      extra?: {
        clerkPublishableKey?: string | null;
        clerkProxyUrl?: string | null;
      } | null;
    } | null;
    manifest2?: {
      extra?: {
        clerkPublishableKey?: string | null;
        clerkProxyUrl?: string | null;
      } | null;
    } | null;
  };

  return {
    clerkPublishableKey:
      constants.expoConfig?.extra?.clerkPublishableKey ??
      constants.manifest?.extra?.clerkPublishableKey ??
      constants.manifest2?.extra?.clerkPublishableKey ??
      undefined,
    clerkProxyUrl:
      constants.expoConfig?.extra?.clerkProxyUrl ??
      constants.manifest?.extra?.clerkProxyUrl ??
      constants.manifest2?.extra?.clerkProxyUrl ??
      undefined,
  };
}

// Read the Clerk publishable key once at module scope so the guard below
// can detect a missing key before attempting to render ClerkProvider.
const runtimeExtra = getRuntimeExtraConfig();
const publishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  runtimeExtra.clerkPublishableKey ||
  "";
const proxyUrl =
  process.env.EXPO_PUBLIC_CLERK_PROXY_URL ||
  runtimeExtra.clerkProxyUrl ||
  undefined;

/**
 * AuthTokenBridge — registers the Clerk token getter BEFORE CloudSyncProvider
 * fires its initial sync.
 *
 * Placement: inside ClerkLoaded (so useAuth() is available) but as a sibling
 * rendered before CloudSyncProvider in the tree. This guarantees that
 * getAuthToken() returns a valid token when the first runSync() call executes,
 * preventing an unauthenticated initial sync that would skip data restore and
 * consume the `initialized.current` flag permanently.
 *
 * The same setter is also called in (tabs)/_layout.tsx for redundancy, but
 * having it here ensures the critical first-sync path is always authenticated.
 */
function AuthTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}

/**
 * PushRegistration — registers this device's Expo push token with the server
 * once the user is signed in. Rendered AFTER AuthTokenBridge so the Clerk token
 * getter is already wired up when registerForPushNotifications() calls
 * getAuthToken(). Registration degrades gracefully (web / Expo Go / denied
 * permission all no-op silently) and is cached by userId+token to avoid
 * re-registering on every launch.
 */
function PushRegistration() {
  const { isSignedIn, userId } = useAuth();
  const registeredFor = useRef<string | null>(null);
  useEffect(() => {
    if (!isSignedIn || !userId) return;
    if (registeredFor.current === userId) return;
    registeredFor.current = userId;
    registerForPushNotifications(userId).catch(() => {});
  }, [isSignedIn, userId]);
  return null;
}

// LearningSync bridges RagnaLearningContext and RagnaMemoryContext.
// It silently synthesizes the living profile from app-activity observations
// whenever 3+ significant events have accumulated and 2 hours have passed
// since the last synthesis — no user action required.
function LearningSync() {
  const { observations, significantCount, lastSignificantAt } = useRagnaLearning();
  const { livingProfile, updateLivingProfile } = useRagnaMemory();
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

/**
 * DeviceRegistration — fires on sign-in AND on every app foreground (with a
 * 5-minute debounce). On each call, the server upserts this device's active
 * Clerk session and revokes all OTHER sessions for the same userId, enforcing
 * one active device per account.
 *
 * Two triggers:
 *   1. Sign-in / new session: useEffect on (isSignedIn, userId, sessionId)
 *   2. App foreground: AppState "change" → "active" listener
 *
 * Debounce: skips the API call if the same (userId:sessionId) key was
 * registered within the last 5 minutes, preventing excessive calls during
 * rapid background/foreground cycles.
 *
 * Placed AFTER AuthTokenBridge so getAuthToken() is wired before the first
 * API call.
 */
function DeviceRegistration() {
  const { isSignedIn, userId, sessionId } = useAuth();

  // Keep a ref to the latest auth state so the AppState listener always reads
  // current values without needing to be re-registered on every render.
  const authStateRef = useRef({ isSignedIn, userId, sessionId });
  authStateRef.current = { isSignedIn, userId, sessionId };

  const lastRegisteredKey = useRef<string | null>(null);
  const lastRegisteredAt = useRef<number>(0);
  const DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes

  const doRegister = () => {
    const { isSignedIn, userId, sessionId } = authStateRef.current;
    if (!isSignedIn || !userId || !sessionId) return;
    const key = `${userId}:${sessionId}`;
    const now = Date.now();
    // Allow immediate re-registration on a new session; debounce same session.
    if (lastRegisteredKey.current === key && now - lastRegisteredAt.current < DEBOUNCE_MS) return;
    lastRegisteredKey.current = key;
    lastRegisteredAt.current = now;
    registerDevice().catch((err) => {
      console.debug("[device-registration] failed:", err);
    });
  };

  // Trigger 1: sign-in or new Clerk session
  useEffect(() => {
    doRegister();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, userId, sessionId]);

  // Trigger 2: app foreground — re-registers to kick any device that signed
  // in while this device was backgrounded, and refreshes lastSeenAt.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        doRegister();
      }
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/**
 * RevocationGuard — detects when the user's Clerk session is revoked by a
 * second device signing in. When isSignedIn transitions true → false without a
 * user-initiated sign-out (tracked via markExplicitSignOut /
 * consumeExplicitSignOut), it shows a dismissible banner then navigates to the
 * sign-in screen after a 2.5-second delay so the user can read the message.
 */
function RevocationGuard() {
  const { isSignedIn } = useAuth();
  const prevIsSignedIn = useRef<boolean>(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const was = prevIsSignedIn.current;
    prevIsSignedIn.current = isSignedIn === true;

    if (was && !isSignedIn) {
      if (!consumeExplicitSignOut()) {
        setVisible(true);
        setTimeout(() => {
          try {
            router.replace("/(auth)/sign-in" as any);
          } catch {}
        }, 2500);
      }
    }
  }, [isSignedIn]);

  if (!visible) return null;

  return (
    <View style={revocationBanner.overlay} pointerEvents="box-none">
      <View style={revocationBanner.card}>
        <Text style={revocationBanner.message}>
          Your account was signed in on another device. Please sign in again.
        </Text>
        <Pressable onPress={() => setVisible(false)} hitSlop={8}>
          <Text style={revocationBanner.dismiss}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const revocationBanner = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    paddingTop: 52,
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1a2c4e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C8541A",
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    flex: 1,
    fontSize: 13,
    color: "#EEF4FF",
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  dismiss: {
    fontSize: 16,
    color: "#90A8CC",
    paddingLeft: 4,
  },
});

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

  const fontsReady = fontsLoaded || !!fontError;

  // Handle notification taps — routes to the correct screen based on notification type.
  // Handles both: (a) foreground/background taps via the listener, and (b) cold-start
  // (app launched from terminated state) via getLastNotificationResponseAsync.
  useEffect(() => {
    if (!Notifications) return;

    function routeNotification(data: Record<string, unknown> | undefined) {
      if (!data) return;

      if (data.type === "escalation") {
        const initialMessage = typeof data.initialMessage === "string" ? data.initialMessage : undefined;
        if (!initialMessage) return;
        setTimeout(() => {
          try {
            router.push({ pathname: "/(tabs)/help", params: { initialMessage } } as any);
          } catch {
            // Navigation not yet ready — skip
          }
        }, 300);
        return;
      }

      if (data.type === "wellness_reminder") {
        setTimeout(() => {
          try {
            router.push("/(tabs)/" as any);
          } catch {
            // Navigation not yet ready — skip
          }
        }, 300);
        return;
      }
    }

    // Cold-start: check if the app was opened by tapping a notification
    Notifications!.getLastNotificationResponseAsync()
      .then((lastResponse) => {
        if (!lastResponse) return;
        const data = lastResponse.notification.request.content.data as Record<string, unknown> | undefined;
        routeNotification(data);
      })
      .catch(() => {});

    // Foreground / background tap listener
    const subscription = Notifications!.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      routeNotification(data);
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

  // Safe loading state — dark view keeps the splash color while fonts load.
  // Never return null: on iOS a null root causes a brief blank flash before
  // the React tree has a chance to paint.
  if (!fontsReady) {
    return <View style={{ flex: 1, backgroundColor: "#1A1840" }} />;
  }

  // Guard against a missing Clerk publishable key (e.g. EAS secret not
  // configured for this build profile). Rendering ClerkProvider with an empty
  // key throws synchronously and crashes the app; show a safe error instead.
  if (!publishableKey) {
    return (
      <View style={{ flex: 1, backgroundColor: "#030A18", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Text style={{ color: "#EEF4FF", fontSize: 16, textAlign: "center", lineHeight: 24 }}>
          App configuration error — authentication could not be initialized.{"\n\n"}Please update to the latest version or contact support.
        </Text>
      </View>
    );
  }

  return (
    // ErrorBoundary is placed OUTSIDE ClerkProvider so it catches any error
    // thrown by ClerkProvider itself (e.g. invalid key format, network error
    // during token refresh) and shows a safe fallback instead of crashing.
    <ErrorBoundary>
      <ClerkProvider
        publishableKey={publishableKey}
        tokenCache={tokenCache}
        proxyUrl={proxyUrl}
      >
        {/* ClerkLoading renders a matching dark view while Clerk bootstraps
            (reads the keychain / refreshes the session token). Without this,
            the tree under ClerkLoaded is simply absent during init, which
            produces a blank white flash on fast devices. */}
        <ClerkLoading>
          <SafeAreaProvider>
            <View style={{ flex: 1, backgroundColor: "#1A1840" }} />
          </SafeAreaProvider>
        </ClerkLoading>

        <ClerkLoaded>
          <SafeAreaProvider>
            <AppSplashScreen fontsReady={fontsReady} />
            <ErrorBoundary>
              <AccessibilityProvider>
              <AppProvider>
                <JournalProvider>
                <RemindersProvider>
                <SymptomProvider>
                <CaregiverWellnessProvider>
                <RagnaMemoryProvider>
                <RagnaLearningProvider>
                <QueryClientProvider client={queryClient}>
                  <SubscriptionProvider>
                  <AppLockProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <AuthTokenBridge />
                    <PushRegistration />
                    <DeviceRegistration />
                    <CloudSyncProvider>
                      <View style={{ flex: 1 }}>
                        <LearningSync />
                        <RootLayoutNav />
                        <OfflineBanner />
                        <SyncConflictBanner />
                        <SyncSuccessToast />
                        <LockOverlay />
                        <RevocationGuard />
                      </View>
                    </CloudSyncProvider>
                  </GestureHandlerRootView>
                  </AppLockProvider>
                  </SubscriptionProvider>
                </QueryClientProvider>
                </RagnaLearningProvider>
                </RagnaMemoryProvider>
                </CaregiverWellnessProvider>
                </SymptomProvider>
                </RemindersProvider>
                </JournalProvider>
              </AppProvider>
              </AccessibilityProvider>
            </ErrorBoundary>
          </SafeAreaProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
