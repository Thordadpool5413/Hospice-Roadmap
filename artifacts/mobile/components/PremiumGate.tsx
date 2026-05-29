import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";
import { useSubscription } from "@/context/SubscriptionContext";
import { usePaywall } from "@/hooks/usePaywall";

interface PremiumGateProps {
  featureName: string;
  description?: string;
  showBackButton?: boolean;
  children?: React.ReactNode;
}

export function PremiumGate({
  featureName,
  description,
  showBackButton = false,
  children,
}: PremiumGateProps) {
  const { isPremium, isLoading } = useSubscription();
  const { openPaywall } = usePaywall();
  const insets = useSafeAreaInsets();

  if (isPremium || isLoading) {
    return <>{children ?? null}</>;
  }

  const desc =
    description ??
    `${featureName} is included with your Hospice Roadmap subscription — built to support you and your loved one through every step of this journey.`;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) },
      ]}
    >
      <CosmicBackground />

      {showBackButton && (
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.65 }]}
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
      )}

      <View style={styles.center}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Feather name="lock" size={30} color={Colors.primary} />
          </View>

          <Text style={styles.featureName}>{featureName}</Text>

          <Text style={styles.description}>{desc}</Text>

          <Pressable
            onPress={() => openPaywall()}
            style={({ pressed }) => [
              styles.cta,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Feather name="star" size={16} color="#fff" />
            <Text style={styles.ctaText}>See Plans</Text>
          </Pressable>

          <Text style={styles.freeNote}>
            Emergency card, journey map, situation finder, and provider search
            remain free — always.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030A18",
  },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 18,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(14, 22, 55, 0.90)",
    borderWidth: 1,
    borderColor: "rgba(60, 90, 170, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(12, 20, 55, 0.92)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(80, 120, 220, 0.30)",
    padding: 28,
    alignItems: "center",
    gap: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: Colors.primary + "18",
    borderWidth: 1,
    borderColor: Colors.primary + "38",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  featureName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#7A90B8",
    textAlign: "center",
    lineHeight: 22,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 4,
    width: "100%",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.42,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.2,
  },
  freeNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#4A6090",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
});
