/**
 * SyncSuccessToast — briefly shows a "Synced" confirmation pill at the
 * bottom of the screen after a qualifying background sync completes.
 *
 * "Qualifying" means:
 *   - The app was in the foreground when the sync finished (AppState === "active")
 *   - The previous successful sync was more than SYNC_TOAST_THRESHOLD_MS ago
 *     (controlled by CloudSyncManager — this component only watches the signal)
 *
 * Behaviour:
 *   - Slides up from below the safe area and fades in over ~200 ms
 *   - Stays visible for VISIBLE_DURATION_MS (2 500 ms)
 *   - Fades + slides back down over ~280 ms
 *   - Pointer-events are disabled so it never blocks touch targets
 */

import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCloudSync } from "@/components/CloudSyncManager";
import { Colors } from "@/constants/colors";

const VISIBLE_DURATION_MS = 2_500;
const useNative = Platform.OS !== "web";

export function SyncSuccessToast() {
  const { syncSucceededAt } = useCloudSync();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!syncSucceededAt) return;

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
  }, [syncSucceededAt, translateY, opacity]);

  const bottomOffset = Platform.OS === "web" ? 24 : insets.bottom + 16;

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: bottomOffset, opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <View style={styles.inner}>
        <Feather name="check-circle" size={14} color={Colors.success} />
        <Text style={styles.text}>Synced</Text>
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
    backgroundColor: Colors.successPale,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.success,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  text: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.success,
  },
});
