/**
 * SyncConflictBanner — a brief, dismissible notice shown after a cloud sync in
 * which at least one local record was overwritten by a newer copy from the
 * server (last-write-wins resolved in the server's favour). This gives the user
 * transparency: their health data on this device was just replaced with a newer
 * version edited on another device.
 *
 * Behaviour:
 *   - Watches `conflictDetectedAt` from CloudSyncContext. Each new value is a
 *     distinct sync event, so the banner shows once per event — not on every
 *     app open or every background sync.
 *   - Slides down from the top, stays for AUTO_HIDE_MS, then auto-dismisses.
 *   - Tapping the close (×) button dismisses it immediately.
 *   - Pointer events are enabled (unlike the success toast) so the close button
 *     is tappable; it sits below the OfflineBanner in the stacking order.
 */

import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCloudSync } from "@/components/CloudSyncManager";
import { Colors } from "@/constants/colors";

const AUTO_HIDE_MS = 7_000;
const useNative = Platform.OS !== "web";

export function SyncConflictBanner() {
  const { conflictDetectedAt } = useCloudSync();
  const insets = useSafeAreaInsets();

  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 280,
        useNativeDriver: useNative,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: useNative,
      }),
    ]).start(() => setVisible(false));
  };

  useEffect(() => {
    if (!conflictDetectedAt) return;

    setVisible(true);
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: useNative,
        tension: 80,
        friction: 11,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: useNative,
      }),
    ]).start();

    hideTimer.current = setTimeout(() => {
      dismiss();
    }, AUTO_HIDE_MS);

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
    // Only re-run when a new conflict event arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conflictDetectedAt]);

  if (!visible) return null;

  const topOffset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: topOffset, opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.inner}>
        <Feather name="cloud" size={15} color={Colors.info} />
        <Text style={styles.text}>
          Some records were updated from cloud — your latest data is now loaded.
        </Text>
        <Pressable
          onPress={dismiss}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <Feather name="x" size={16} color={Colors.info} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9997,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: 520,
    backgroundColor: Colors.infoPale,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.info,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  text: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.info,
    flex: 1,
  },
});
