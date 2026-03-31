import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ReviewStatus } from "@/content/legal/types";

const BADGE_CONFIG: Record<ReviewStatus, { label: string; bg: string; text: string; border: string }> = {
  reviewed:       { label: "Reviewed",          bg: "rgba(88,182,255,0.14)",  text: "#58B6FF", border: "rgba(88,182,255,0.35)" },
  pending_review: { label: "Pending Review",     bg: "rgba(213,154,50,0.14)", text: "#D59A32", border: "rgba(213,154,50,0.35)" },
  source_only:    { label: "Official Links Only", bg: "rgba(138,141,255,0.14)", text: "#8A8DFF", border: "rgba(138,141,255,0.35)" },
  needs_update:   { label: "Needs Update",       bg: "rgba(240,154,122,0.14)", text: "#F09A7A", border: "rgba(240,154,122,0.35)" },
};

interface ReviewBadgeProps {
  status: ReviewStatus;
  size?: "sm" | "md";
}

export function ReviewBadge({ status, size = "md" }: ReviewBadgeProps) {
  const cfg = BADGE_CONFIG[status];
  const isSmall = size === "sm";
  return (
    <View style={[s.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }, isSmall && s.badgeSm]}>
      <View style={[s.dot, { backgroundColor: cfg.text }]} />
      <Text style={[s.label, { color: cfg.text }, isSmall && s.labelSm]}>{cfg.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeSm: { paddingHorizontal: 7, paddingVertical: 3 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.2 },
  labelSm: { fontSize: 10 },
});
