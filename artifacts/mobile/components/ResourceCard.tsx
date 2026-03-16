import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { JourneyBadge } from "@/components/ui/JourneyBadge";
import { Colors } from "@/constants/colors";
import { Resource } from "@/types";

interface ResourceCardProps {
  resource: Resource;
  onPress: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  compact?: boolean;
}

export function ResourceCard({
  resource,
  onPress,
  onSave,
  isSaved = false,
  compact = false,
}: ResourceCardProps) {
  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave?.();
  };

  return (
    <Card
      onPress={onPress}
      elevated
      style={compact ? styles.compact : styles.card}
    >
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          {resource.journeyStage.slice(0, 1).map((stage) => (
            <JourneyBadge key={stage} stage={stage} size="sm" />
          ))}
        </View>
        {onSave && (
          <Pressable onPress={handleSave} style={styles.saveBtn} hitSlop={8}>
            <Feather
              name={isSaved ? "bookmark" : "bookmark"}
              size={18}
              color={isSaved ? Colors.primary : Colors.textSubtle}
            />
          </Pressable>
        )}
      </View>

      <Text style={compact ? styles.titleCompact : styles.title} numberOfLines={2}>
        {resource.title}
      </Text>

      {!compact && (
        <Text style={styles.summary} numberOfLines={3}>
          {resource.summary}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.readTime}>
          <Feather name="clock" size={12} color={Colors.textMuted} />
          <Text style={styles.readTimeText}>{resource.readTime} min read</Text>
        </View>
        <Feather name="chevron-right" size={14} color={Colors.textSubtle} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
  },
  compact: {
    gap: 8,
    padding: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
  },
  saveBtn: {
    padding: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  titleCompact: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  summary: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  readTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readTimeText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
});
