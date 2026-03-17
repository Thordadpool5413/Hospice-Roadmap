import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { useApp } from "@/context/AppContext";
import { mockResources } from "@/data/mockResources";
import { ResourceCategory } from "@/types";

const categoryLabels: Record<ResourceCategory, string> = {
  understanding_hospice: "Understanding Hospice",
  eligibility: "Eligibility",
  caregiver_support: "Caregiver Support",
  symptom_care: "Symptom Care",
  decision_support: "Decision Support",
  after_hospice: "After Hospice",
  grief_bereavement: "Grief & Bereavement",
  physician_resources: "Physician Resources",
  documentation: "Documentation",
  myths_facts: "Myths & Facts",
};

const filterTabs = [
  { id: "all", label: "All" },
  { id: "before", label: "Before Hospice" },
  { id: "during", label: "During Hospice" },
  { id: "after", label: "After Hospice" },
];

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const { toggleSavedResource, isSavedResource } = useApp();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = mockResources.filter((r) => {
    const matchesSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.summary.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter =
      activeFilter === "all" || r.journeyStage.includes(activeFilter as any);
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Resource Library</Text>
          <Text style={styles.headerSub}>Educational guides for the hospice journey</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search resources..."
            placeholderTextColor={Colors.textSubtle}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterTabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveFilter(tab.id)}
              style={[
                styles.filterTab,
                activeFilter === tab.id && styles.filterTabActive,
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === tab.id && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={32} color={Colors.textSubtle} />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>Try adjusting your search or filter</Text>
          </View>
        ) : (
          <View style={styles.resourceList}>
            <Text style={styles.resultsCount}>
              {filtered.length} article{filtered.length !== 1 ? "s" : ""}
            </Text>
            {filtered.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onPress={() =>
                  router.push({
                    pathname: "/resource/[id]",
                    params: { id: resource.id },
                  })
                }
                onSave={() => toggleSavedResource(resource.id)}
                isSaved={isSavedResource(resource.id)}
              />
            ))}
          </View>
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
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 1 },
  content: { padding: 16, gap: 16 },
  searchRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.divider,
    paddingHorizontal: 12, paddingVertical: 10, gap: 10,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1, fontSize: 15, fontFamily: "Inter_400Regular",
    color: Colors.text, padding: 0,
  },
  filterScroll: { gap: 8, paddingBottom: 4 },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1, borderColor: Colors.divider,
  },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterTabText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  filterTabTextActive: { color: "#FFFFFF" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  resourceList: { gap: 12 },
  resultsCount: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textMuted },
});
