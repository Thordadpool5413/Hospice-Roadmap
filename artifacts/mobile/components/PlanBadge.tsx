import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

export type PlanName = "Free" | "Caregiver" | "Companion";

type PlanBadgeSize = "sm" | "md";

interface PlanBadgeProps {
  plan: string;
  size?: PlanBadgeSize;
}

interface PlanConfig {
  color: string;
  bg: string;
  border: string;
}

const PLAN_CONFIG: Record<string, PlanConfig> = {
  Companion: {
    color: Colors.amber,
    bg: Colors.amberPale,
    border: Colors.amber + "45",
  },
  Caregiver: {
    color: Colors.primary,
    bg: Colors.primaryPale,
    border: Colors.primary + "45",
  },
  Free: {
    color: Colors.textMuted,
    bg: "rgba(20, 30, 60, 0.90)",
    border: "rgba(60, 90, 160, 0.30)",
  },
};

function resolveConfig(plan: string): PlanConfig {
  return PLAN_CONFIG[plan] ?? PLAN_CONFIG["Free"]!;
}

export function PlanBadge({ plan, size = "sm" }: PlanBadgeProps) {
  const config = resolveConfig(plan);
  const isLarge = size === "md";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingHorizontal: isLarge ? 12 : 8,
          paddingVertical: isLarge ? 5 : 3,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: config.color, fontSize: isLarge ? 13 : 11 },
        ]}
      >
        {plan}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.1,
  },
});
