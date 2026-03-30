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
import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useAppNetwork } from "@/hooks/useAppNetwork";
import { setCmsProviders as storeCmsProviders } from "@/context/cmsProviderStore";
import {
  fetchQualitySummary,
  searchCmsProviders,
  US_STATES,
} from "@/services/cmsProviderService";
import type { QualitySummary } from "@/services/cmsProviderService";
import type { Provider } from "@/types";

export default function ProvidersScreen() {
  const insets = useSafeAreaInsets();
  const { toggleSavedProvider, isSavedProvider } = useApp();
  const { isOnline } = useAppNetwork();

  const [selectedState, setSelectedState] = useState("");
  const [zipInput, setZipInput] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [stateFilter, setStateFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [qualitySummaries, setQualitySummaries] = useState<Record<string, QualitySummary>>({});

  const handleSearch = useCallback(async () => {
    if (!selectedState && !zipInput) return;
    if (!isOnline) {
      setError("No internet connection. Provider search requires internet access.");
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    setNameFilter("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await searchCmsProviders({
        state: selectedState || undefined,
        zip: zipInput || undefined,
        limit: 50,
      });
      storeCmsProviders(result.providers);
      setProviders(result.providers);
      setTotal(result.total);

      const ccns = result.providers
        .map((p) => p.ccn)
        .filter((c): c is string => !!c)
        .slice(0, 20);
      if (ccns.length > 0) {
        fetchQualitySummary(ccns)
          .then(setQualitySummaries)
          .catch(() => {});
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Search failed. Please try again.");
      setProviders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [selectedState, zipInput, isOnline]);

  const filteredStates = stateFilter
    ? US_STATES.filter(
        (s) =>
          s.label.toLowerCase().includes(stateFilter.toLowerCase()) ||
          s.value.toLowerCase().includes(stateFilter.toLowerCase())
      )
    : US_STATES;

  const filtered = nameFilter
    ? providers.filter(
        (p) =>
          p.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
          p.city.toLowerCase().includes(nameFilter.toLowerCase())
      )
    : providers;

  return (
    <View style={styles.container}>
      <CosmicBackground />
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
          <Text style={styles.title}>Find a Hospice</Text>
          <Text style={styles.subtitle}>
            Search 6,900+ Medicare-certified hospice providers across the U.S.
          </Text>
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.searchCardLabel}>Where are you located?</Text>

          {!isOnline && (
            <View style={styles.offlineNotice}>
              <Feather name="wifi-off" size={14} color={Colors.amber} />
              <Text style={styles.offlineText}>
                No internet connection — provider search unavailable offline.
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => setShowStatePicker(!showStatePicker)}
            style={styles.statePickerBtn}
          >
            <Feather name="map-pin" size={15} color={Colors.textMuted} />
            <Text
              style={[
                styles.statePickerText,
                !selectedState && { color: Colors.textSubtle },
              ]}
            >
              {selectedState
                ? US_STATES.find((s) => s.value === selectedState)?.label || selectedState
                : "Select your state…"}
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
                  placeholder="Filter states…"
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
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or search by ZIP</Text>
            <View style={styles.orLine} />
          </View>

          <View style={styles.zipRow}>
            <View style={styles.zipInputWrap}>
              <Feather name="hash" size={14} color={Colors.textMuted} />
              <TextInput
                style={styles.zipInput}
                placeholder="5-digit ZIP code"
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
              onPress={handleSearch}
              disabled={!selectedState && !zipInput}
              style={({ pressed }) => [
                styles.searchBtn,
                (!selectedState && !zipInput) && styles.searchBtnDisabled,
                pressed && { opacity: 0.85 },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="search" size={14} color="#FFFFFF" />
                  <Text style={styles.searchBtnText}>Search</Text>
                </>
              )}
            </Pressable>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Feather name="alert-triangle" size={14} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {searched && !loading && providers.length > 0 && (
          <View style={styles.filterRow}>
            <Feather name="search" size={15} color={Colors.textMuted} />
            <TextInput
              style={styles.filterInput}
              placeholder="Filter by name or city…"
              placeholderTextColor={Colors.textSubtle}
              value={nameFilter}
              onChangeText={setNameFilter}
            />
            {!!nameFilter && (
              <Pressable onPress={() => setNameFilter("")} hitSlop={8}>
                <Feather name="x" size={15} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingTitle}>Searching hospice database…</Text>
            <Text style={styles.loadingText}>
              Looking up Medicare-certified providers in your area
            </Text>
          </View>
        ) : !searched ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="map-pin" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Find a hospice near you</Text>
            <Text style={styles.emptyText}>
              Every provider in our database is Medicare-certified and required to meet federal quality standards.
            </Text>
            <View style={styles.trustRow}>
              <Feather name="shield" size={13} color={Colors.success} />
              <Text style={styles.trustText}>Data from CMS (U.S. Centers for Medicare & Medicaid Services)</Text>
            </View>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="map-pin" size={32} color={Colors.textSubtle} />
            <Text style={styles.emptyTitle}>No providers found</Text>
            <Text style={styles.emptyText}>
              Try a different state or ZIP code. Some rural areas have providers in nearby counties.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {filtered.length} hospice{filtered.length !== 1 ? "s" : ""} found
                {total > providers.length ? ` (showing ${providers.length} of ${total.toLocaleString()})` : ""}
              </Text>
              <View style={styles.cmsSourceBadge}>
                <Feather name="shield" size={11} color={Colors.success} />
                <Text style={styles.cmsSourceText}>Medicare-certified</Text>
              </View>
            </View>

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
                  isCms={!!provider.ccn}
                  qualitySummary={provider.ccn ? qualitySummaries[provider.ccn] : undefined}
                />
              ))}
            </View>

            <Pressable
              onPress={() =>
                Linking.openURL("https://data.cms.gov/provider-data/topics/hospice")
              }
              style={styles.dataSourceLink}
            >
              <Feather name="external-link" size={12} color={Colors.textSubtle} />
              <Text style={styles.dataSourceText}>
                Data from the CMS Provider Data Catalog · Updated by CMS periodically
              </Text>
            </Pressable>
          </>
        )}

        <View style={styles.disclaimer}>
          <Feather name="info" size={13} color={Colors.textSubtle} />
          <Text style={styles.disclaimerText}>
            Always contact providers directly to confirm availability, services, and whether they accept your specific insurance plan.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, gap: 16 },
  header: { gap: 4 },
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
    lineHeight: 20,
  },
  searchCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  searchCardLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  offlineNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.amberPale,
    borderRadius: 8,
    padding: 10,
  },
  offlineText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.amber,
  },
  statePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  statePickerText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  stateDropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: "hidden",
  },
  stateSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  stateSearchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    padding: 0,
  },
  stateList: { maxHeight: 220 },
  stateItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.divider,
  },
  stateItemActive: { backgroundColor: Colors.primaryPale },
  stateItemText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  stateItemTextActive: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  orText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
  },
  zipRow: {
    flexDirection: "row",
    gap: 10,
  },
  zipInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  zipInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    paddingVertical: 13,
  },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  searchBtnDisabled: { opacity: 0.4 },
  searchBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.errorPale,
    borderRadius: 10,
    padding: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.error,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  filterInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    padding: 0,
  },
  loadingBox: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 40,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  loadingTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  trustText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultsCount: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  cmsSourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.successPale,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cmsSourceText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.success,
  },
  providerList: { gap: 12 },
  dataSourceLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    paddingVertical: 8,
  },
  dataSourceText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingTop: 4,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    lineHeight: 17,
  },
});
