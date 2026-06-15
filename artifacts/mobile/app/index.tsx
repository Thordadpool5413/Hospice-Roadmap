import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/colors";
import { claimDevice } from "@/services/aiService";

const DEVICE_CLAIMED_KEY = "@device_claimed";
const CLIENT_ID_STORAGE_KEY = "ragna_client_id";

async function runDeviceClaimIfNeeded(): Promise<boolean> {
  try {
    const alreadyClaimed = await AsyncStorage.getItem(DEVICE_CLAIMED_KEY);
    if (alreadyClaimed) return true;

    const clientId = await AsyncStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (!clientId || !/^client_[a-z0-9_]+$/.test(clientId)) {
      return true;
    }

    const claimed = await claimDevice(clientId);
    if (claimed !== null) {
      await AsyncStorage.setItem(DEVICE_CLAIMED_KEY, "1");
    }
    return true;
  } catch {
    return true;
  }
}

export default function IndexScreen() {
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const { isOnboarded, isLoading } = useApp();
  const claimAttempted = useRef(false);
  const [claimReady, setClaimReady] = useState(false);

  useEffect(() => {
    if (!isClerkLoaded || isLoading) return;

    if (!isSignedIn) {
      setClaimReady(true);
      return;
    }

    if (!claimAttempted.current) {
      claimAttempted.current = true;
      void runDeviceClaimIfNeeded().then(() => setClaimReady(true));
      return;
    }
  }, [isSignedIn, isClerkLoaded, isOnboarded, isLoading]);

  useEffect(() => {
    if (!claimReady || !isClerkLoaded || isLoading) return;

    if (!isSignedIn) {
      router.replace("/(auth)/sign-in");
    } else if (isOnboarded) {
      router.replace("/(tabs)");
    } else {
      router.replace("/onboarding");
    }
  }, [claimReady, isSignedIn, isClerkLoaded, isOnboarded, isLoading]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
