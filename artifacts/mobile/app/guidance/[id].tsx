import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { CALL_SCRIPTS, SCENARIO_TO_SCRIPT } from "@/constants/callScripts";
import { useA11y } from "@/context/AccessibilityContext";
import { useApp } from "@/context/AppContext";
import { callHospice } from "@/utils/hospiceCall";
import {
  getCategoryById,
  getGuidanceById,
} from "@/data/guidanceContent";

const EMERGENCY_CARD_ROUTE = "/emergency-card";

const urgencyColors: Record<string, string> = {
  immediate: Colors.error,
  soon: Colors.amber,
  routine: Colors.primary,
};

const urgencyBgColors: Record<string, string> = {
  immediate: Colors.errorPale,
  soon: Colors.amberPale,
  routine: Colors.primaryPale,
};

const urgencyLabels: Record<string, string> = {
  immediate: "Call Hospice Now",
  soon: "Contact Hospice Soon",
  routine: "Reference Guide",
};

export default function GuidanceDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fontScale, highContrast } = useA11y();
  const scenario = getGuidanceById(id ?? "");
  const category = scenario ? getCategoryById(scenario.categoryId) : null;

  const scaledText = (base: number) => base * fontScale;
  const scaledLine = (base: number) => base * fontScale;
  const hcBg = highContrast ? "#FFFFFF" : undefined;
  const hcText = highContrast ? "#111111" : undefined;
  const hcSecondary = highContrast ? "#222222" : undefined;
  const hcDivider = highContrast ? "#888888" : undefined;

  if (!scenario) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Not Found</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerEmpty}>
          <Text style={styles.emptyText}>
            This guidance could not be found. Please go back and try again.
          </Text>
        </View>
      </View>
    );
  }

  const urgencyColor = urgencyColors[scenario.urgencyLevel];
  const urgencyBg = urgencyBgColors[scenario.urgencyLevel];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: hcBg ?? Colors.background }]}>
      {/* Header */}
      <View style={[styles.header, highContrast && { backgroundColor: "#fff", borderBottomColor: hcDivider }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          {category && (
            <Text style={[styles.headerCategory, { color: category.color }]}>
              {category.title}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => router.push(EMERGENCY_CARD_ROUTE as any)}
          style={({ pressed }) => [styles.emergencyBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="phone-call" size={16} color={Colors.error} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 32,
            paddingTop: Platform.OS === "web" ? 0 : 0,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgency Banner */}
        {scenario.urgencyLevel === "immediate" && (
          <View style={[styles.urgencyBanner, { backgroundColor: urgencyBg }]}>
            <Feather name="phone-call" size={18} color={urgencyColor} />
            <Text style={[styles.urgencyBannerText, { color: urgencyColor }]}>
              Call your hospice team now — 24 hours a day
            </Text>
          </View>
        )}

        {/* Title block */}
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <View
              style={[
                styles.titleIcon,
                { backgroundColor: urgencyColor + "18" },
              ]}
            >
              <Feather name={scenario.icon as any} size={24} color={urgencyColor} />
            </View>
            <View style={styles.titleBadge}>
              <View
                style={[styles.badge, { backgroundColor: urgencyBg }]}
              >
                <Text style={[styles.badgeText, { color: urgencyColor }]}>
                  {urgencyLabels[scenario.urgencyLevel]}
                </Text>
              </View>
            </View>
          </View>
          <Text style={[styles.scenarioTitle, { fontSize: scaledText(22), color: hcText ?? Colors.text }]}>
            {scenario.title}
          </Text>
          <Text style={[styles.scenarioSubtitle, { fontSize: scaledText(14), lineHeight: scaledLine(20), color: hcSecondary ?? Colors.textSecondary }]}>
            {scenario.subtitle}
          </Text>
        </View>

        {/* What You May Notice */}
        <GuidanceSection
          icon="eye"
          title="What you may be noticing"
          color={Colors.info}
          bgColor={Colors.infoPale}
        >
          {scenario.whatYouMayNotice.map((item, i) => (
            <BulletItem key={i} text={item} color={Colors.info} fontScale={fontScale} highContrast={highContrast} />
          ))}
        </GuidanceSection>

        {/* What It Means */}
        <GuidanceSection
          icon="info"
          title="What this may mean"
          color={Colors.textSecondary}
          bgColor={highContrast ? "#F5F5F5" : Colors.backgroundSecondary}
        >
          <Text style={[styles.bodyText, { fontSize: scaledText(14), lineHeight: scaledLine(21), color: hcSecondary ?? Colors.textSecondary }]}>
            {scenario.whatItMeans}
          </Text>
        </GuidanceSection>

        {/* What To Do Now */}
        <GuidanceSection
          icon="check-circle"
          title="What you can do right now"
          color={Colors.success}
          bgColor={Colors.successPale}
          accent
        >
          {scenario.whatToDoNow.map((step, i) => (
            <NumberedItem
              key={i}
              number={i + 1}
              text={step.text}
              color={Colors.success}
              tip={step.tip}
              caution={step.caution}
              fontScale={fontScale}
              highContrast={highContrast}
            />
          ))}
        </GuidanceSection>

        {/* What To Avoid */}
        <GuidanceSection
          icon="x-circle"
          title="What to avoid"
          color={Colors.error}
          bgColor={Colors.errorPale}
        >
          {scenario.whatToAvoid.map((item, i) => (
            <BulletItem key={i} text={item} color={Colors.error} bullet="×" fontScale={fontScale} highContrast={highContrast} />
          ))}
        </GuidanceSection>

        {/* When To Call Hospice */}
        <GuidanceSection
          icon="phone"
          title="When to call hospice"
          color={Colors.amber}
          bgColor={Colors.amberPale}
        >
          {scenario.whenToCallHospice.map((item, i) => (
            <BulletItem key={i} text={item} color={Colors.amber} fontScale={fontScale} highContrast={highContrast} />
          ))}
        </GuidanceSection>

        {/* What Happens Next */}
        <GuidanceSection
          icon="arrow-right-circle"
          title="What may happen next"
          color={Colors.primary}
          bgColor={Colors.primaryPale}
        >
          <Text style={[styles.bodyText, { fontSize: scaledText(14), lineHeight: scaledLine(21), color: hcSecondary ?? Colors.textSecondary }]}>
            {scenario.whatHappensNext}
          </Text>
        </GuidanceSection>

        {/* Call Hospice CTA */}
        <CallHospiceCTA urgent={scenario.urgencyLevel === "immediate"} />

        {/* Benefits Guide Link — shown for financial/rights-related scenarios */}
        {["patient-wants-to-stop-hospice", "hospice-team-roles"].includes(id ?? "") && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/benefits-guide" as any);
            }}
            style={({ pressed }) => [
              styles.benefitsGuideCta,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={styles.benefitsGuideCtaLeft}>
              <View style={styles.benefitsGuideCtaIcon}>
                <Feather name="file-text" size={18} color={Colors.primary} />
              </View>
              <View style={styles.benefitsGuideCtaText}>
                <Text style={styles.benefitsGuideCtaTitle}>
                  Hospice & Medicare: What's Covered
                </Text>
                <Text style={styles.benefitsGuideCtaSub}>
                  Plain-language guide to your financial rights and benefits
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.primary + "99"} />
          </Pressable>
        )}

        {/* Know What to Say — Call Script CTA */}
        {SCENARIO_TO_SCRIPT[id ?? ""] && (() => {
          const scriptId = SCENARIO_TO_SCRIPT[id ?? ""]!;
          const script = CALL_SCRIPTS.find((s) => s.id === scriptId);
          if (!script) return null;
          return (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/call-scripts", params: { initialScriptId: scriptId } } as any);
              }}
              style={({ pressed }) => [
                styles.callScriptCta,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={styles.callScriptCtaLeft}>
                <View style={styles.callScriptCtaIcon}>
                  <Feather name="phone-call" size={18} color={Colors.error} />
                </View>
                <View style={styles.callScriptCtaText}>
                  <Text style={styles.callScriptCtaTitle}>Know what to say</Text>
                  <Text style={styles.callScriptCtaSub} numberOfLines={1}>
                    {script.title}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color={Colors.error + "99"} />
            </Pressable>
          );
        })()}

        {/* Ask Ragna */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push({
              pathname: "/(tabs)/help",
              params: { initialMessage: `I'm reading the guidance on "${scenario.title}" and have questions. Can you help me understand this better and what I should watch for?` },
            } as any);
          }}
          style={({ pressed }) => [
            styles.askRagnaBtn,
            pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Image
            source={require("@/assets/images/ragna-icon.png")}
            style={{ width: 36, height: 36, borderRadius: 9 }}
            resizeMode="cover"
          />
          <View style={styles.askRagnaBtnText}>
            <Text style={styles.askRagnaBtnTitle}>Ask Ragna about this</Text>
            <Text style={styles.askRagnaBtnSub}>Get personalized guidance on "{scenario.title}"</Text>
          </View>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Feather name="info" size={12} color={Colors.textSubtle} />
          <Text style={styles.disclaimerText}>
            This guidance is for educational support only. Always contact your hospice team for clinical decisions and when in doubt about any situation.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function GuidanceSection({
  icon,
  title,
  color,
  bgColor,
  children,
  accent,
}: {
  icon: string;
  title: string;
  color: string;
  bgColor: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: Colors.surfaceMid, borderLeftColor: color },
        accent && styles.sectionAccent,
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: color + "22" }]}>
          <Feather name={icon as any} size={15} color={color} />
        </View>
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function BulletItem({
  text,
  color,
  bullet = "•",
  fontScale = 1,
  highContrast = false,
}: {
  text: string;
  color: string;
  bullet?: string;
  fontScale?: number;
  highContrast?: boolean;
}) {
  const fs = (n: number) => n * fontScale;
  const textColor = highContrast ? "#222222" : Colors.textSecondary;
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletChar, { color, fontSize: fs(16), lineHeight: fs(21) }]}>{bullet}</Text>
      <Text style={[styles.bulletText, { fontSize: fs(14), lineHeight: fs(21), color: textColor }]}>{text}</Text>
    </View>
  );
}

