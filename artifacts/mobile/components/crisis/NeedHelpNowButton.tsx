import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const CRISIS_RED = "#E85040";

interface Props {
  variant?: "hero" | "compact" | "floating";
}

export function NeedHelpNowButton({ variant = "hero" }: Props) {
  const onPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/need-help-now" as any);
  };

  if (variant === "compact") {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.compact, pressed && styles.pressed]}
      >
        <Feather name="alert-circle" size={18} color="#fff" />
        <Text style={styles.compactText}>I need help now</Text>
        <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.8)" />
      </Pressable>
    );
  }

  if (variant === "floating") {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.floating, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={["#E85040", "#C03030"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Feather name="alert-circle" size={20} color="#fff" />
        <Text style={styles.floatingText}>Help now</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <View style={styles.glow} />
      <LinearGradient
        colors={["rgba(232, 80, 64, 0.95)", "rgba(180, 40, 35, 0.98)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroIcon}>
          <Feather name="alert-circle" size={28} color="#fff" />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>I need help now</Text>
          <Text style={styles.heroSub}>3 taps: situation → guidance → call or Ask Ragna</Text>
        </View>
        <View style={styles.heroArrow}>
          <Feather name="arrow-right" size={18} color="#fff" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  glow: {
    position: "absolute",
    inset: -1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(232, 80, 64, 0.55)",
    shadowColor: CRISIS_RED,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { flex: 1, gap: 3 },
  heroTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 17,
  },
  heroArrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  compact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: CRISIS_RED,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  compactText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  floating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 12,
    overflow: "hidden",
    shadowColor: CRISIS_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});