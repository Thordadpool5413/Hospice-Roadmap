/**
 * RagnaActionToast — a brief confirmation/error pill shown after the user
 * confirms a Ragna action card (create reminder, log symptom, add journal entry).
 *
 * It is "signal-driven": the parent bumps `signal` (a monotonically increasing
 * number) each time it wants the toast to appear, alongside the `message` and
 * `tone` to display. A signal of 0 means "never shown yet".
 */

import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";

const VISIBLE_DURATION_MS = 2_500;
const useNative = Platform.OS !== "web";

export type RagnaActionToastTone = "success" | "error";

export function RagnaActionToast({
  signal,
  message,
  tone,
}: {
  signal: number;
  message: string;
  tone: RagnaActionToastTone;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (signal <= 0) return;

    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: useNative,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: useNative,
      }),
    ]).start();

    hideTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 60,
          duration: 280,
          useNativeDriver: useNative,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: useNative,
        }),
      ]).start();
      hideTimer.current = null;
    }, VISIBLE_DURATION_MS);

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [signal, translateY, opacity]);

  const isError = tone === "error";
  const accent = isError ? Colors.error : Colors.success;
  const bg = isError ? Colors.errorPale : Colors.successPale;
  const bottomOffset = Platform.OS === "web" ? 24 : insets.bottom + 16;

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: bottomOffset, opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.inner, { backgroundColor: bg, borderColor: accent }]}>
        <Feather
          name={isError ? "alert-circle" : "check-circle"}
          size={14}
          color={accent}
        />
        <Text style={[styles.text, { color: accent }]}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9998,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  text: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
