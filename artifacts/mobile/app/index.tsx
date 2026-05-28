import { useAuth } from "@clerk/expo";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/colors";

export default function IndexScreen() {
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const { isOnboarded, isLoading } = useApp();

  useEffect(() => {
    if (!isClerkLoaded || isLoading) return;

    if (!isSignedIn) {
      router.replace("/(auth)/sign-in");
    } else if (isOnboarded) {
      router.replace("/(tabs)");
    } else {
      router.replace("/onboarding");
    }
  }, [isSignedIn, isClerkLoaded, isOnboarded, isLoading]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
