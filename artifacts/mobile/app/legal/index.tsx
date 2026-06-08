import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { LegalDisclaimerCard } from "@/components/legal/LegalDisclaimerCard";
import { LegalFilterChips, FilterChipOption } from "@/components/legal/LegalFilterChips";
import { LegalSearchBar } from "@/components/legal/LegalSearchBar";
import { ReviewBadge } from "@/components/legal/ReviewBadge";
import { StateRowCard } from "@/components/legal/StateRowCard";
import { Colors } from "@/constants/colors";
import {
  FULL_STATE_LEGAL_REGISTRY,
  REVIEWED_STATE_CODES,
  STATE_DIRECTORY,
  searchStatesAndDocuments,
} from "@/content/legal";
import { useLegalBookmarks } from "@/hooks/useLegalBookmarks";
import { StateLegalRegistry } from "@/content/legal/types";

const FILTER_OPTIONS: FilterChipOption[] = [
  { key: "all", label: "All States" },
  { key: "reviewed", label: "Reviewed" },
  { key: "pending", label: "Pending Review" },
  { key: "saved", label: "Saved" },
];

function StatsBar() {
  const reviewed = REVIEWED_STATE_CODES.length;
  const total = STATE_DIRECTORY.length;
  return (
    <View style={s.statsBar}>
      <View style={s.statItem}>
        <Text style={s.statNum}>{total}</Text>
        <Text style={s.statLabel}>States + DC</Text>
      </View>
      <View style={s.statDiv} />
      <View style={s.statItem}>
        <Text style={[s.statNum, { color: "#58B6FF" }]}>{reviewed}</Text>
        <Text style={s.statLabel}>Reviewed</Text>
      </View>
      <View style={s.statDiv} />
      <View style={s.statItem}>
        <Text style={[s.statNum, { color: "#D59A32" }]}>{total - reviewed}</Text>
        <Text style={s.statLabel}>Pending</Text>
      </View>
    </View>
  );
}

export default function LegalHomeScreen() {
  const insets = useSafeAreaInsets();
  const { savedStates, toggleState, isStateSaved } = useLegalBookmarks();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo<StateLegalRegistry[]>(() => {
    let list = query.trim().length > 0
      ? searchStatesAndDocuments(query)
      : FULL_STATE_LEGAL_REGISTRY;

    if (filter === "reviewed") list = list.filter((r) => r.review.reviewStatus === "reviewed");
    else if (filter === "pending") list = list.filter((r) => r.review.reviewStatus === "pending_review");
    else if (filter === "saved") list = list.filter((r) => savedStates.includes(r.stateCode));

    return list;
  }, [query, filter, savedStates]);

  return (
    <View style={s.container}>
      <CosmicBackground />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Advance Directives</Text>
          <Text style={s.headerSub}>Living Wills, POLST & State Forms</Text>
        </View>
        <Pressable
          onPress={() => router.push("/legal/info" as any)}
          style={({ pressed }) => [s.infoBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="info" size={20} color={Colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Intro */}
        <View style={s.intro}>
          <Text style={s.introTitle}>Medical Planning Documents by State</Text>
          <Text style={s.introBody}>
            Find advance directives, healthcare proxies, POLST forms, and DNR orders for each state. Select your state to see document details, official forms, and step-by-step completion guides.
          </Text>
          <StatsBar />
        </View>

        {/* Sticky search + filters */}
        <View style={s.stickySection}>
          <View style={s.searchWrap}>
            <LegalSearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search state, POLST, proxy, advance directive…"
            />
          </View>
          <LegalFilterChips options={FILTER_OPTIONS} selected={filter} onSelect={setFilter} />
        </View>

        {/* Disclaimer */}
        <LegalDisclaimerCard compact={false} />

        {/* Results */}
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Feather name="search" size={28} color={Colors.textSubtle} />
            <Text style={s.emptyText}>No states match "{query}"</Text>
            <Pressable onPress={() => { setQuery(""); setFilter("all"); }}>
              <Text style={s.emptyReset}>Clear search</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.list}>
            {filter === "all" ? (
              <>
                {/* Reviewed section */}
                {filtered.filter((r) => r.review.reviewStatus === "reviewed").length > 0 && (
                  <>
                    <View style={s.sectionHeader}>
                      <Text style={s.sectionLabel}>Reviewed States</Text>
                      <ReviewBadge status="reviewed" size="sm" />
                    </View>
                    {filtered
                      .filter((r) => r.review.reviewStatus === "reviewed")
                      .map((registry) => (
                        <StateRowCard
                          key={registry.stateCode}
                          registry={registry}
                          saved={isStateSaved(registry.stateCode)}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push(`/legal/state/${registry.stateCode}` as any);
                          }}
                          onToggleSave={() => toggleState(registry.stateCode)}
                        />
                      ))}
                  </>
                )}
                {/* Pending section */}
                {filtered.filter((r) => r.review.reviewStatus !== "reviewed").length > 0 && (
                  <>
                    <View style={s.sectionHeader}>
                      <Text style={s.sectionLabel}>All Other States</Text>
                      <ReviewBadge status="pending_review" size="sm" />
                    </View>
                    {filtered
                      .filter((r) => r.review.reviewStatus !== "reviewed")
                      .map((registry) => (
                        <StateRowCard
                          key={registry.stateCode}
                          registry={registry}
                          saved={isStateSaved(registry.stateCode)}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push(`/legal/state/${registry.stateCode}` as any);
                          }}
                          onToggleSave={() => toggleState(registry.stateCode)}
                        />
                      ))}
                  </>
                )}
              </>
            ) : (
              /* For reviewed / pending / saved filters — flat list */
              filtered.map((registry) => (
                <StateRowCard
                  key={registry.stateCode}
                  registry={registry}
                  saved={isStateSaved(registry.stateCode)}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/legal/state/${registry.stateCode}` as any);
                  }}
                  onToggleSave={() => toggleState(registry.stateCode)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1730" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(40,65,140,0.40)",
    backgroundColor: "rgba(11,23,48,0.97)",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(14,22,55,0.90)",
    borderWidth: 1,
    borderColor: "rgba(60,90,170,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#EEF4FF", letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#5A78A8", marginTop: 1 },
  infoBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(14,22,55,0.90)",
    borderWidth: 1,
    borderColor: "rgba(60,90,170,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  scroll: { flex: 1 },
  content: { gap: 0 },
  intro: {
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16,
    gap: 10,
  },
  introTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#EEF4FF", letterSpacing: -0.4 },
  introBody: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#5A78A8", lineHeight: 20 },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "rgba(12,20,55,0.90)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(55,85,170,0.22)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#EEF4FF", letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#3A5080", textTransform: "uppercase" },
  statDiv: { width: 1, height: 30, backgroundColor: "rgba(55,85,170,0.22)", marginHorizontal: 8 },
  stickySection: {
    backgroundColor: "#0B1730",
    paddingBottom: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(40,65,140,0.40)",
  },
  searchWrap: { paddingHorizontal: 16, paddingTop: 8 },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 8,
  },
  sectionLabel: {
    fontSize: 12, fontFamily: "Inter_600SemiBold",
    color: "#5A78A8", textTransform: "uppercase", letterSpacing: 0.5,
  },
  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#5A78A8" },
  emptyReset: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.primary },
});

