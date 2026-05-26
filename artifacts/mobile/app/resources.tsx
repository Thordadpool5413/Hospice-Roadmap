import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState, useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ResourceCard } from "@/components/ResourceCard";
import { Colors } from "@/constants/colors";
import { CATEGORY_META } from "@/constants/resourceCategories";
import { useApp } from "@/context/AppContext";
import { resources } from "@/data/resources";
import { ResourceCategory } from "@/types";

export { CATEGORY_META };

const JOURNEY_TABS = [
  { id: "all",    label: "All" },
  { id: "before", label: "Before Hospice" },
  { id: "during", label: "During Hospice" },
  { id: "after",  label: "After Hospice" },
];

// ─── Category tile for the 2-column browse grid ───────────────────────────
function CategoryCard({ category, count, onPress }: { category: ResourceCategory; count: number; onPress: () => void }) {
  const meta = CATEGORY_META[category];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.catTile, { borderTopColor: meta.color }, pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] }]}
    >
      <View style={[styles.catTileIconWrap, { backgroundColor: meta.color + "22" }]}>
        <Feather name={meta.icon as any} size={18} color={meta.color} />
      </View>
      <Text style={[styles.catTileLabel, { color: meta.color }]} numberOfLines={2}>{meta.label}</Text>
      <Text style={styles.catTileCount}>{count} article{count !== 1 ? "s" : ""}</Text>
    </Pressable>
  );
}

