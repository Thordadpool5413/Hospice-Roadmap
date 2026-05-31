import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import { JourneyStage } from "@/types";

interface JourneyBadgeProps {
  stage: JourneyStage;
  size?: "sm" | "md";
}

const stageConfig: Record<
  JourneyStage,
  { label: string; color: string; bg: string }
> = {
  before: {
    label: "Before Hospice",
    color: Colors.journeyBefore,
    bg: Colors.journeyBeforePale,
  },
  during: {
    label: "During Hospice",
    color: Colors.journeyDuring,
    bg: Colors.journeyDuringPale,
  },
  after: {
    label: "After Hospice",
    color: Colors.journeyAfter,
    bg: Colors.journeyAfterPale,
  },
};

export function JourneyBadge({ stage, size = "sm" }: JourneyBadgeProps) {
  const config = stageConfig[stage];
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.color + "35",
          paddingHorizontal: isSmall ? 7 : 11,
          paddingVertical: isSmall ? 3 : 5,
          borderRadius: isSmall ? 6 : 8,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: config.color,
            fontSize: isSmall ? 10 : 12,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.15,
  },
});
