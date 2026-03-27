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
import { CATEGORY_META } from "@/constants/resourceCategories";
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
  const catMeta = CATEGORY_META[resource.category];

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSavedResource(resource.id);
  };

  const handleTagPress = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/resources", params: { tag } });
  };

  const handleCategoryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/resources", params: { category: resource.category } });
  };

  const paragraphs = resource.content.split("\n\n").filter(Boolean);

  // Related articles: same category, different id, max 3
  const related = mockResources
    .filter((r) => r.category === resource.category && r.id !== resource.id)
    .slice(0, 3);

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
        {/* Category button — tappable */}
        <Pressable
          onPress={handleCategoryPress}
          style={({ pressed }) => [styles.catBtn, { borderColor: catMeta.color + "40", backgroundColor: catMeta.color + "15" }, pressed && { opacity: 0.75 }]}
        >
          <View style={[styles.catBtnIcon, { backgroundColor: catMeta.color + "25" }]}>
            <Feather name={catMeta.icon as any} size={12} color={catMeta.color} />
          </View>
          <Text style={[styles.catBtnLabel, { color: catMeta.color }]}>{catMeta.label}</Text>
          <Feather name="chevron-right" size={11} color={catMeta.color + "80"} />
        </Pressable>

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

      {/* Tags — tappable, navigate to filtered resource list */}
      <View style={styles.tagsSection}>
        <Text style={styles.tagsLabel}>Related Topics</Text>
        <View style={styles.tagsRow}>
          {resource.tags.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => handleTagPress(tag)}
              style={({ pressed }) => [styles.tag, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]}
            >
              <Feather name="hash" size={11} color={Colors.primary} />
              <Text style={styles.tagText}>{tag}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.tagsHint}>Tap any topic to browse related articles</Text>
      </View>

      {/* Related articles in this category */}
      {related.length > 0 && (
        <View style={styles.relatedSection}>
          <View style={styles.relatedHeader}>
            <Text style={styles.relatedTitle}>More in {catMeta.label}</Text>
            <Pressable onPress={handleCategoryPress} style={styles.relatedSeeAll}>
              <Text style={styles.relatedSeeAllText}>See all</Text>
              <Feather name="chevron-right" size={12} color={Colors.primary} />
            </Pressable>
          </View>
          {related.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.replace({ pathname: "/resource/[id]", params: { id: r.id } });
              }}
              style={({ pressed }) => [styles.relatedCard, pressed && { opacity: 0.82 }]}
            >
              <View style={styles.relatedCardLeft}>
                <Text style={styles.relatedCardTitle} numberOfLines={2}>{r.title}</Text>
                <View style={styles.relatedCardMeta}>
                  <Feather name="clock" size={10} color={Colors.textMuted} />
                  <Text style={styles.relatedCardTime}>{r.readTime} min read</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={14} color={Colors.textSubtle} />
            </Pressable>
          ))}
        </View>
      )}

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

  // Category button at top of article
  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  catBtnIcon: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  catBtnLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
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

  // Tags
  tagsSection: {
    gap: 10,
    backgroundColor: Colors.surfaceMid,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tagsLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.primary + "15",
    borderWidth: 1,
    borderColor: Colors.primary + "35",
  },
  tagText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  tagsHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    fontStyle: "italic",
  },

  // Related articles
  relatedSection: {
    gap: 10,
  },
  relatedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  relatedTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  relatedSeeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  relatedSeeAllText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  relatedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surfaceMid,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  relatedCardLeft: {
    flex: 1,
    gap: 4,
  },
  relatedCardTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    lineHeight: 18,
  },
  relatedCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  relatedCardTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
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
