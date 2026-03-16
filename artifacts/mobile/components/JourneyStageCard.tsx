import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import { JourneyStage } from "@/types";

interface StageConfig {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bg: string;
  borderColor: string;
}

const stageConfigs: Record<JourneyStage, StageConfig> = {
  before: {
    title: "Before Hospice",
    subtitle: "Research, eligibility & planning",
    icon: "search",
    color: Colors.journeyBefore,
    bg: Colors.journeyBeforePale,
    borderColor: "#C5D8EF",
  },
  during: {
    title: "During Hospice",
    subtitle: "Navigating care & support",
    icon: "heart",
    color: Colors.journeyDuring,
    bg: Colors.journeyDuringPale,
    borderColor: "#B8D9CF",
  },
  after: {
    title: "After Hospice",
    subtitle: "Grief, bereavement & next steps",
    icon: "sun",
    color: Colors.journeyAfter,
    bg: Colors.journeyAfterPale,
    borderColor: "#CEBFDA",
  },
};

interface JourneyStageCardProps {
  stage: JourneyStage;
  onPress: () => void;
  isActive?: boolean;
}

export function JourneyStageCard({
  stage,
  onPress,
  isActive = false,
}: JourneyStageCardProps) {
  const config = stageConfigs[stage];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: config.bg,
          borderColor: isActive ? config.color : config.borderColor,
          borderWidth: isActive ? 2 : 1,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
        <Feather name={config.icon as any} size={18} color="#FFFFFF" />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: config.color }]}>
          {config.title}
        </Text>
        <Text style={styles.subtitle}>{config.subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={config.color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
