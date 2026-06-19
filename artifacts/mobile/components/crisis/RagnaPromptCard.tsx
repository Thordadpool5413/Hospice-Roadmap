import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

interface Props {
  reason: string;
  initialMessage: string;
  onDismiss?: () => void;
}

export function RagnaPromptCard({ reason, initialMessage, onDismiss }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Image
          source={require("@/assets/images/ragna-icon.png")}
          style={styles.avatar}
          resizeMode="cover"
        />
        <View style={styles.textWrap}>
          <Text style={styles.label}>Ragna noticed</Text>
          <Text style={styles.reason}>{reason}</Text>
        </View>
        {onDismiss && (
          <Pressable onPress={onDismiss} hitSlop={8} style={styles.dismiss}>
            <Feather name="x" size={15} color="#5A78A8" />
          </Pressable>
        )}
      </View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push({
            pathname: "/(tabs)/help",
            params: { initialMessage },
          } as any);
        }}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]}
      >
        <Text style={styles.ctaText}>Talk to Ragna</Text>
        <Feather name="arrow-right" size={14} color={Colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(14, 24, 62, 0.88)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary + "35",
    padding: 14,
    gap: 12,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 11 },
  textWrap: { flex: 1, gap: 2 },
  label: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  reason: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#E8F0FF",
    lineHeight: 19,
  },
  dismiss: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary + "18",
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  ctaText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
});