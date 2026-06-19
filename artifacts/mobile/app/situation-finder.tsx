import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { HospiceTeamMatrix } from "@/components/crisis/HospiceTeamMatrix";
import { NeedHelpNowButton } from "@/components/crisis/NeedHelpNowButton";
import { Colors } from "@/constants/colors";
import { CRISIS_SHORTCUTS } from "@/constants/crisisFlow";
import {
  GuidanceCategory,
  GuidanceScenario,
  guidanceCategories,
  searchGuidance,
} from "@/data/guidanceContent";

const urgencyColors: Record<string, string> = {
  immediate: Colors.error,
  soon: Colors.amber,
  routine: Colors.primary,
};

const urgencyLabels: Record<string, string> = {
  immediate: "Call Hospice Now",
  soon: "Contact Soon",
  routine: "Reference Guide",
};

export default function SituationFinderScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
    }
  }, [params.category]);

  const searchResults = query.trim().length > 1 ? searchGuidance(query) : [];
  const isSearching = query.trim().length > 1;

  const activeCategory = selectedCategory
    ? guidanceCategories.find((c) => c.id === selectedCategory)
    : null;

  const handleScenarioPress = (scenario: GuidanceScenario) => {
    router.push({ pathname: "/guidance/[id]", params: { id: scenario.id } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CosmicBackground />
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (selectedCategory) {
              setSelectedCategory(null);
            } else {
              router.back();
            }
          }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {activeCategory ? activeCategory.title : "Get Help Now"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {activeCategory
              ? activeCategory.subtitle
              : "Find guidance for any situation"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      {!selectedCategory && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Describe what's happening..."
              placeholderTextColor={Colors.textSubtle}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")}>
                <Feather name="x" size={16} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>
          <Text style={styles.searchHint}>
            Try: "can't breathe", "fell", "not eating", "comfort kit", "I don't know"
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Results */}
        {isSearching && (
          <View>
            <Text style={styles.sectionLabel}>
              {searchResults.length === 0
                ? "No results — try different words or browse below"
                : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}`}
            </Text>
            {searchResults.map((scenario) => (
              <ScenarioRow
                key={scenario.id}
                scenario={scenario}
                onPress={() => handleScenarioPress(scenario)}
              />
            ))}
            {searchResults.length === 0 && (
              <NotFoundCard />
            )}
          </View>
        )}

        {/* Category Scenarios */}
        {!isSearching && activeCategory && (
          <View>
            {activeCategory.scenarios.map((scenario) => (
              <ScenarioRow
                key={scenario.id}
                scenario={scenario}
                onPress={() => handleScenarioPress(scenario)}
              />
            ))}
          </View>
        )}

        {/* Category Grid */}
        {!isSearching && !activeCategory && (
          <View>
            <NeedHelpNowButton variant="compact" />

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Common crisis situations</Text>
            {CRISIS_SHORTCUTS.slice(0, 5).map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  router.push({ pathname: "/guidance/[id]", params: { id: item.guidanceId } } as any)
                }
                style={({ pressed }) => [styles.crisisRow, pressed && { opacity: 0.82 }]}
              >
                <View style={[styles.crisisIcon, { backgroundColor: item.color + "22" }]}>
                  <Feather name={item.icon as any} size={16} color={item.color} />
                </View>
                <View style={styles.crisisText}>
                  <Text style={styles.crisisTitle}>{item.label}</Text>
                  <Text style={styles.crisisSub} numberOfLines={1}>{item.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={14} color={Colors.textSubtle} />
              </Pressable>
            ))}

            <Pressable
              onPress={() => router.push("/after-death-guide" as any)}
              style={({ pressed }) => [styles.afterDeathBanner, pressed && { opacity: 0.85 }]}
            >
              <Feather name="heart" size={18} color="#B89AE8" />
              <View style={{ flex: 1 }}>
                <Text style={styles.afterDeathTitle}>After death — dedicated guide</Text>
                <Text style={styles.afterDeathSub}>What to do first, what not to do, who to call</Text>
              </View>
              <Feather name="chevron-right" size={14} color="#B89AE899" />
            </Pressable>

            <HospiceTeamMatrix compact />

            <Text style={styles.sectionLabel}>What kind of help do you need?</Text>
            <View style={styles.categoryGrid}>
              {guidanceCategories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  onPress={() => setSelectedCategory(cat.id)}
                />
              ))}
            </View>

            {/* Urgent Banner */}
            <View style={styles.urgentBanner}>
              <View style={styles.urgentIcon}>
                <Feather name="phone" size={18} color={Colors.error} />
              </View>
              <View style={styles.urgentText}>
                <Text style={styles.urgentTitle}>When in doubt, call hospice</Text>
                <Text style={styles.urgentBody}>
                  There is no such thing as an unnecessary call. Hospice is available 24 hours a day.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function CategoryCard({
  category,
  onPress,
}: {
  category: GuidanceCategory;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryCard,
        { borderLeftColor: category.color },
        pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={[styles.categoryIcon, { backgroundColor: category.color + "22" }]}>
        <Feather name={category.icon as any} size={20} color={category.color} />
      </View>
      <Text style={[styles.categoryTitle, { color: category.color }]}>
        {category.title}
      </Text>
      <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
      <View style={styles.categoryCount}>
        <Text style={[styles.categoryCountText, { color: category.color }]}>
          {category.scenarios.length} guide{category.scenarios.length !== 1 ? "s" : ""}
        </Text>
        <Feather name="chevron-right" size={13} color={category.color} />
      </View>
    </Pressable>
  );
}

function ScenarioRow({
  scenario,
  onPress,
}: {
  scenario: GuidanceScenario;
  onPress: () => void;
}) {
  const color = urgencyColors[scenario.urgencyLevel];
  const label = urgencyLabels[scenario.urgencyLevel];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.scenarioRow,
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={[styles.scenarioIconWrap, { backgroundColor: color + "18" }]}>
        <Feather name={scenario.icon as any} size={18} color={color} />
      </View>
      <View style={styles.scenarioText}>
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
        <Text style={styles.scenarioSubtitle} numberOfLines={2}>
          {scenario.subtitle}
        </Text>
        {scenario.urgencyLevel === "immediate" && (
          <View style={[styles.urgencyBadge, { backgroundColor: color + "18" }]}>
            <Text style={[styles.urgencyBadgeText, { color }]}>{label}</Text>
          </View>
        )}
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textSubtle} />
    </Pressable>
  );
}

function NotFoundCard() {
  return (
    <View style={styles.notFoundCard}>
      <Feather name="phone" size={24} color={Colors.primary} />
      <Text style={styles.notFoundTitle}>Can't find what you're looking for?</Text>
      <Text style={styles.notFoundBody}>
        Call hospice directly — they are available 24 hours a day and there is no such thing as an unnecessary call.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  searchHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  crisisRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  crisisIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  crisisText: { flex: 1, gap: 1 },
  crisisTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.text },
  crisisSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  afterDeathBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(154, 122, 204, 0.12)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#9A7ACC35",
  },
  afterDeathTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.text },
  afterDeathSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    marginBottom: 10,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  categoryGrid: {
    gap: 10,
  },
  categoryCard: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderLeftWidth: 3,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  categorySubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  categoryCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  categoryCountText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  urgentBanner: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: Colors.errorPale,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    alignItems: "flex-start",
  },
  urgentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.errorPale,
    alignItems: "center",
    justifyContent: "center",
  },
  urgentText: {
    flex: 1,
  },
  urgentTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.error,
    marginBottom: 4,
  },
  urgentBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  scenarioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.divider,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  scenarioIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scenarioText: {
    flex: 1,
    gap: 3,
  },
  scenarioTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  scenarioSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  urgencyBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  urgencyBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  notFoundCard: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  notFoundTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    textAlign: "center",
  },
  notFoundBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
});
