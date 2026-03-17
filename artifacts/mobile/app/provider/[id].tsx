import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { fetchQualityData } from "@/services/cmsProviderService";
import type { CmsQualityData, Provider } from "@/types";

function parseNum(val: string | null | undefined): number | null {
  if (!val) return null;
  const n = parseFloat(val.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

function formatCertDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function StarRating({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 3, alignItems: "center" }}>
      {Array.from({ length: max }).map((_, i) => (
        <Feather
          key={i}
          name={i < count ? "star" : "star"}
          size={16}
          color={i < count ? Colors.accent : Colors.divider}
          style={i < count ? {} : { opacity: 0.35 }}
        />
      ))}
    </View>
  );
}

const CLINICAL_LABELS: Record<string, string> = {
  "H_001_01_OBSERVED": "Treatment preferences were documented",
  "H_002_01_OBSERVED": "Spiritual or personal values were addressed",
  "H_003_01_OBSERVED": "Pain was regularly screened",
  "H_004_01_OBSERVED": "Pain was thoroughly assessed when present",
  "H_005_01_OBSERVED": "Breathing problems were screened",
  "H_006_01_OBSERVED": "Breathing problems were treated",
  "H_007_01_OBSERVED": "Bowel care provided when on opioids",
  "H_011_01_OBSERVED": "Nurse or aide visited in the final days",
};

