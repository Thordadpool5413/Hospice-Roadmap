import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/colors";

export default function IndexScreen() {
  const { isOnboarded, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading) {
      if (isOnboarded) {
        router.replace("/(tabs)");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [isOnboarded, isLoading]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
