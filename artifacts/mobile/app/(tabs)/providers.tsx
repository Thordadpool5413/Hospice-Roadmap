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

import { ProviderCard } from "@/components/ProviderCard";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { mockProviders } from "@/data/mockProviders";

export default function ProvidersScreen() {
  const insets = useSafeAreaInsets();
  const { toggleSavedProvider, isSavedProvider } = useApp();
  const [search, setSearch] = useState("");
  const [filterMedicare, setFilterMedicare] = useState(false);
  const [sortBy, setSortBy] = useState<"distance" | "rating">("distance");

  const filtered = mockProviders
    .filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchesMedicare = !filterMedicare || p.acceptsMedicare;
      return matchesSearch && matchesMedicare;
    })
    .sort((a, b) => {
      if (sortBy === "distance") {
        return (a.distance ?? 99) - (b.distance ?? 99);
      }
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Find Providers</Text>
          <Text style={styles.subtitle}>
            Search hospice providers near you
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="City, provider name..."
            placeholderTextColor={Colors.textSubtle}
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <Pressable
              onPress={() => setFilterMedicare(!filterMedicare)}
              style={[styles.filterChip, filterMedicare && styles.filterChipActive]}
            >
              <Feather
                name="check"
                size={12}
                color={filterMedicare ? "#FFFFFF" : Colors.textMuted}
              />
              <Text style={[styles.filterChipText, filterMedicare && styles.filterChipTextActive]}>
                Medicare Accepted
              </Text>
            </Pressable>

            {(["distance", "rating"] as const).map((s) => (
              <Pressable
                key={s}
                onPress={() => setSortBy(s)}
                style={[styles.filterChip, sortBy === s && styles.filterChipActive]}
              >
                <Feather
                  name={s === "distance" ? "navigation" : "star"}
                  size={12}
                  color={sortBy === s ? "#FFFFFF" : Colors.textMuted}
                />
                <Text style={[styles.filterChipText, sortBy === s && styles.filterChipTextActive]}>
                  {s === "distance" ? "Nearest" : "Top Rated"}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Referral CTA */}
        <Pressable
          onPress={() => router.push("/referral")}
          style={({ pressed }) => [styles.referralBanner, pressed && { opacity: 0.9 }]}
        >
          <View style={styles.referralIcon}>
            <Feather name="send" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.referralText}>
            <Text style={styles.referralTitle}>Submit a Referral or Inquiry</Text>
            <Text style={styles.referralSubtitle}>Request information or start the referral process</Text>
          </View>
          <Feather name="chevron-right" size={16} color="#FFFFFF" />
        </Pressable>

        {/* Results */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filtered.length} provider{filtered.length !== 1 ? "s" : ""} found
          </Text>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="map-pin" size={32} color={Colors.textSubtle} />
            <Text style={styles.emptyTitle}>No providers found</Text>
            <Text style={styles.emptyText}>Try adjusting your search filters</Text>
          </View>
        ) : (
          <View style={styles.providerList}>
            {filtered.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onPress={() =>
                  router.push({
                    pathname: "/provider/[id]",
                    params: { id: provider.id },
                  })
                }
                onSave={() => toggleSavedProvider(provider.id)}
                isSaved={isSavedProvider(provider.id)}
              />
            ))}
          </View>
        )}

        <View style={styles.disclaimer}>
          <Feather name="info" size={13} color={Colors.textSubtle} />
          <Text style={styles.disclaimerText}>
            Provider listings are for informational purposes. Always verify
            credentials and services directly with each provider.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    padding: 0,
  },
  filterRow: {},
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  referralBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 14,
  },
  referralIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  referralText: {
    flex: 1,
    gap: 2,
  },
  referralTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  referralSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  resultsHeader: {
    marginTop: 4,
  },
  resultsCount: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  providerList: {
    gap: 12,
  },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 12,
  },
  disclaimerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
});
