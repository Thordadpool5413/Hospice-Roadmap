import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
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
import { setCmsProviders as storeCmsProviders } from "@/context/cmsProviderStore";
import {
  searchCmsProviders,
  US_STATES,
} from "@/services/cmsProviderService";
import type { Provider } from "@/types";

type SearchMode = "local" | "cms";
type SortBy = "name" | "rating";

export default function ProvidersScreen() {
  const insets = useSafeAreaInsets();
  const { toggleSavedProvider, isSavedProvider } = useApp();
  const [search, setSearch] = useState("");
  const [filterMedicare, setFilterMedicare] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [searchMode, setSearchMode] = useState<SearchMode>("local");

  const [selectedState, setSelectedState] = useState("");
  const [zipInput, setZipInput] = useState("");
  const [cmsProviders, setCmsProviders] = useState<Provider[]>([]);
  const [cmsTotal, setCmsTotal] = useState(0);
  const [cmsLoading, setCmsLoading] = useState(false);
  const [cmsError, setCmsError] = useState<string | null>(null);
  const [cmsSearched, setCmsSearched] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [stateFilter, setStateFilter] = useState("");

  const handleCmsSearch = useCallback(async () => {
    if (!selectedState && !zipInput) return;
    setCmsLoading(true);
    setCmsError(null);
    setCmsSearched(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await searchCmsProviders({
        state: selectedState || undefined,
        zip: zipInput || undefined,
        limit: 50,
      });
      storeCmsProviders(result.providers);
      setCmsProviders(result.providers);
      setCmsTotal(result.total);
    } catch (err: unknown) {
      setCmsError(err instanceof Error ? err.message : "Search failed");
      setCmsProviders([]);
      setCmsTotal(0);
    } finally {
      setCmsLoading(false);
    }
  }, [selectedState, zipInput]);

  const localFiltered = mockProviders
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
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

  const cmsFiltered = cmsProviders.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q)
    );
  });

  const providers = searchMode === "cms" ? cmsFiltered : localFiltered;
  const filteredStates = stateFilter
    ? US_STATES.filter(
        (s) =>
          s.label.toLowerCase().includes(stateFilter.toLowerCase()) ||
          s.value.toLowerCase().includes(stateFilter.toLowerCase())
      )
    : US_STATES;

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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Find Providers</Text>
          <Text style={styles.subtitle}>
            Search Medicare-certified hospice providers
          </Text>
        </View>

        <View style={styles.modeToggle}>
          {(["cms", "local"] as const).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSearchMode(mode);
              }}
              style={[styles.modeBtn, searchMode === mode && styles.modeBtnActive]}
            >
              <Feather
                name={mode === "cms" ? "database" : "list"}
                size={14}
                color={searchMode === mode ? "#FFFFFF" : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  searchMode === mode && styles.modeBtnTextActive,
                ]}
              >
                {mode === "cms" ? "CMS Medicare Data" : "Sample Providers"}
              </Text>
            </Pressable>
          ))}
        </View>

        {searchMode === "cms" && (
          <View style={styles.cmsSearchBox}>
            <View style={styles.cmsBadge}>
              <Feather name="shield" size={12} color={Colors.info} />
              <Text style={styles.cmsBadgeText}>
                Official CMS Provider Data — 6,900+ certified hospices
              </Text>
            </View>

            <Pressable
              onPress={() => setShowStatePicker(!showStatePicker)}
              style={styles.statePickerBtn}
            >
              <Feather name="map" size={14} color={Colors.textMuted} />
              <Text
                style={[
                  styles.statePickerText,
                  !selectedState && { color: Colors.textSubtle },
                ]}
              >
                {selectedState
                  ? US_STATES.find((s) => s.value === selectedState)?.label ||
                    selectedState
                  : "Select state..."}
              </Text>
              <Feather
                name={showStatePicker ? "chevron-up" : "chevron-down"}
                size={14}
                color={Colors.textMuted}
              />
            </Pressable>

            {showStatePicker && (
              <View style={styles.stateDropdown}>
                <View style={styles.stateSearchRow}>
                  <Feather name="search" size={13} color={Colors.textMuted} />
                  <TextInput
                    style={styles.stateSearchInput}
                    placeholder="Filter states..."
                    placeholderTextColor={Colors.textSubtle}
                    value={stateFilter}
                    onChangeText={setStateFilter}
                    autoCapitalize="none"
                  />
                </View>
                <ScrollView
                  style={styles.stateList}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredStates.map((s) => (
                    <Pressable
                      key={s.value}
                      onPress={() => {
                        setSelectedState(s.value);
                        setShowStatePicker(false);
                        setStateFilter("");
                      }}
                      style={[
                        styles.stateItem,
                        selectedState === s.value && styles.stateItemActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stateItemText,
                          selectedState === s.value && styles.stateItemTextActive,
                        ]}
                      >
                        {s.label} ({s.value})
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.cmsInputRow}>
              <View style={styles.zipInputWrap}>
                <Feather name="hash" size={14} color={Colors.textMuted} />
                <TextInput
                  style={styles.zipInput}
                  placeholder="ZIP code (optional)"
                  placeholderTextColor={Colors.textSubtle}
                  value={zipInput}
                  onChangeText={(text) =>
                    setZipInput(text.replace(/[^0-9]/g, "").slice(0, 5))
                  }
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>

              <Pressable
                onPress={handleCmsSearch}
                disabled={!selectedState && !zipInput}
                style={({ pressed }) => [
                  styles.cmsSearchBtn,
                  (!selectedState && !zipInput) && styles.cmsSearchBtnDisabled,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {cmsLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="search" size={14} color="#FFFFFF" />
                    <Text style={styles.cmsSearchBtnText}>Search</Text>
                  </>
                )}
              </Pressable>
            </View>

            {cmsError && (
              <View style={styles.errorBanner}>
                <Feather name="alert-triangle" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{cmsError}</Text>
              </View>
            )}
          </View>
        )}

        {searchMode === "local" && (
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
        )}

        {searchMode === "cms" && cmsSearched && !cmsLoading && cmsProviders.length > 0 && (
          <View style={styles.searchRow}>
            <Feather name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Filter results by name or city..."
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
        )}

        {searchMode === "local" && (
          <View style={styles.filterRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              <Pressable
                onPress={() => setFilterMedicare(!filterMedicare)}
                style={[styles.filterChip, filterMedicare && styles.filterChipActive]}
              >
                <Feather
                  name="check"
                  size={12}
                  color={filterMedicare ? "#FFFFFF" : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    filterMedicare && styles.filterChipTextActive,
                  ]}
                >
                  Medicare Accepted
                </Text>
              </Pressable>

              {(["name", "rating"] as const).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setSortBy(s)}
                  style={[styles.filterChip, sortBy === s && styles.filterChipActive]}
                >
                  <Feather
                    name={s === "name" ? "type" : "star"}
                    size={12}
                    color={sortBy === s ? "#FFFFFF" : Colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      sortBy === s && styles.filterChipTextActive,
                    ]}
                  >
                    {s === "name" ? "A-Z" : "Top Rated"}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <Pressable
          onPress={() => router.push("/referral")}
          style={({ pressed }) => [styles.referralBanner, pressed && { opacity: 0.9 }]}
        >
          <View style={styles.referralIcon}>
            <Feather name="send" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.referralText}>
            <Text style={styles.referralTitle}>Submit a Referral or Inquiry</Text>
            <Text style={styles.referralSubtitle}>
              Request information or start the referral process
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color="#FFFFFF" />
        </Pressable>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {searchMode === "cms" && !cmsSearched
              ? "Search by state or ZIP to find providers"
              : searchMode === "cms" && cmsLoading
              ? "Searching CMS database..."
              : `${providers.length} provider${providers.length !== 1 ? "s" : ""} found${
                  searchMode === "cms" && cmsTotal > providers.length
                    ? ` (of ${cmsTotal.toLocaleString()} total)`
                    : ""
                }`}
          </Text>
          {searchMode === "cms" && cmsSearched && !cmsLoading && (
            <Text style={styles.sourceLabel}>Source: CMS Provider Data Catalog</Text>
          )}
        </View>

        {cmsLoading && searchMode === "cms" ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              Searching Medicare provider database...
            </Text>
          </View>
        ) : providers.length === 0 && (searchMode === "local" || cmsSearched) ? (
          <View style={styles.empty}>
            <Feather name="map-pin" size={32} color={Colors.textSubtle} />
            <Text style={styles.emptyTitle}>No providers found</Text>
            <Text style={styles.emptyText}>
              {searchMode === "cms"
                ? "Try a different state or ZIP code"
                : "Try adjusting your search filters"}
            </Text>
          </View>
        ) : (
          <View style={styles.providerList}>
            {providers.map((provider) => (
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
                isCms={!!provider.ccn}
              />
            ))}
          </View>
        )}

        {searchMode === "cms" && cmsSearched && !cmsLoading && (
          <View style={styles.aboutDataBox}>
            <View style={styles.aboutDataHeader}>
              <Feather name="database" size={14} color={Colors.info} />
              <Text style={styles.aboutDataTitle}>About This Data</Text>
            </View>
            <Text style={styles.aboutDataText}>
              Provider data is sourced from the CMS (Centers for Medicare &
              Medicaid Services) Provider Data Catalog, which includes all
              Medicare-certified hospice agencies in the United States. Data is
              updated periodically by CMS as part of the Hospice Quality
              Reporting Program.
            </Text>
            <Pressable
              onPress={() =>
                Linking.openURL(
                  "https://data.cms.gov/provider-data/topics/hospice"
                )
              }
              style={styles.aboutDataLink}
            >
              <Feather name="external-link" size={12} color={Colors.info} />
              <Text style={styles.aboutDataLinkText}>
                CMS Provider Data Catalog — Methodology
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.disclaimer}>
          <Feather name="info" size={13} color={Colors.textSubtle} />
          <Text style={styles.disclaimerText}>
            {searchMode === "cms"
              ? "Provider data sourced from CMS (Centers for Medicare & Medicaid Services). Data refreshed periodically. Verify credentials and services directly with each provider."
              : "Provider listings are for informational purposes. Always verify credentials and services directly with each provider."}
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
  modeToggle: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: Colors.primary,
  },
  modeBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  modeBtnTextActive: {
    color: "#FFFFFF",
  },
  cmsSearchBox: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  cmsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.infoPale,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cmsBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.info,
    flex: 1,
  },
  statePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  statePickerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  stateDropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: "hidden",
  },
  stateSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  stateSearchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    padding: 0,
  },
  stateList: {
    maxHeight: 200,
  },
  stateItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.divider,
  },
  stateItemActive: {
    backgroundColor: Colors.primaryPale,
  },
  stateItemText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  stateItemTextActive: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  cmsInputRow: {
    flexDirection: "row",
    gap: 10,
  },
  zipInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  zipInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    paddingVertical: 11,
  },
  cmsSearchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  cmsSearchBtnDisabled: {
    opacity: 0.5,
  },
  cmsSearchBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF0F0",
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.error,
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
    gap: 2,
  },
  resultsCount: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  sourceLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: 50,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
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
  aboutDataBox: {
    backgroundColor: Colors.infoPale,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#BCD9EE",
  },
  aboutDataHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  aboutDataTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.info,
  },
  aboutDataText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  aboutDataLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  aboutDataLinkText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.info,
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
