import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
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
import { LegalDocumentCard } from "@/components/legal/LegalDocumentCard";
import { OfficialLinkButton } from "@/components/legal/OfficialLinkButton";
import { ReviewBadge } from "@/components/legal/ReviewBadge";
import { SavedItemButton } from "@/components/legal/SavedItemButton";
import { StateOverviewCard } from "@/components/legal/StateOverviewCard";
import { Colors } from "@/constants/colors";
import { getStateRegistry, getStateSourceBanner } from "@/content/legal";
import { useLegalBookmarks } from "@/hooks/useLegalBookmarks";
import { StateLegalRegistry, StateCode } from "@/content/legal/types";

export default function StateLegalDetailScreen() {
  const insets = useSafeAreaInsets();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { toggleState, toggleDoc, isStateSaved, isDocSaved, recordRecentState } = useLegalBookmarks();

  const registry: StateLegalRegistry | undefined = code ? getStateRegistry(code as StateCode) : undefined;

  useEffect(() => {
    if (code) recordRecentState(code as StateCode);
  }, [code]);

  if (!registry) {
    return (
      <View style={s.notFound}>
        <CosmicBackground />
        <Feather name="alert-circle" size={32} color={Colors.textSubtle} />
        <Text style={s.notFoundText}>State not found: {code}</Text>
        <Pressable onPress={() => router.back()} style={s.backLink}>
          <Text style={s.backLinkText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isPending = registry.review.reviewStatus === "pending_review";
  const sourceBanner = getStateSourceBanner(registry.review.reviewStatus);

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
          <Text style={s.headerTitle}>{registry.stateName}</Text>
          <Text style={s.headerSub}>Legal & Planning Documents</Text>
        </View>
        <SavedItemButton
          saved={isStateSaved(registry.stateCode)}
          onToggle={() => toggleState(registry.stateCode)}
          size={20}
        />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* State badge row */}
        <View style={s.badgeRow}>
          <View style={s.stateCodeBadge}>
            <Text style={s.stateCodeText}>{registry.stateCode}</Text>
          </View>
          <ReviewBadge status={registry.review.reviewStatus} />
        </View>

        {/* Source banner */}
        {sourceBanner.length > 0 && (
          <View style={s.sourceBanner}>
            <Feather name="info" size={12} color="#8F9AB8" />
            <Text style={s.sourceBannerText}>{sourceBanner}</Text>
          </View>
        )}

        {/* Pending state notice */}
        {isPending && (
          <View style={s.pendingNotice}>
            <Feather name="clock" size={14} color="#D59A32" />
            <Text style={s.pendingText}>
              This state's content is awaiting legal review. The entries below are scaffolded placeholders. Use official state sources for accurate, current requirements.
            </Text>
          </View>
        )}

        {/* Overview */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>State Overview</Text>
          <StateOverviewCard overview={registry.overview} />
        </View>

        {/* Documents */}
        {registry.documents.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Documents ({registry.documents.length})
            </Text>
            <View style={s.docList}>
              {registry.documents.map((doc) => (
                <LegalDocumentCard
                  key={doc.id}
                  doc={doc}
                  saved={isDocSaved(doc.id)}
                  onLearnMore={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/legal/document/${doc.id}` as any);
                  }}
                  onToggleSave={() => toggleDoc(doc.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Registry info */}
        {registry.registryInfo.hasKnownRegistry === true && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>State Registry</Text>
            <View style={s.registryCard}>
              <View style={s.registryIcon}>
                <Feather name="database" size={18} color="#8A8DFF" />
              </View>
              <View style={s.registryInfo}>
                <Text style={s.registryName}>{registry.registryInfo.registryName ?? "State Registry"}</Text>
                <Text style={s.registrySummary}>{registry.registryInfo.registrySummary}</Text>
              </View>
            </View>
            <View style={s.linksRow}>
              {registry.registryInfo.registryLinks.map((link, i) => (
                <OfficialLinkButton
                  key={i}
                  label={link.label}
                  url={link.url}
                  icon="external-link"
                  variant="secondary"
                />
              ))}
            </View>
          </View>
        )}

        {/* Official resources */}
        {registry.officialResources.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Official Resources</Text>
            <View style={s.linksRow}>
              {registry.officialResources.map((res, i) => (
                <OfficialLinkButton
                  key={i}
                  label={res.label}
                  url={res.url}
                  icon="external-link"
                />
              ))}
            </View>
          </View>
        )}

        <LegalDisclaimerCard />

        <View style={s.reviewRow}>
          <Text style={s.reviewLabel}>Content status</Text>
          <ReviewBadge status={registry.review.reviewStatus} size="sm" />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  backLink: { paddingHorizontal: 16, paddingVertical: 8 },
  backLinkText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
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
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 20 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stateCodeBadge: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: "rgba(103,183,255,0.12)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(103,183,255,0.30)",
  },
  stateCodeText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#67B7FF" },
  sourceBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(143,154,184,0.08)",
    borderWidth: 1, borderColor: "rgba(143,154,184,0.20)",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  sourceBannerText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", color: "#8F9AB8" },
  pendingNotice: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "rgba(213,154,50,0.08)",
    borderWidth: 1, borderColor: "rgba(213,154,50,0.25)",
    borderRadius: 12, padding: 12,
  },
  pendingText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: "#D59A32", lineHeight: 18 },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 12, fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.6,
  },
  docList: { gap: 12 },
  registryCard: {
    flexDirection: "row", gap: 12,
    backgroundColor: "rgba(138,141,255,0.08)",
    borderWidth: 1, borderColor: "rgba(138,141,255,0.25)",
    borderRadius: 14, padding: 14,
  },
  registryIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(138,141,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  registryInfo: { flex: 1, gap: 4 },
  registryName: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#F3F6FF" },
  registrySummary: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#B6C0DA", lineHeight: 17 },
  linksRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reviewRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 4,
  },
  reviewLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSubtle },
});
