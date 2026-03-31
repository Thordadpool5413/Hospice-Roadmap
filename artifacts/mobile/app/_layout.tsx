import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { AppProvider } from "@/context/AppContext";
import { JournalProvider } from "@/context/JournalContext";
import { RagnaLearningProvider, useRagnaLearning } from "@/context/RagnaLearningContext";
import { RemindersProvider } from "@/context/RemindersContext";
import { SymptomProvider } from "@/context/SymptomContext";
import { useVeraMemory, VeraMemoryProvider } from "@/context/VeraMemoryContext";
import { synthesizeFromActivity } from "@/services/aiService";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
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
            <GestureHandlerRootView style={{ flex: 1 }}>
              <View style={{ flex: 1 }}>
                <LearningSync />
                <RootLayoutNav />
                <OfflineBanner />
              </View>
            </GestureHandlerRootView>
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
  );
}
