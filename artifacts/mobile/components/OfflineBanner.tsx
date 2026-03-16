import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

const useNative = Platform.OS !== "web";

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isOnline) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: useNative,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: useNative,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -60,
          duration: 280,
          useNativeDriver: useNative,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: useNative,
        }),
      ]).start();
    }
  }, [isOnline, translateY, opacity]);

  const topOffset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: topOffset, opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <View style={styles.inner}>
        <Feather name="wifi-off" size={14} color={Colors.amber} />
        <Text style={styles.text}>
          No internet — AI and provider search unavailable. Guidance works offline.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.amberPale,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.amberLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  text: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.amber,
    flex: 1,
  },
});
