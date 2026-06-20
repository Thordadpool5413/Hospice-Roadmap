import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { NeedHelpNowButton } from "@/components/crisis/NeedHelpNowButton";
import { Colors } from "@/constants/colors";
import { PatientProfile } from "@/types";
import { callHospice } from "@/utils/hospiceCall";

interface Props {
  journeyStage: "before" | "during" | "after";
  profile?: PatientProfile;
  showUnsureLink?: boolean;
}

export function HomeCrisisStrip({ journeyStage, profile, showUnsureLink = true }: Props) {
  const handleCall = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (!callHospice(profile)) {
      Alert.alert(
        "Add hospice phone",
        "Add your hospice number in Patient Profile for one-tap calling.",
        [
          { text: "Later", style: "cancel" },
          { text: "Set up", onPress: () => router.push("/patient-profile") },
        ],
      );
    }
  };

  if (journeyStage === "after") {
    return (
      <View style={styles.wrap}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(tabs)/help",
              params: {
                initialMessage:
                  "I'm navigating grief after hospice. Can you check in with me gently and help me figure out what support I need today?",
              },
            } as any)
          }
          style={({ pressed }) => [styles.griefPrimary, pressed && styles.pressed]}
        >
          <Feather name="message-circle" size={22} color="#fff" />
          <View style={styles.griefText}>
            <Text style={styles.griefTitle}>Talk to Ragna</Text>
            <Text style={styles.griefSub}>Gentle grief support — she remembers your story</Text>
          </View>
          <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.75)" />
        </Pressable>
        <Pressable
          onPress={() => router.push("/guidance/bereavement-support" as any)}
          style={({ pressed }) => [styles.secondaryRow, pressed && styles.pressed]}
        >
          <Feather name="cloud" size={16} color="#B89AE8" />
          <Text style={styles.secondaryText}>Grief & bereavement guide</Text>
          <Feather name="chevron-right" size={14} color={Colors.textSubtle} />
        </Pressable>
      </View>
    );
  }

  if (journeyStage === "before") {
    return (
      <View style={styles.wrap}>
        <Pressable
          onPress={() => router.push("/(tabs)/providers" as any)}
          style={({ pressed }) => [styles.beforePrimary, pressed && styles.pressed]}
        >
          <Feather name="search" size={22} color="#fff" />
          <View style={styles.griefText}>
            <Text style={styles.griefTitle}>Find hospice near you</Text>
            <Text style={styles.griefSub}>Search by ZIP and compare agencies</Text>
          </View>
          <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.75)" />
        </Pressable>
        <NeedHelpNowButton variant="compact" />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <NeedHelpNowButton variant="hero" />
      {showUnsureLink && (
        <Pressable
          onPress={() => router.push("/unsure-wizard" as any)}
          style={({ pressed }) => [styles.unsureLink, pressed && { opacity: 0.7 }]}
        >
          <Feather name="help-circle" size={15} color={Colors.primary} />
          <Text style={styles.unsureText}>I'm not sure what's happening</Text>
        </Pressable>
      )}
      <View style={styles.chipRow}>
        <Pressable
          onPress={handleCall}
          style={({ pressed }) => [styles.chip, styles.chipCall, pressed && styles.pressed]}
        >
          <Feather name="phone-call" size={16} color={Colors.error} />
          <Text style={[styles.chipText, { color: Colors.error }]}>Call hospice</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/emergency-card" as any)}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
        >
          <Feather name="credit-card" size={16} color={Colors.primary} />
          <Text style={styles.chipText}>Emergency card</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  unsureLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  unsureText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  chipRow: { flexDirection: "row", gap: 10 },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "rgba(14, 22, 58, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(70, 110, 200, 0.22)",
  },
  chipCall: {
    borderColor: Colors.error + "35",
    backgroundColor: "rgba(232, 80, 64, 0.08)",
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#C8D8F0",
  },
  griefPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
  },
  beforePrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#4A7FD4",
    borderRadius: 16,
    padding: 16,
  },
  griefText: { flex: 1, gap: 3 },
  griefTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.3,
  },
  griefSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 17,
  },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(14, 22, 58, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(154, 122, 204, 0.25)",
  },
  secondaryText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#E8F0FF",
  },
});