import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  type DimensionValue,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { getCmsProvider } from "@/context/cmsProviderStore";
import { mockProviders } from "@/data/mockProviders";
import { fetchQualityData, fetchSpendingData } from "@/services/cmsProviderService";
import type { CmsQualityData, CmsSpendingData, Provider } from "@/types";

function QualityScoreBar({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  color?: string;
}) {
  if (value === null || isNaN(value)) return null;
  const barColor = color || Colors.primary;
  return (
    <View style={qStyles.barRow}>
      <Text style={qStyles.barLabel}>{label}</Text>
      <View style={qStyles.barTrack}>
        <View
          style={[
            qStyles.barFill,
            { width: `${Math.min(value, 100)}%` as DimensionValue, backgroundColor: barColor },
          ]}
        />
      </View>
      <Text style={[qStyles.barValue, { color: barColor }]}>
        {value}
        {suffix || "%"}
      </Text>
    </View>
  );
}

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { toggleSavedProvider, isSavedProvider } = useApp();
  const [qualityData, setQualityData] = useState<CmsQualityData | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [qualityError, setQualityError] = useState<string | null>(null);
  const [spendingData, setSpendingData] = useState<CmsSpendingData | null>(null);
  const [spendingLoading, setSpendingLoading] = useState(false);

  const cmsProvider = id ? getCmsProvider(id) : undefined;
  const mockProvider = mockProviders.find((p) => p.id === id);
  const provider: Provider | undefined = cmsProvider || mockProvider;
  const isCms = !!cmsProvider?.ccn;

  useEffect(() => {
    if (isCms && cmsProvider?.ccn) {
      setQualityLoading(true);
      setQualityError(null);
      fetchQualityData(cmsProvider.ccn)
        .then(setQualityData)
        .catch((err: unknown) => setQualityError(err instanceof Error ? err.message : "Failed to load quality data"))
        .finally(() => setQualityLoading(false));

      setSpendingLoading(true);
      fetchSpendingData(cmsProvider.ccn)
        .then(setSpendingData)
        .catch(() => {})
        .finally(() => setSpendingLoading(false));
    }
  }, [isCms, cmsProvider?.ccn]);

  if (!provider) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.notFound}>Provider not found</Text>
      </View>
    );
  }

  const saved = isSavedProvider(provider.id);
  const stars = provider.rating ? Math.round(provider.rating) : 0;

  const handleCall = () => {
    Linking.openURL(`tel:${provider.phone.replace(/[^0-9]/g, "")}`);
  };

  const cahpsItems = qualityData
    ? [
        { label: "Overall Rating (9-10)", value: qualityData.cahps.overallRating9or10 },
        { label: "Would Recommend", value: qualityData.cahps.wouldDefinitelyRecommend },
        { label: "Treated With Respect", value: qualityData.cahps.alwaysTreatedWithRespect },
        { label: "Pain & Symptom Help", value: qualityData.cahps.alwaysGotPainHelp },
        { label: "Team Communication", value: qualityData.cahps.alwaysCommunicatedWell },
        { label: "Timely Help", value: qualityData.cahps.alwaysTimelyHelp },
        { label: "Emotional Support", value: qualityData.cahps.alwaysRightEmotionalSupport },
        { label: "Caregiver Training", value: qualityData.cahps.definitelyReceivedTraining },
      ]
    : [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {isCms && (
        <View style={styles.cmsBadge}>
          <Feather name="shield" size={13} color="#1A6DAA" />
          <Text style={styles.cmsBadgeText}>CMS Medicare Certified Provider</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.name}>{provider.name}</Text>
        <Text style={styles.location}>
          {provider.address}, {provider.city}, {provider.state}{" "}
          {provider.zip}
        </Text>

        {provider.county && (
          <Text style={styles.countyText}>
            {provider.county} County
          </Text>
        )}

        {provider.distance != null && (
          <View style={styles.distanceRow}>
            <Feather name="navigation" size={13} color={Colors.primary} />
            <Text style={styles.distance}>{provider.distance} miles away</Text>
          </View>
        )}

        {provider.rating != null && (
          <View style={styles.ratingRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Feather
                key={i}
                name="star"
                size={14}
                color={i < stars ? Colors.amberLight : Colors.divider}
              />
            ))}
            <Text style={styles.ratingText}>
              {provider.rating.toFixed(1)} ({provider.reviewCount} reviews)
            </Text>
          </View>
        )}

        <View style={styles.ctaRow}>
          <Pressable
            onPress={handleCall}
            style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.85 }]}
          >
            <Feather name="phone" size={16} color="#FFFFFF" />
            <Text style={styles.callBtnText}>Call Now</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleSavedProvider(provider.id);
            }}
            style={({ pressed }) => [
              styles.saveBtn,
              saved && styles.saveBtnActive,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Feather
              name="bookmark"
              size={16}
              color={saved ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.saveBtnText, saved && { color: Colors.primary }]}>
              {saved ? "Saved" : "Save"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/referral")}
            style={({ pressed }) => [styles.referralBtn, pressed && { opacity: 0.85 }]}
          >
            <Feather name="send" size={16} color={Colors.primary} />
            <Text style={styles.referralBtnText}>Request Info</Text>
          </Pressable>
        </View>
      </View>

      {isCms && qualityLoading && (
        <View style={qStyles.loadingBox}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={qStyles.loadingText}>Loading quality metrics...</Text>
        </View>
      )}

      {isCms && qualityData && (
        <>
          <View style={qStyles.qualityHeader}>
            <Text style={qStyles.qualityTitle}>Medicare Quality Metrics</Text>
            <Text style={qStyles.qualitySource}>
              Source: CMS Hospice Quality Reporting Program
            </Text>
          </View>

          <View style={qStyles.scoreCardsRow}>
            <View style={qStyles.scoreCard}>
              <Text style={qStyles.scoreCardLabel}>Hospice Care Index</Text>
              <Text style={qStyles.scoreCardValue}>
                {qualityData.hciScore ?? "N/A"}
                {qualityData.hciScore ? "/10" : ""}
              </Text>
            </View>
            <View style={qStyles.scoreCard}>
              <Text style={qStyles.scoreCardLabel}>Star Rating</Text>
              <View style={qStyles.starRow}>
                {qualityData.summaryStarRating &&
                qualityData.summaryStarRating !== "Not Applicable" ? (
                  <>
                    {Array.from({
                      length: parseInt(qualityData.summaryStarRating, 10) || 0,
                    }).map((_, i) => (
                      <Feather key={i} name="star" size={14} color={Colors.amberLight} />
                    ))}
                    <Text style={qStyles.starText}>
                      {qualityData.summaryStarRating}/5
                    </Text>
                  </>
                ) : (
                  <Text style={qStyles.scoreCardValue}>N/A</Text>
                )}
              </View>
            </View>
          </View>

          <View style={qStyles.scoreCardsRow}>
            <View style={qStyles.scoreCard}>
              <Text style={qStyles.scoreCardLabel}>Avg Daily Census</Text>
              <Text style={qStyles.scoreCardValue}>
                {qualityData.avgDailyCensus ?? "N/A"}
              </Text>
            </View>
            <View style={qStyles.scoreCard}>
              <Text style={qStyles.scoreCardLabel}>Visits Near Death</Text>
              <Text style={qStyles.scoreCardValue}>
                {qualityData.visitsNearDeath
                  ? `${qualityData.visitsNearDeath}%`
                  : "N/A"}
              </Text>
            </View>
          </View>

          <View style={qStyles.section}>
            <Text style={qStyles.sectionTitle}>
              Family Caregiver Survey (CAHPS)
            </Text>
            <Text style={qStyles.sectionSubtitle}>
              Percentage of caregivers reporting the best experience
            </Text>
            <View style={qStyles.barList}>
              {cahpsItems.map((item) => (
                <QualityScoreBar
                  key={item.label}
                  label={item.label}
                  value={item.value ? parseFloat(item.value) : null}
                  color={Colors.primary}
                />
              ))}
            </View>
          </View>

          {qualityData.perBeneficiarySpending && (
            <View style={qStyles.spendingCard}>
              <View style={qStyles.spendingRow}>
                <View>
                  <Text style={qStyles.spendingLabel}>
                    Per-Beneficiary Spending
                  </Text>
                  <Text style={qStyles.spendingValue}>
                    ${Number(qualityData.perBeneficiarySpending).toLocaleString()}
                  </Text>
                </View>
                <Feather name="dollar-sign" size={20} color={Colors.textMuted} />
              </View>
            </View>
          )}

          {qualityData.compositeProcessMeasure && (
            <View style={qStyles.compositeCard}>
              <Text style={qStyles.compositeLabel}>
                Composite Process Quality
              </Text>
              <Text style={qStyles.compositeValue}>
                {qualityData.compositeProcessMeasure}%
              </Text>
              <View style={qStyles.compositeBar}>
                <View
                  style={[
                    qStyles.compositeFill,
                    {
                      width:
                        `${Math.min(parseFloat(qualityData.compositeProcessMeasure), 100)}%` as DimensionValue,
                    },
                  ]}
                />
              </View>
              <Text style={qStyles.compositeDesc}>
                Measures whether patients received recommended care processes
              </Text>
            </View>
          )}

          {provider.medicareGovUrl && (
            <Pressable
              onPress={() => Linking.openURL(provider.medicareGovUrl!)}
              style={({ pressed }) => [
                qStyles.medicareLink,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Feather name="external-link" size={14} color={Colors.info} />
              <Text style={qStyles.medicareLinkText}>
                View on Medicare.gov Care Compare
              </Text>
            </Pressable>
          )}
        </>
      )}

      {isCms && qualityError && (
        <View style={qStyles.errorBox}>
          <Feather name="alert-triangle" size={14} color={Colors.error} />
          <Text style={qStyles.errorText}>{qualityError}</Text>
        </View>
      )}

      {isCms && spendingLoading && (
        <View style={qStyles.loadingBox}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={qStyles.loadingText}>Loading spending data...</Text>
        </View>
      )}

      {isCms && spendingData?.found && (
        <View style={qStyles.spendingSection}>
          <Text style={qStyles.spendingSectionTitle}>Spending & Utilization</Text>
          <Text style={qStyles.qualitySource}>
            Source: CMS Hospice Quality Reporting Program
          </Text>
          <View style={qStyles.spendingCards}>
            {spendingData.perBeneficiarySpending && (
              <View style={qStyles.spendingCard}>
                <Text style={qStyles.spendingCardLabel}>Per-Beneficiary Spending</Text>
                <Text style={qStyles.spendingCardValue}>
                  ${Number(spendingData.perBeneficiarySpending).toLocaleString()}
                </Text>
              </View>
            )}
            {spendingData.avgDailyCensus && (
              <View style={qStyles.spendingCard}>
                <Text style={qStyles.spendingCardLabel}>Avg Daily Census</Text>
                <Text style={qStyles.spendingCardValue}>
                  {Number(spendingData.avgDailyCensus).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
          {spendingData.utilizationMeasures.length > 0 && (
            <View style={qStyles.utilizationList}>
              {spendingData.utilizationMeasures
                .filter((m) => m.score && m.name)
                .slice(0, 6)
                .map((m) => (
                  <View key={m.code} style={qStyles.utilizationRow}>
                    <Text style={qStyles.utilizationName} numberOfLines={2}>{m.name}</Text>
                    <Text style={qStyles.utilizationScore}>{m.score}</Text>
                  </View>
                ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{provider.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insurance & Accreditation</Text>
        <View style={styles.chipRow}>
          {provider.acceptsMedicare && (
            <View style={[styles.chip, styles.chipGreen]}>
              <Feather name="check" size={12} color={Colors.success} />
              <Text style={[styles.chipText, { color: Colors.success }]}>
                Medicare Accepted
              </Text>
            </View>
          )}
          {provider.acceptsMedicaid && (
            <View style={[styles.chip, styles.chipGreen]}>
              <Feather name="check" size={12} color={Colors.success} />
              <Text style={[styles.chipText, { color: Colors.success }]}>
                Medicaid Accepted
              </Text>
            </View>
          )}
          {provider.accreditations.map((acc) => (
            <View key={acc} style={[styles.chip, styles.chipBlue]}>
              <Feather name="award" size={12} color={Colors.info} />
              <Text style={[styles.chipText, { color: Colors.info }]}>{acc}</Text>
            </View>
          ))}
        </View>
        {provider.cmsOwnershipType && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ownership</Text>
            <Text style={styles.detailValue}>{provider.cmsOwnershipType}</Text>
          </View>
        )}
        {provider.certificationDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Medicare Certified Since</Text>
            <Text style={styles.detailValue}>{provider.certificationDate}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services Provided</Text>
        <View style={styles.serviceList}>
          {provider.services.map((service) => (
            <View key={service} style={styles.serviceRow}>
              <View style={styles.serviceDot} />
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
        </View>
      </View>

      {provider.specialties.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.chipRow}>
            {provider.specialties.map((spec) => (
              <View key={spec} style={styles.chip}>
                <Text style={styles.chipText}>{spec}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Pressable
        onPress={() => router.push("/referral")}
        style={({ pressed }) => [styles.referralBanner, pressed && { opacity: 0.9 }]}
      >
        <View style={styles.referralBannerIcon}>
          <Feather name="send" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.referralBannerText}>
          <Text style={styles.referralBannerTitle}>
            Start a Referral or Request
          </Text>
          <Text style={styles.referralBannerSubtitle}>
            Submit a referral request or request information from this provider
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color="#FFFFFF" />
      </Pressable>

      <View style={styles.disclaimer}>
        <Feather name="info" size={13} color={Colors.textSubtle} />
        <Text style={styles.disclaimerText}>
          {isCms
            ? "Quality data sourced from CMS Hospice Quality Reporting Program and CAHPS Hospice Survey. Verify current information directly with the provider."
            : "Provider information is for educational reference. Verify services, credentials, and insurance coverage directly with the provider."}
        </Text>
      </View>
    </ScrollView>
  );
}

const qStyles = StyleSheet.create({
  qualityHeader: {
    gap: 2,
  },
  qualityTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.4,
  },
  qualitySource: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  scoreCardsRow: {
    flexDirection: "row",
    gap: 10,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  scoreCardLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  scoreCardValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  starText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginLeft: 4,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: -4,
  },
  barList: {
    gap: 10,
    marginTop: 4,
  },
  barRow: {
    gap: 4,
  },
  barLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  barTrack: {
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  barValue: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
    marginTop: -2,
  },
  spendingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  spendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spendingLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  spendingValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  compositeCard: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  compositeLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  compositeValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  compositeBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 3,
    overflow: "hidden",
  },
  compositeFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  compositeDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  medicareLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.infoPale,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BCD9EE",
  },
  medicareLinkText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.info,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF0F0",
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.error,
  },
  spendingSection: {
    gap: 8,
  },
  spendingSectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.4,
  },
  spendingCards: {
    flexDirection: "row",
    gap: 10,
  },
  spendingCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  spendingCardLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  spendingCardValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.4,
  },
  utilizationList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  utilizationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  utilizationName: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  utilizationScore: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    minWidth: 50,
    textAlign: "right",
  },
});

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
  cmsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F4FD",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#B8DAEF",
    alignSelf: "flex-start",
  },
  cmsBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#1A6DAA",
  },
  header: {
    gap: 10,
  },
  name: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  location: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 20,
  },
  countyText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  distance: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  callBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
  },
  saveBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryPale,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  referralBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.primaryPale,
  },
  referralBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  chipGreen: {
    backgroundColor: Colors.successPale,
    borderColor: "#BFDDCC",
  },
  chipBlue: {
    backgroundColor: Colors.infoPale,
    borderColor: "#BCD9EE",
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  serviceList: {
    gap: 8,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  serviceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  serviceText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  referralBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.accent,
    borderRadius: 16,
    padding: 16,
  },
  referralBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  referralBannerText: {
    flex: 1,
    gap: 3,
  },
  referralBannerTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  referralBannerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 17,
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
