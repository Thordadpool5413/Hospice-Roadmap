import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { StateLegalRegistry } from "@/content/legal/types";
import { ReviewBadge } from "./ReviewBadge";
import { SavedItemButton } from "./SavedItemButton";

interface StateRowCardProps {
  registry: StateLegalRegistry;
  saved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}

export function StateRowCard({ registry, saved, onPress, onToggleSave }: StateRowCardProps) {
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={({ pressed }) => [s.card, pressed && { opacity: 0.80 }]}
    >
      <View style={s.left}>
        <View style={s.codeWrap}>
          <Text style={s.code}>{registry.stateCode}</Text>
        </View>
        <View style={s.info}>
          <Text style={s.name} numberOfLines={1}>{registry.stateName}</Text>
          <Text style={s.summary} numberOfLines={2}>
            {registry.overview.summary.slice(0, 90)}
            {registry.overview.summary.length > 90 ? "…" : ""}
          </Text>
          <ReviewBadge status={registry.review.reviewStatus} size="sm" />
        </View>
      </View>
      <View style={s.right}>
        <SavedItemButton saved={saved} onToggle={onToggleSave} size={16} />
        <Feather name="chevron-right" size={16} color="#4A6090" />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20,40,88,0.78)",
    borderWidth: 1,
    borderColor: "rgba(53,94,159,0.35)",
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  left: { flex: 1, flexDirection: "row", gap: 12, alignItems: "center" },
  codeWrap: {
    width: 44, height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(103,183,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(103,183,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  code: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#67B7FF" },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#F3F6FF" },
  summary: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#8F9AB8", lineHeight: 16 },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
});
