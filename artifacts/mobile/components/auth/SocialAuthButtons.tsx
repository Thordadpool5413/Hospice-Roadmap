import { useSSO } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { clerkErrorMessage } from "@/components/auth/clerkErrors";
import { Colors } from "@/constants/colors";

type SocialAuthButtonsProps = {
  onError?: (message: string) => void;
};

async function completeSsoFlow(
  startSSOFlow: ReturnType<typeof useSSO>["startSSOFlow"],
  strategy: "oauth_google" | "oauth_apple",
  onError?: (message: string) => void,
): Promise<void> {
  const { createdSessionId, setActive, authSessionResult } = await startSSOFlow({
    strategy,
  });

  if (authSessionResult?.type && authSessionResult.type !== "success") {
    return;
  }

  if (!createdSessionId || !setActive) {
    onError?.("Sign-in was cancelled. Please try again.");
    return;
  }

  await setActive({ session: createdSessionId });
  router.replace("/");
}

export function SocialAuthButtons({ onError }: SocialAuthButtonsProps) {
  const { startSSOFlow } = useSSO();
  const [busyProvider, setBusyProvider] = useState<"google" | "apple" | null>(null);

  const runProvider = async (provider: "google" | "apple") => {
    setBusyProvider(provider);
    try {
      await completeSsoFlow(
        startSSOFlow,
        provider === "google" ? "oauth_google" : "oauth_apple",
        onError,
      );
    } catch (err) {
      onError?.(
        clerkErrorMessage(
          err as { longMessage?: string; message?: string },
          provider === "google"
            ? "Google sign-in failed. Please try again."
            : "Apple sign-in failed. Please try again.",
        ),
      );
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.socialBtn,
          busyProvider !== null && styles.socialBtnDisabled,
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => void runProvider("google")}
        disabled={busyProvider !== null}
      >
        {busyProvider === "google" ? (
          <ActivityIndicator color={Colors.text} size="small" />
        ) : (
          <>
            <Ionicons name="logo-google" size={18} color={Colors.text} />
            <Text style={styles.socialBtnText}>Google</Text>
          </>
        )}
      </Pressable>

      {Platform.OS === "ios" && (
        <Pressable
          style={({ pressed }) => [
            styles.socialBtn,
            busyProvider !== null && styles.socialBtnDisabled,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => void runProvider("apple")}
          disabled={busyProvider !== null}
        >
          {busyProvider === "apple" ? (
            <ActivityIndicator color={Colors.text} size="small" />
          ) : (
            <>
              <Ionicons name="logo-apple" size={18} color={Colors.text} />
              <Text style={styles.socialBtnText}>Apple</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.cardBorder,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surfaceMid,
    paddingVertical: 13,
  },
  socialBtnDisabled: {
    opacity: 0.5,
  },
  socialBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
});