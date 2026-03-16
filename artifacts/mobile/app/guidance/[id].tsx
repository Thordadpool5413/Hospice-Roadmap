import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
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
import {
  findCategoryById,
  findScenarioById,
} from "@/data/guidanceContent";

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
  const scenario = findScenarioById(id ?? "");
  const category = scenario ? findCategoryById(scenario.categoryId) : null;

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
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
        <View style={{ width: 40 }} />
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
          <Text style={styles.scenarioTitle}>{scenario.title}</Text>
          <Text style={styles.scenarioSubtitle}>{scenario.subtitle}</Text>
        </View>

        {/* What You May Notice */}
        <GuidanceSection
          icon="eye"
          title="What you may be noticing"
          color={Colors.info}
          bgColor={Colors.infoPale}
        >
          {scenario.whatYouMayNotice.map((item, i) => (
            <BulletItem key={i} text={item} color={Colors.info} />
          ))}
        </GuidanceSection>

        {/* What It Means */}
        <GuidanceSection
          icon="info"
          title="What this may mean"
          color={Colors.textSecondary}
          bgColor={Colors.backgroundSecondary}
        >
          <Text style={styles.bodyText}>{scenario.whatItMeans}</Text>
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
            <NumberedItem key={i} number={i + 1} text={step.text} color={Colors.success} />
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
            <BulletItem key={i} text={item} color={Colors.error} bullet="×" />
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
            <BulletItem key={i} text={item} color={Colors.amber} />
          ))}
        </GuidanceSection>

        {/* What Happens Next */}
        <GuidanceSection
          icon="arrow-right-circle"
          title="What may happen next"
          color={Colors.primary}
          bgColor={Colors.primaryPale}
        >
          <Text style={styles.bodyText}>{scenario.whatHappensNext}</Text>
        </GuidanceSection>

        {/* Call Hospice CTA */}
        <CallHospiceCTA urgent={scenario.urgencyLevel === "immediate"} />

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
        { backgroundColor: bgColor },
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
}: {
  text: string;
  color: string;
  bullet?: string;
}) {
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletChar, { color }]}>{bullet}</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function NumberedItem({
  number,
  text,
  color,
}: {
  number: number;
  text: string;
  color: string;
}) {
  return (
    <View style={styles.numberedRow}>
      <View style={[styles.numberCircle, { backgroundColor: color }]}>
        <Text style={styles.numberText}>{number}</Text>
      </View>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function CallHospiceCTA({ urgent }: { urgent: boolean }) {
  return (
    <Pressable
      onPress={() => Linking.openURL("tel:hospice")}
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
  numberedRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
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
