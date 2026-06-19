import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { claimDevice } from "@/services/aiService";
import {
  hasSeenIntroVideos,
  markIntroVideosSeen,
} from "@/services/introPreference";

const DEVICE_CLAIMED_KEY = "@device_claimed";
const CLIENT_ID_STORAGE_KEY = "ragna_client_id";

type IntroStage = "loading" | "hospice" | "ragna" | "done";

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
  const [introStage, setIntroStage] = useState<IntroStage>("loading");

  const hospicePlayer = useVideoPlayer(
    require("@/assets/HospiceRoadmap_SplashScreen.mp4"),
    (player) => {
      player.loop = false;
    },
  );

  const ragnaPlayer = useVideoPlayer(
    require("@/assets/HospiceRoadMap_Ragan_SplashScreen.mp4"),
    (player) => {
      player.loop = false;
    },
  );

  useEffect(() => {
    void hasSeenIntroVideos().then((seen) => {
      setIntroStage(seen ? "done" : "hospice");
    });
  }, []);

  const finishIntro = useCallback(() => {
    hospicePlayer.pause();
    ragnaPlayer.pause();
    void markIntroVideosSeen();
    setIntroStage("done");
  }, [hospicePlayer, ragnaPlayer]);

  const playNext = useCallback(() => {
    if (introStage === "hospice") {
      hospicePlayer.pause();
      setIntroStage("ragna");
      requestAnimationFrame(() => {
        ragnaPlayer.play();
      });
      return;
    }

    if (introStage === "ragna") {
      finishIntro();
    }
  }, [finishIntro, hospicePlayer, introStage, ragnaPlayer]);

  useEffect(() => {
    const subscription = hospicePlayer.addListener("playToEnd", () => {
      if (introStage === "hospice") {
        playNext();
      }
    });
    return () => subscription.remove();
  }, [hospicePlayer, introStage, playNext]);

  useEffect(() => {
    const subscription = ragnaPlayer.addListener("playToEnd", () => {
      if (introStage === "ragna") {
        finishIntro();
      }
    });
    return () => subscription.remove();
  }, [finishIntro, introStage, ragnaPlayer]);

  useEffect(() => {
    if (introStage === "hospice") {
      hospicePlayer.play();
    }
  }, [hospicePlayer, introStage]);

  useEffect(() => {
    if (!isClerkLoaded || isLoading || introStage !== "done") return;

    if (!isSignedIn) {
      setClaimReady(true);
      return;
    }

    if (!claimAttempted.current) {
      claimAttempted.current = true;
      void runDeviceClaimIfNeeded().then(() => setClaimReady(true));
    }
  }, [introStage, isClerkLoaded, isLoading, isOnboarded, isSignedIn]);

  useEffect(() => {
    if (!claimReady || !isClerkLoaded || isLoading || introStage !== "done") return;

    if (!isSignedIn) {
      router.replace("/(auth)/sign-in");
    } else if (isOnboarded) {
      router.replace("/(tabs)");
    } else {
      router.replace("/onboarding");
    }
  }, [claimReady, introStage, isClerkLoaded, isLoading, isOnboarded, isSignedIn]);

  if (introStage === "loading") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (introStage !== "done") {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        {introStage === "hospice" ? (
          <VideoView
            player={hospicePlayer}
            style={{ flex: 1 }}
            contentFit="cover"
            nativeControls={false}
          />
        ) : (
          <VideoView
            player={ragnaPlayer}
            style={{ flex: 1 }}
            contentFit="cover"
            nativeControls={false}
          />
        )}

        <Pressable
          onPress={finishIntro}
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

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}