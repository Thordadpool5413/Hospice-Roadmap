import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import { SymptomActionSuggestion } from "@/services/symptomActionSuggestions";

interface Props {
  suggestions: SymptomActionSuggestion[];
  onDismiss?: () => void;
}

export function SymptomActionCard({ suggestions, onDismiss }: Props) {
  const primary = suggestions[0];

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Feather name="check-circle" size={18} color={Colors.primary} />
        <Text style={styles.headerTitle}>Check-in saved — next steps</Text>
        {onDismiss && (
          <Pressable onPress={onDismiss} hitSlop={8}>
            <Feather name="x" size={16} color={Colors.textSubtle} />
          </Pressable>
        )}
      </View>

      {suggestions.map((s) => (
        <View key={s.id} style={styles.suggestion}>
          <Text
            style={[
              styles.message,
              s.severity === "urgent" && { color: Colors.error },
              s.severity === "watch" && { color: Colors.amber },
            ]}
          >
            {s.message}
          </Text>
          <View style={styles.actions}>
            {s.guidanceId && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/guidance/[id]",
                    params: { id: s.guidanceId },
                  } as any);
                }}
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
              >
                <Feather name="book-open" size={13} color={Colors.primary} />
                <Text style={styles.actionText}>{s.guidanceLabel ?? "Guidance"}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({
                  pathname: "/(tabs)/help",
                  params: { initialMessage: s.ragnaPrompt },
                } as any);
              }}
              style={({ pressed }) => [styles.ragnaBtn, pressed && { opacity: 0.88 }]}
            >
              <Image
                source={require("@/assets/images/ragna-icon.png")}
                style={{ width: 22, height: 22, borderRadius: 6 }}
              />
              <Text style={styles.ragnaText}>Ask Ragna</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {primary.severity === "urgent" && (
        <Pressable
          onPress={() => router.push("/emergency-card" as any)}
          style={({ pressed }) => [styles.emergencyLink, pressed && { opacity: 0.8 }]}
        >
          <Feather name="phone-call" size={14} color={Colors.error} />
          <Text style={styles.emergencyText}>Open emergency card to call hospice</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(12, 20, 55, 0.90)",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    padding: 16,
    gap: 12,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#E8F0FF",
  },
  suggestion: { gap: 8 },
  message: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#C8D8F0",
    lineHeight: 18,
  },
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.primary + "15",
    borderWidth: 1,
    borderColor: Colors.primary + "28",
  },
  actionText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  ragnaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  ragnaText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  emergencyLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },
  emergencyText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.error },
});