// ─── Featured card for horizontal scroll ──────────────────────────────────
function FeaturedCard({ resource, onPress, onSave, isSaved }: {
  resource: (typeof resources)[0];
  onPress: () => void;
  onSave: () => void;
  isSaved: boolean;
}) {
  const meta = CATEGORY_META[resource.category];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.featCard, { borderLeftColor: meta.color }, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
    >
      <View style={styles.featTop}>
        <View style={[styles.featIconWrap, { backgroundColor: meta.color + "22" }]}>
          <Feather name={meta.icon as any} size={14} color={meta.color} />
        </View>
        <Text style={[styles.featCat, { color: meta.color }]} numberOfLines={1}>{meta.shortLabel}</Text>
        <Pressable onPress={onSave} hitSlop={8} style={styles.featSave}>
          <Feather name="bookmark" size={16} color={isSaved ? Colors.primary : Colors.textSubtle} />
        </Pressable>
      </View>
      <Text style={styles.featTitle} numberOfLines={2}>{resource.title}</Text>
      <Text style={styles.featSummary} numberOfLines={2}>{resource.summary}</Text>
      <View style={styles.featFooter}>
        <Feather name="clock" size={11} color={Colors.textMuted} />
        <Text style={styles.featReadTime}>{resource.readTime} min read</Text>
      </View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────
export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const { toggleSavedResource, isSavedResource } = useApp();
  const params = useLocalSearchParams<{ tag?: string; category?: string }>();

  const [search, setSearch] = useState("");
  const [activeStage, setActiveStage] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | null>(
    (params.category as ResourceCategory) ?? null
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(params.tag ?? null);

  const isSearching = search.trim().length > 0;
  const isTagMode = !isSearching && selectedTag !== null;
  const isBrowseMode = !isSearching && selectedCategory === null && selectedTag === null;

  // Filtered by stage (used across modes)
  const stageFiltered = useMemo(() =>
    resources.filter((r) =>
      activeStage === "all" || r.journeyStage.includes(activeStage as any)
    ), [activeStage]);

  // Category counts (stage-aware)
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<ResourceCategory, number>> = {};
    for (const r of stageFiltered) {
      counts[r.category] = (counts[r.category] ?? 0) + 1;
    }
    return counts;
  }, [stageFiltered]);

  // Categories that have articles (in current stage filter)
  const activeCategories = useMemo(() =>
    (Object.keys(CATEGORY_META) as ResourceCategory[]).filter((c) => (categoryCounts[c] ?? 0) > 0),
    [categoryCounts]
  );

  // Featured resources (stage-filtered, isFeatured = true)
  const featuredResources = useMemo(() =>
    stageFiltered.filter((r) => r.isFeatured),
    [stageFiltered]
  );

  // Results for category view, tag view, or search
  const results = useMemo(() => {
    if (isSearching) {
      const q = search.toLowerCase();
      return resources.filter((r) =>
        (activeStage === "all" || r.journeyStage.includes(activeStage as any)) &&
        (r.title.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    if (selectedTag) {
      return resources.filter((r) =>
        (activeStage === "all" || r.journeyStage.includes(activeStage as any)) &&
        r.tags.includes(selectedTag)
      );
    }
    if (selectedCategory) {
      return stageFiltered.filter((r) => r.category === selectedCategory);
    }
    return [];
  }, [search, activeStage, selectedCategory, selectedTag, stageFiltered, isSearching]);

  const navigateToResource = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/resource/[id]", params: { id } });
  };

  const handleSave = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSavedResource(id);
  };

  const handleCategoryPress = (cat: ResourceCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTag(null);
    setSelectedCategory(cat);
  };

  const handleTagPress = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(null);
    setSearch("");
    setSelectedTag(tag);
  };

  const clearTag = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTag(null);
  };

  const selectedMeta = selectedCategory ? CATEGORY_META[selectedCategory] : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (selectedTag) { clearTag(); }
            else if (selectedCategory) { setSelectedCategory(null); }
            else { router.back(); }
          }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          {selectedTag ? (
            <>
              <Text style={styles.headerTitle}>#{selectedTag}</Text>
              <Text style={styles.headerSub}>{results.length} article{results.length !== 1 ? "s" : ""} tagged</Text>
            </>
          ) : selectedCategory && selectedMeta ? (
            <>
              <Text style={styles.headerTitle}>{selectedMeta.label}</Text>
              <Text style={styles.headerSub}>{categoryCounts[selectedCategory] ?? 0} articles</Text>
            </>
          ) : (
            <>
              <Text style={styles.headerTitle}>Resource Library</Text>
              <Text style={styles.headerSub}>Educational guides for the hospice journey</Text>
            </>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search resources…"
            placeholderTextColor={Colors.textSubtle}
            value={search}
            onChangeText={(v) => { setSearch(v); if (v) { setSelectedCategory(null); setSelectedTag(null); } }}
            returnKeyType="search"
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Journey stage tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {JOURNEY_TABS.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveStage(tab.id); }}
              style={[styles.tab, activeStage === tab.id && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeStage === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── BROWSE MODE ── */}
        {isBrowseMode && (
          <>
            {/* Featured */}
            {featuredResources.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Featured</Text>
                  <View style={[styles.sectionBadge, { backgroundColor: Colors.primary + "20" }]}>
                    <Feather name="star" size={11} color={Colors.primary} />
                    <Text style={styles.sectionBadgeText}>{featuredResources.length} picks</Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featScroll}>
                  {featuredResources.map((r) => (
                    <FeaturedCard
                      key={r.id}
                      resource={r}
                      onPress={() => navigateToResource(r.id)}
                      onSave={() => handleSave(r.id)}
                      isSaved={isSavedResource(r.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Category grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Browse by Topic</Text>
              <View style={styles.catList}>
                {activeCategories.map((cat) => (
                  <CategoryCard
                    key={cat}
                    category={cat}
                    count={categoryCounts[cat] ?? 0}
                    onPress={() => handleCategoryPress(cat)}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        {/* ── TAG MODE ── */}
        {isTagMode && (
          <>
            {/* Active tag chip with dismiss */}
            <View style={styles.activeTagRow}>
              <View style={styles.activeTagChip}>
                <Feather name="hash" size={13} color={Colors.primary} />
                <Text style={styles.activeTagChipText}>{selectedTag}</Text>
                <Pressable onPress={clearTag} hitSlop={8} style={styles.activeTagDismiss}>
                  <Feather name="x" size={13} color={Colors.primary} />
                </Pressable>
              </View>
              <Text style={styles.activeTagCount}>
                {results.length} article{results.length !== 1 ? "s" : ""}
              </Text>
            </View>

            {results.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Feather name="hash" size={28} color={Colors.textSubtle} />
                </View>
                <Text style={styles.emptyTitle}>No articles tagged "{selectedTag}"</Text>
                <Text style={styles.emptyText}>Try a different topic or browse all articles.</Text>
                <Pressable onPress={clearTag} style={styles.emptyAction}>
                  <Text style={styles.emptyActionText}>Browse all topics</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.articleList}>
                {results.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    onPress={() => navigateToResource(r.id)}
                    onSave={() => handleSave(r.id)}
                    onTagPress={handleTagPress}
                    isSaved={isSavedResource(r.id)}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* ── CATEGORY VIEW ── */}
        {selectedCategory !== null && !isSearching && !isTagMode && (
          <>
            {selectedMeta && (
              <View style={[styles.categoryHero, { borderLeftColor: selectedMeta.color }]}>
                <View style={[styles.catHeroIcon, { backgroundColor: selectedMeta.color + "22" }]}>
                  <Feather name={selectedMeta.icon as any} size={22} color={selectedMeta.color} />
                </View>
                <View style={styles.catHeroText}>
                  <Text style={[styles.catHeroLabel, { color: selectedMeta.color }]}>{selectedMeta.label}</Text>
                  <Text style={styles.catHeroCount}>{results.length} article{results.length !== 1 ? "s" : ""} in this topic</Text>
                </View>
              </View>
            )}
            <View style={styles.articleList}>
              {results.map((r) => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  onPress={() => navigateToResource(r.id)}
                  onSave={() => handleSave(r.id)}
                  onTagPress={handleTagPress}
                  isSaved={isSavedResource(r.id)}
                />
              ))}
            </View>
          </>
        )}

        {/* ── SEARCH RESULTS ── */}
        {isSearching && (
          <>
            {results.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Feather name="search" size={28} color={Colors.textSubtle} />
                </View>
                <Text style={styles.emptyTitle}>No results for "{search}"</Text>
                <Text style={styles.emptyText}>Try different keywords, or browse by topic below.</Text>
                <Pressable
                  onPress={() => setSearch("")}
                  style={styles.emptyAction}
                >
                  <Text style={styles.emptyActionText}>Browse by topic</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.articleList}>
                <Text style={styles.resultsCount}>
                  {results.length} result{results.length !== 1 ? "s" : ""} for "{search}"
                </Text>
                {results.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    onPress={() => navigateToResource(r.id)}
                    onSave={() => handleSave(r.id)}
                    onTagPress={handleTagPress}
                    isSaved={isSavedResource(r.id)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceMid,
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 1 },

  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.surfaceMid, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.divider,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text, padding: 0 },

  tabsWrap: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  tabsRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.surfaceMid,
    borderWidth: 1, borderColor: Colors.divider,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  tabTextActive: { color: "#fff", fontFamily: "Inter_600SemiBold" },

  content: { padding: 16, gap: 24 },

  section: { gap: 12 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.3, flex: 1 },
  sectionBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  sectionBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.primary },

  // Featured horizontal scroll
  featScroll: { gap: 12, paddingRight: 4, paddingBottom: 4 },
  featCard: {
    width: 240, backgroundColor: Colors.surfaceMid, borderRadius: 14,
    padding: 14, gap: 8, borderWidth: 1, borderColor: Colors.cardBorder,
    borderLeftWidth: 3,
  },
  featTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  featIconWrap: { width: 22, height: 22, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  featCat: { flex: 1, fontSize: 11, fontFamily: "Inter_600SemiBold" },
  featSave: { padding: 2 },
  featTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.2, lineHeight: 20 },
  featSummary: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 17 },
  featFooter: { flexDirection: "row", alignItems: "center", gap: 4 },
  featReadTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },

  // Category 2-column tile grid
  catList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  catTile: {
    width: "48%",
    backgroundColor: Colors.surfaceMid,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderTopWidth: 3,
    alignItems: "flex-start",
  },
  catTileIconWrap: {
    width: 36, height: 36, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  catTileLabel: {
    fontSize: 12, fontFamily: "Inter_700Bold",
    letterSpacing: -0.1, lineHeight: 16,
  },
  catTileCount: {
    fontSize: 10, fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },

  // Category hero (when inside category view)
  categoryHero: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: Colors.surfaceMid, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: Colors.cardBorder,
    borderLeftWidth: 3,
  },
  catHeroIcon: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  catHeroText: { flex: 1 },
  catHeroLabel: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  catHeroCount: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },

  // Active tag filter chip
  activeTagRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  activeTagChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.primary + "18",
    borderWidth: 1, borderColor: Colors.primary + "40",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: "flex-start",
  },
  activeTagChipText: {
    fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.primary,
  },
  activeTagDismiss: {
    marginLeft: 2,
  },
  activeTagCount: {
    fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted,
  },

  // Article list
  articleList: { gap: 10 },
  resultsCount: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textMuted },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyIcon: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: Colors.surfaceMid, borderWidth: 1, borderColor: Colors.divider,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.text, textAlign: "center" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted, textAlign: "center", lineHeight: 19, maxWidth: 260 },
  emptyAction: { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 12 },
  emptyActionText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
