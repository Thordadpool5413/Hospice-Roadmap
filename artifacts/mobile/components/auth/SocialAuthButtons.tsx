import { useSSO } from "@clerk/expo";
import { useSignInWithApple } from "@clerk/expo/apple";
import { Feather } from "@expo/vector-icons";
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

export function SocialAuthButtons({ onError }: SocialAuthButtonsProps) {
  const { startSSOFlow } = useSSO();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const [busyProvider, setBusyProvider] = useState<"google" | "apple" | null>(null);

  const finishAuth = async (createdSessionId: string | null, setActive?: (params: { session: string }) => Promise<void>) => {
    if (!createdSessionId || !setActive) {
      onError?.("Sign-in was cancelled. Please try again.");
      return;
    }
    await setActive({ session: createdSessionId });
    router.replace("/");
  };

  const handleGoogle = async () => {
    setBusyProvider("google");
    try {
      const { createdSessionId, setActive, authSessionResult } = await startSSOFlow({
        strategy: "oauth_google",
      });
      if (authSessionResult?.type && authSessionResult.type !== "success") {
        return;
      }
      await finishAuth(createdSessionId, setActive);
    } catch (err) {
      onError?.(clerkErrorMessage(err as { longMessage?: string; message?: string }, "Google sign-in failed. Please try again."));
    } finally {
      setBusyProvider(null);
    }
  };

  const handleApple = async () => {
    if (Platform.OS !== "ios") return;
    setBusyProvider("apple");
    try {
      const { createdSessionId, setActive } = await startAppleAuthenticationFlow();
      await finishAuth(createdSessionId, setActive);
    } catch (err) {
      onError?.(clerkErrorMessage(err as { longMessage?: string; message?: string }, "Apple sign-in failed. Please try again."));
    } finally {
      setBusyProvider(null);
    }
  };

  const isBusy = busyProvider !== null;

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
          (isBusy || busyProvider === "google") && styles.socialBtnDisabled,
          pressed && { opacity: 0.85 },
        ]}
        onPress={handleGoogle}
        disabled={isBusy}
      >
        {busyProvider === "google" ? (
          <ActivityIndicator color={Colors.text} size="small" />
        ) : (
          <>
            <Feather name="mail" size={18} color={Colors.text} />
            <Text style={styles.socialBtnText}>Google</Text>
          </>
        )}
      </Pressable>

      {Platform.OS === "ios" && (
        <Pressable
          style={({ pressed }) => [
            styles.socialBtn,
            (isBusy || busyProvider === "apple") && styles.socialBtnDisabled,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleApple}
          disabled={isBusy}
        >
          {busyProvider === "apple" ? (
            <ActivityIndicator color={Colors.text} size="small" />
          ) : (
            <>
              <Feather name="smartphone" size={18} color={Colors.text} />
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