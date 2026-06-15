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

  // Intro video sequence: hospice -> ragna -> done
  const [introStage, setIntroStage] = useState<'hospice' | 'ragna' | 'done'>('hospice');

  // Hospice Roadmap video (first intro)
  const hospicePlayer = useVideoPlayer(
    require("@/assets/HospiceRoadmap_SplashScreen.mp4"),
    (player) => {
      player.loop = false;
    }
  );

  // RAGNA video (second intro)
  const ragnaPlayer = useVideoPlayer(
    require("@/assets/HospiceRoadMap_Ragan_SplashScreen.mp4"),
    (player) => {
      player.loop = false;
    }
  );

  const playNext = () => {
    if (introStage === 'hospice') {
      hospicePlayer.pause();
      setIntroStage('ragna');
      // Small delay to ensure UI updates before playing
      setTimeout(() => {
        ragnaPlayer.play();
      }, 50);
    } else if (introStage === 'ragna') {
      ragnaPlayer.pause();
      setIntroStage('done');
    }
  };

  const handleSkip = () => {
    hospicePlayer.pause();
    ragnaPlayer.pause();
    setIntroStage('done');
  };

  // Auto-advance when hospice video ends
  useEffect(() => {
    const subscription = hospicePlayer.addListener('playToEnd', () => {
      if (introStage === 'hospice') {
        playNext();
      }
    });
    return () => subscription?.remove();
  }, [introStage, hospicePlayer]);

  // Auto-advance when ragna video ends
  useEffect(() => {
    const subscription = ragnaPlayer.addListener('playToEnd', () => {
      if (introStage === 'ragna') {
        setIntroStage('done');
      }
    });
    return () => subscription?.remove();
  }, [introStage, ragnaPlayer]);

  // Start playing first video
  useEffect(() => {
    if (introStage === 'hospice') {
      hospicePlayer.play();
    }
  }, [introStage, hospicePlayer]);

  // Existing auth logic (only runs after intros are done)
  useEffect(() => {
    if (!isClerkLoaded || isLoading || introStage !== 'done') return;

    if (!isSignedIn) {
      setClaimReady(true);
      return;
    }

    if (!claimAttempted.current) {
      claimAttempted.current = true;
      void runDeviceClaimIfNeeded().then(() => setClaimReady(true));
      return;
    }
  }, [isSignedIn, isClerkLoaded, isOnboarded, isLoading, introStage]);

  useEffect(() => {
    if (!claimReady || !isClerkLoaded || isLoading || introStage !== 'done') return;

    if (!isSignedIn) {
      router.replace("/(auth)/sign-in");
    } else if (isOnboarded) {
      router.replace("/(tabs)");
    } else {
      router.replace("/onboarding");
    }
  }, [claimReady, isSignedIn, isClerkLoaded, isOnboarded, isLoading, introStage]);

  // Show intro videos
  if (introStage !== 'done') {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        {introStage === 'hospice' && (
          <VideoView
            player={hospicePlayer}
            style={{ flex: 1 }}
            contentFit="cover"
            nativeControls={false}
          />
        )}
        {introStage === 'ragna' && (
          <VideoView
            player={ragnaPlayer}
            style={{ flex: 1 }}
            contentFit="cover"
            nativeControls={false}
          />
        )}

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
          <Text style={{ color: "white", fontSize: 14 }}>Skip Intro</Text>
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
