import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CATEGORY_META } from "@/constants/resourceCategories";
import { Card } from "@/components/ui/Card";
import { JourneyBadge } from "@/components/ui/JourneyBadge";
import { Colors } from "@/constants/colors";
import { Resource } from "@/types";

interface ResourceCardProps {
  resource: Resource;
  onPress: () => void;
  onSave?: () => void;
  onTagPress?: (tag: string) => void;
  isSaved?: boolean;
  compact?: boolean;
}

export function ResourceCard({
  resource,
  onPress,
  onSave,
  onTagPress,
  isSaved = false,
  compact = false,
}: ResourceCardProps) {
  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave?.();
  };

  const handleTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTagPress?.(tag);
  };

  const catMeta = CATEGORY_META[resource.category];
  const visibleTags = resource.tags.slice(0, 4);

  return (
    <Card
      onPress={onPress}
      elevated
      style={[compact ? styles.compact : styles.card, { borderLeftColor: catMeta.color, borderLeftWidth: 3 }]}
    >
      {/* Top row: category + save */}
      <View style={styles.topRow}>
        <View style={styles.catBadge}>
          <View style={[styles.catIconWrap, { backgroundColor: catMeta.color + "20" }]}>
            <Feather name={catMeta.icon as any} size={11} color={catMeta.color} />
          </View>
          <Text style={[styles.catLabel, { color: catMeta.color }]}>{catMeta.shortLabel}</Text>
        </View>
        <View style={styles.topRowRight}>
          {resource.journeyStage.slice(0, 1).map((stage) => (
            <JourneyBadge key={stage} stage={stage} size="sm" />
          ))}
          {onSave && (
            <Pressable onPress={handleSave} style={styles.saveBtn} hitSlop={10}>
              <Feather
                name="bookmark"
                size={17}
                color={isSaved ? Colors.primary : Colors.textSubtle}
              />
              {isSaved && <View style={styles.savedDot} />}
            </Pressable>
          )}
        </View>
      </View>

      {/* Title */}
      <Text style={compact ? styles.titleCompact : styles.title} numberOfLines={2}>
        {resource.title}
      </Text>

      {/* Summary */}
      {!compact && (
        <Text style={styles.summary} numberOfLines={2}>
          {resource.summary}
        </Text>
      )}

      {/* Tag pills — tappable, visible in list view */}
      {!compact && visibleTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagRow}
        >
          {visibleTags.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => handleTag(tag)}
              style={({ pressed }) => [styles.tagPill, pressed && { opacity: 0.7 }]}
              hitSlop={4}
            >
              <Feather name="hash" size={9} color={Colors.textSubtle} />
              <Text style={styles.tagPillText}>{tag}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.readTime}>
          <Feather name="clock" size={11} color={Colors.textMuted} />
          <Text style={styles.readTimeText}>{resource.readTime} min read</Text>
        </View>
        {resource.isFeatured && (
          <View style={styles.featuredBadge}>
            <Feather name="star" size={10} color={Colors.primary} />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        <Feather name="chevron-right" size={14} color={Colors.textSubtle} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  compact: { gap: 8, padding: 14 },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  catBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  catIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  topRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveBtn: {
    padding: 2,
    position: "relative",
  },
  savedDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.surfaceMid,
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
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  // Tag pills row
  tagRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 2,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  tagPillText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  readTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  readTimeText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.primary + "18",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featuredText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
});
