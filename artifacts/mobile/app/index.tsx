import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

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

  // Video intro state
  const [showVideo, setShowVideo] = useState(true);

  const player = useVideoPlayer(
    require("@/assets/HospiceRoadmap_SplashScreen.mp4"),
    (player) => {
      player.loop = false;
      player.play();
    }
  );

  const handleVideoEnd = () => {
    setShowVideo(false);
  };

  const handleSkip = () => {
    player.pause();
    setShowVideo(false);
  };

  useEffect(() => {
    if (!isClerkLoaded || isLoading || showVideo) return;

    if (!isSignedIn) {
      setClaimReady(true);
      return;
    }

    if (!claimAttempted.current) {
      claimAttempted.current = true;
      void runDeviceClaimIfNeeded().then(() => setClaimReady(true));
      return;
    }
  }, [isSignedIn, isClerkLoaded, isOnboarded, isLoading, showVideo]);

  useEffect(() => {
    if (!claimReady || !isClerkLoaded || isLoading || showVideo) return;

    if (!isSignedIn) {
      router.replace("/(auth)/sign-in");
    } else if (isOnboarded) {
      router.replace("/(tabs)");
    } else {
      router.replace("/onboarding");
    }
  }, [claimReady, isSignedIn, isClerkLoaded, isOnboarded, isLoading, showVideo]);

  // Show video intro first
  if (showVideo) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <VideoView
          player={player}
          style={{ flex: 1 }}
          contentFit="cover"
          nativeControls={false}
        />
        <Pressable
          onPress={handleSkip}
          style={{
            position: "absolute",
            top: 60,
            right: 20,
            backgroundColor: "rgba(0,0,0,0.6)",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: "white", fontSize: 14 }}>Skip</Text>
        </Pressable>
      </View>
    );
  }

  // Normal loading / redirect screen
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