function NumberedItem({
  number,
  text,
  color,
  tip,
  caution,
  fontScale = 1,
  highContrast = false,
}: {
  number: number;
  text: string;
  color: string;
  tip?: string;
  caution?: string;
  fontScale?: number;
  highContrast?: boolean;
}) {
  const fs = (n: number) => n * fontScale;
  const textColor = highContrast ? "#222222" : Colors.textSecondary;
  return (
    <View style={styles.numberedBlock}>
      <View style={styles.numberedRow}>
        <View style={[styles.numberCircle, { backgroundColor: color }]}>
          <Text style={styles.numberText}>{number}</Text>
        </View>
        <Text style={[styles.bulletText, { fontSize: fs(14), lineHeight: fs(21), color: textColor }]}>{text}</Text>
      </View>
      {tip && (
        <View style={styles.inlineTip}>
          <Feather name="info" size={12} color={Colors.info} />
          <Text style={[styles.inlineTipText, { fontSize: fs(12), lineHeight: fs(17) }]}>{tip}</Text>
        </View>
      )}
      {caution && (
        <View style={styles.inlineCaution}>
          <Feather name="alert-triangle" size={12} color={Colors.amber} />
          <Text style={[styles.inlineCautionText, { fontSize: fs(12), lineHeight: fs(17) }]}>{caution}</Text>
        </View>
      )}
    </View>
  );
}