function SurveyRow({ question, pct }: { question: string; pct: string | null | undefined }) {
  const num = parseNum(pct);
  if (num === null) return null;
  const barWidth = `${Math.min(num, 100)}%`;
  const color = num >= 80 ? Colors.success : num >= 60 ? Colors.accent : Colors.error;

  return (
    <View style={styles.surveyRow}>
      <Text style={styles.surveyQuestion}>{question}</Text>
      <View style={styles.surveyBarRow}>
        <View style={styles.surveyTrack}>
          <View style={[styles.surveyFill, { width: barWidth as `${number}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.surveyPct, { color }]}>{Math.round(num)}%</Text>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { toggleSavedProvider, isSavedProvider } = useApp();
  const [qualityData, setQualityData] = useState<CmsQualityData | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);

  const provider: Provider | undefined = id ? getCmsProvider(id) : undefined;
  const isCms = !!provider?.ccn;

  useEffect(() => {
    if (isCms && provider?.ccn) {
      setQualityLoading(true);
      fetchQualityData(provider.ccn)
        .then(setQualityData)
        .catch(() => {})
        .finally(() => setQualityLoading(false));
    }
  }, [isCms, provider?.ccn]);

  if (!provider) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.notFound}>Provider not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const saved = isSavedProvider(provider.id);

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${provider.phone.replace(/[^0-9]/g, "")}`);
  };

  const starRating = qualityData?.summaryStarRating
    ? parseInt(qualityData.summaryStarRating, 10) || null
    : null;

  const hciScore = parseNum(qualityData?.hciScore);
  const visitsNearDeath = parseNum(qualityData?.visitsNearDeath);
  const compositeScore = parseNum(qualityData?.compositeProcessMeasure);
  const avgCensus = parseNum(qualityData?.avgDailyCensus);

  const certDateFormatted = formatCertDate(provider.certificationDate);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
      >
        <Feather name="arrow-left" size={20} color={Colors.text} />
        <Text style={styles.backBtnText}>Back to results</Text>
      </Pressable>

      <View style={styles.certBadge}>
        <Feather name="shield" size={13} color={Colors.success} />
        <Text style={styles.certBadgeText}>Medicare-Certified Hospice</Text>
      </View>

      <Text style={styles.providerName}>{provider.name}</Text>

      <View style={styles.locationRow}>
        <Feather name="map-pin" size={14} color={Colors.textMuted} />
        <Text style={styles.locationText}>
          {provider.address ? `${provider.address}, ` : ""}
          {provider.city}, {provider.state} {provider.zip}
        </Text>
      </View>

      {certDateFormatted && (
        <Text style={styles.certSince}>
          Medicare-certified since {certDateFormatted}
        </Text>
      )}

      <View style={styles.ctaRow}>
        <Pressable
          onPress={handleCall}
          style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.85 }]}
        >
          <Feather name="phone" size={16} color="#FFFFFF" />
          <Text style={styles.callBtnText}>
            {provider.phone ? provider.phone : "Call Now"}
          </Text>
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
      </View>

      {qualityLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading quality information…</Text>
        </View>
      )}

      {qualityData && !qualityLoading && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medicare Quality Rating</Text>
            <Text style={styles.sectionSubtitle}>
              Assigned by Medicare based on family surveys and clinical quality measures. 5 stars is the best.
            </Text>

            {starRating !== null ? (
              <View style={styles.starBlock}>
                <StarRating count={starRating} />
                <Text style={styles.starLabel}>{starRating} out of 5 stars</Text>
              </View>
            ) : (
              <Text style={styles.noDataText}>Star rating not yet available for this provider.</Text>
            )}

            {hciScore !== null && (
              <View style={styles.hciRow}>
                <View style={styles.hciScoreBox}>
                  <Text style={styles.hciNumber}>{hciScore}</Text>
                  <Text style={styles.hciDenom}>/10</Text>
                </View>
                <View style={styles.hciDesc}>
                  <Text style={styles.hciTitle}>Hospice Care Index</Text>
                  <Text style={styles.hciBody}>
                    Medicare tracks 10 quality benchmarks. This number shows how many this hospice meets. Most high-performing hospices score 9–10.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {qualityData.cahps && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What Families Reported</Text>
              <Text style={styles.sectionSubtitle}>
                Based on surveys of families who received care from this hospice. Percentages show how often families had a good experience.
              </Text>

              <SurveyRow
                question="Would recommend this hospice to others"
                pct={qualityData.cahps.wouldDefinitelyRecommend}
              />
              <SurveyRow
                question="Rated care 9 or 10 out of 10 overall"
                pct={qualityData.cahps.overallRating9or10}
              />
              <SurveyRow
                question="Patient was always treated with dignity and respect"
                pct={qualityData.cahps.alwaysTreatedWithRespect}
              />
              <SurveyRow
                question="Pain and discomfort were always well managed"
                pct={qualityData.cahps.alwaysGotPainHelp}
              />
              <SurveyRow
                question="Got help from the team as quickly as needed"
                pct={qualityData.cahps.alwaysTimelyHelp}
              />
              <SurveyRow
                question="Team communicated clearly with the family"
                pct={qualityData.cahps.alwaysCommunicatedWell}
              />
              <SurveyRow
                question="Family received the emotional support they needed"
                pct={qualityData.cahps.alwaysRightEmotionalSupport}
              />
              <SurveyRow
                question="Family felt trained and prepared to give care at home"
                pct={qualityData.cahps.definitelyReceivedTraining}
              />
            </View>
          )}

          {(() => {
            const clinicalMeasures = (qualityData.qualityMeasures || []).filter(
              (m) => CLINICAL_LABELS[m.code]
            );
            if (clinicalMeasures.length === 0) return null;
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Clinical Quality Measures</Text>
                <Text style={styles.sectionSubtitle}>
                  Percentage of patients who received each care practice. Based on Medicare clinical data — higher is better.
                </Text>
                {clinicalMeasures.map((m) => (
                  <SurveyRow
                    key={m.code}
                    question={CLINICAL_LABELS[m.code]}
                    pct={m.score}
                  />
                ))}
              </View>
            );
          })()}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Care Details</Text>

            {visitsNearDeath !== null && (
              <View style={styles.qualDetailRow}>
                <View style={styles.qualDetailPct}>
                  <Text style={styles.qualDetailNum}>{Math.round(visitsNearDeath)}%</Text>
                </View>
                <View style={styles.qualDetailDesc}>
                  <Text style={styles.qualDetailTitle}>Nurse or aide visited in final days</Text>
                  <Text style={styles.qualDetailBody}>
                    How often patients received a nursing or aide visit in the last 3 days of life. Reflects how present the hospice team was at the most critical time.
                  </Text>
                </View>
              </View>
            )}

            {avgCensus !== null && (
              <InfoRow
                label="Patients currently served"
                value={`~${Math.round(avgCensus).toLocaleString()} patients`}
              />
            )}
          </View>
        </>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Provider Information</Text>

        <InfoRow label="Medicare accepted" value="Yes — no cost to you for covered hospice services" />
        {provider.certificationDate && (
          <InfoRow label="Certified since" value={certDateFormatted || provider.certificationDate} />
        )}
        {provider.cmsOwnershipType && (
          <InfoRow
            label="Organization type"
            value={provider.cmsOwnershipType}
          />
        )}
        {provider.county && (
          <InfoRow label="County" value={`${provider.county} County`} />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services Included</Text>
        <Text style={styles.sectionSubtitle}>
          Medicare requires all certified hospices to provide these services at no additional cost to you.
        </Text>
        <View style={styles.serviceList}>
          {provider.services.map((service) => (
            <View key={service} style={styles.serviceRow}>
              <Feather name="check-circle" size={14} color={Colors.success} />
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.nextStepsCard}>
        <Text style={styles.nextStepsTitle}>Ready to learn more?</Text>
        <Text style={styles.nextStepsBody}>
          Call to ask about availability, the intake process, and whether they serve your specific area. It's okay to call multiple hospices and compare — most families speak with 2–3 before deciding.
        </Text>
        <Pressable
          onPress={handleCall}
          style={({ pressed }) => [styles.callBtnLarge, pressed && { opacity: 0.85 }]}
        >
          <Feather name="phone" size={16} color="#FFFFFF" />
          <Text style={styles.callBtnLargeText}>
            {provider.phone ? `Call ${provider.phone}` : "Call Now"}
          </Text>
        </Pressable>

        {provider.medicareGovUrl && (
          <Pressable
            onPress={() => Linking.openURL(provider.medicareGovUrl!)}
            style={({ pressed }) => [styles.medicareLink, pressed && { opacity: 0.8 }]}
          >
            <Feather name="external-link" size={13} color={Colors.info} />
            <Text style={styles.medicareLinkText}>
              View full profile on Medicare.gov
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.disclaimer}>
        <Feather name="info" size={13} color={Colors.textSubtle} />
        <Text style={styles.disclaimerText}>
          Quality data from CMS Hospice Quality Reporting Program and CAHPS Hospice Survey. Always verify current services, availability, and insurance acceptance directly with the provider.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },

  notFound: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  backLink: { marginTop: 12 },
  backLinkText: { fontSize: 14, color: Colors.primary, fontFamily: "Inter_600SemiBold" },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },

  certBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: Colors.successPale,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  certBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.success,
  },

  providerName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: -4,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  certSince: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: -4,
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
    paddingVertical: 14,
  },
  callBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  saveBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryPale },
  saveBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },

  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },

  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: -4,
  },

  starBlock: {
    gap: 6,
  },
  starLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  noDataText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    fontStyle: "italic",
  },

  hciRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    backgroundColor: Colors.primaryPale,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primary + "25",
  },
  hciScoreBox: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 1,
  },
  hciNumber: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    letterSpacing: -1,
  },
  hciDenom: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
    opacity: 0.7,
    paddingBottom: 2,
  },
  hciDesc: { flex: 1, gap: 3 },
  hciTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  hciBody: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 17,
  },

  surveyRow: {
    gap: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  surveyQuestion: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  surveyBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  surveyTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    overflow: "hidden",
  },
  surveyFill: {
    height: 8,
    borderRadius: 4,
  },
  surveyPct: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    minWidth: 40,
    textAlign: "right",
  },

  qualDetailRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  qualDetailPct: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  qualDetailNum: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  qualDetailDesc: { flex: 1, gap: 4 },
  qualDetailTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  qualDetailBody: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 17,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    flex: 2,
    textAlign: "right",
  },

  serviceList: { gap: 8 },
  serviceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  serviceText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  nextStepsCard: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  nextStepsTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  nextStepsBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  callBtnLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  callBtnLargeText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  medicareLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    paddingTop: 4,
  },
  medicareLinkText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.info,
  },

  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    lineHeight: 17,
  },
});
