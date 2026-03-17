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
import React, { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { AppProvider } from "@/context/AppContext";
import { JournalProvider } from "@/context/JournalContext";
import { RemindersProvider } from "@/context/RemindersContext";
import { SymptomProvider } from "@/context/SymptomContext";
import { VeraMemoryProvider } from "@/context/VeraMemoryContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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
          headerTintColor: "#1C2228",
        }}
      />
      <Stack.Screen
        name="provider/[id]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Back",
          headerTransparent: true,
          headerTintColor: "#1C2228",
        }}
      />
      <Stack.Screen
        name="journey/[stage]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Back",
          headerTransparent: true,
          headerTintColor: "#1C2228",
        }}
      />
      <Stack.Screen
        name="evaluation"
        options={{
          headerShown: true,
          headerTitle: "Eligibility Assessment",
          headerBackTitle: "Back",
          headerTintColor: "#1C2228",
        }}
      />
      <Stack.Screen
        name="support"
        options={{
          headerShown: true,
          headerTitle: "Contact Support",
          headerBackTitle: "Back",
          headerTintColor: "#1C2228",
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          headerShown: true,
          headerTitle: "Privacy Policy",
          headerBackTitle: "Back",
          headerTintColor: "#1C2228",
        }}
      />
      <Stack.Screen
        name="terms"
        options={{
          headerShown: true,
          headerTitle: "Terms of Use",
          headerBackTitle: "Back",
          headerTintColor: "#1C2228",
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
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <View style={{ flex: 1 }}>
                  <RootLayoutNav />
                  <OfflineBanner />
                </View>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
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