function CallHospiceCTA({ urgent }: { urgent: boolean }) {
  const { user } = useApp();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        if (!callHospice(user?.patientProfile)) {
          router.push("/emergency-card" as any);
        }
      }}
      style={({ pressed }) => [
        styles.ctaCard,
        { backgroundColor: urgent ? Colors.error : Colors.primary },
        pressed && { opacity: 0.88 },
      ]}
    >
      <Feather name="phone" size={22} color="#fff" />
      <View style={styles.ctaText}>
        <Text style={styles.ctaTitle}>
          {urgent ? "Call Hospice Now" : "Questions? Call Hospice"}
        </Text>
        <Text style={styles.ctaSubtitle}>
          Available 24 hours a day, 7 days a week
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
    </Pressable>
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
  },
  headerCategory: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  emergencyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.errorPale,
    alignItems: "center",
    justifyContent: "center",
  },
  centerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  urgencyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    padding: 14,
  },
  urgencyBannerText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  titleBlock: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.divider,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBadge: {
    alignItems: "flex-end",
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  scenarioTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  scenarioSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderLeftWidth: 3,
  },
  sectionAccent: {
    borderWidth: 1,
    borderColor: Colors.success + "40",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    flex: 1,
  },
  sectionBody: {
    gap: 8,
  },
  bodyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  bulletChar: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    lineHeight: 21,
    width: 14,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  numberedBlock: {
    gap: 6,
  },
  numberedRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  inlineTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: Colors.infoPale,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 34,
  },
  inlineTipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.info,
    lineHeight: 17,
  },
  inlineCaution: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: Colors.amberPale,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 34,
  },
  inlineCautionText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.amber,
    lineHeight: 17,
  },
  numberCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  numberText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 18,
  },
  callScriptCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(192,48,64,0.10)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(192,48,64,0.25)",
    marginBottom: 12,
  },
  callScriptCtaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  callScriptCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(192,48,64,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  callScriptCtaText: {
    flex: 1,
    gap: 2,
  },
  callScriptCtaTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  callScriptCtaSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  askRagnaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  askRagnaBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  askRagnaBtnText: { flex: 1 },
  askRagnaBtnTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.2,
  },
  askRagnaBtnSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.2,
  },
  ctaSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  benefitsGuideCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primaryPale,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  benefitsGuideCtaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  benefitsGuideCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitsGuideCtaText: {
    flex: 1,
    gap: 2,
  },
  benefitsGuideCtaTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.1,
  },
  benefitsGuideCtaSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
