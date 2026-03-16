import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JourneyBadge } from "@/components/ui/JourneyBadge";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { mockResources } from "@/data/mockResources";

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { toggleSavedResource, isSavedResource } = useApp();

  const resource = mockResources.find((r) => r.id === id);

  if (!resource) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.notFound}>Resource not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const saved = isSavedResource(resource.id);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSavedResource(resource.id);
  };

  const paragraphs = resource.content.split("\n\n").filter(Boolean);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.badgeRow}>
          {resource.journeyStage.map((stage) => (
            <JourneyBadge key={stage} stage={stage} size="md" />
          ))}
        </View>
        <Text style={styles.title}>{resource.title}</Text>
        <Text style={styles.summary}>{resource.summary}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{resource.readTime} min read</Text>
          </View>
          <Pressable onPress={handleSave} style={styles.saveBtn} hitSlop={8}>
            <Feather
              name="bookmark"
              size={18}
              color={saved ? Colors.primary : Colors.textSubtle}
            />
            <Text style={[styles.saveText, saved && { color: Colors.primary }]}>
              {saved ? "Saved" : "Save"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Content */}
      <View style={styles.articleContent}>
        {paragraphs.map((para, i) => {
          const isHeader = para.length < 80 && !para.includes(".");
          return (
            <Text
              key={i}
              style={isHeader ? styles.subheading : styles.paragraph}
            >
              {para}
            </Text>
          );
        })}
      </View>

      {/* Tags */}
      <View style={styles.tagsSection}>
        <Text style={styles.tagsLabel}>Topics</Text>
        <View style={styles.tagsRow}>
          {resource.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Educational Disclaimer */}
      <View style={styles.disclaimer}>
        <Feather name="info" size={14} color={Colors.textMuted} />
        <Text style={styles.disclaimerText}>
          This article is intended for educational purposes only and does not
          constitute medical advice. Please consult a qualified healthcare
          provider for clinical guidance.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingTop: 100,
    paddingHorizontal: 20,
    gap: 20,
  },
  notFound: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  backLink: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
    marginTop: 12,
  },
  hero: {
    gap: 10,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  summary: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 4,
  },
  saveText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textSubtle,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  articleContent: {
    gap: 14,
  },
  subheading: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
    lineHeight: 24,
    marginTop: 8,
  },
  paragraph: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  tagsSection: {
    gap: 8,
  },
  tagsLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  tagText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  disclaimer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: Colors.backgroundSecondary,
    padding: 14,
    borderRadius: 12,
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },
});
