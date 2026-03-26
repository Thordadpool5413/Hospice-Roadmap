import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { JOURNAL_TYPE_META, useJournal } from "@/context/JournalContext";
import { useReminders } from "@/context/RemindersContext";
import { JourneyStage } from "@/types";

const roleLabels: Record<string, string> = {
  patient: "Patient",
  caregiver: "Caregiver",
  other: "User",
};

function getSupportingLabel(user: { role: string; patientProfile?: { patientName?: string } } | null): string {
  const name = user?.patientProfile?.patientName?.trim();
  if (name) return `Supporting ${name}`;
  return roleLabels[user?.role ?? "other"] ?? "Welcome";
}

const STAGE_META: Record<
  JourneyStage,
  { label: string; color: string; bg: string; icon: string; desc: string }
> = {
  before: {
    label: "Before Hospice",
    color: Colors.journeyBefore,
    bg: Colors.journeyBeforePale,
    icon: "search",
    desc: "Research, planning & eligibility guidance",
  },
  during: {
    label: "During Hospice",
    color: Colors.journeyDuring,
    bg: Colors.journeyDuringPale,
    icon: "heart",
    desc: "Day-to-day care support & navigation",
  },
  after: {
    label: "After Hospice",
    color: Colors.journeyAfter,
    bg: Colors.journeyAfterPale,
    icon: "sun",
    desc: "Grief, bereavement & moving forward",
  },
};

type QuickAction = {
  label: string;
  icon: string;
  route: string;
  iconColor: string;
};

const STAGE_ACTIONS: Record<JourneyStage, QuickAction[]> = {
  before: [
    { label: "Ask Ragna", icon: "compass", route: "/(tabs)/help", iconColor: Colors.primary },
    { label: "Eligibility", icon: "clipboard", route: "/evaluation", iconColor: Colors.journeyBefore },
    { label: "Find Providers", icon: "map-pin", route: "/(tabs)/providers", iconColor: Colors.primary },
    { label: "Situation Finder", icon: "alert-circle", route: "/situation-finder", iconColor: Colors.error },
  ],
  during: [
    { label: "Ask Ragna", icon: "compass", route: "/(tabs)/help", iconColor: Colors.primary },
    { label: "Symptom Log", icon: "bar-chart-2", route: "/symptom-tracker", iconColor: Colors.journeyBefore },
    { label: "Journal", icon: "edit-3", route: "/journal", iconColor: Colors.primary },
    { label: "Goals of Care", icon: "star", route: "/goals-of-care", iconColor: Colors.journeyAfter },
  ],
  after: [
    { label: "Ask Ragna", icon: "compass", route: "/(tabs)/help", iconColor: Colors.primary },
    { label: "Journal", icon: "edit-3", route: "/journal", iconColor: Colors.primary },
    { label: "Find Providers", icon: "map-pin", route: "/(tabs)/providers", iconColor: Colors.journeyBefore },
    { label: "Get Support", icon: "message-circle", route: "/support", iconColor: Colors.journeyAfter },
  ],
};

function formatReminderTime(dt: string): string {
  try {
    const d = new Date(dt);
    return d.toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  } catch {
    return dt;
  }
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { entries } = useJournal();
  const { reminders } = useReminders();

  const stage = user?.journeyStage ?? "during";
  const stageMeta = STAGE_META[stage];
  const quickActions = STAGE_ACTIONS[stage];
  const isPatient = user?.role === "patient";

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const nextReminder = useMemo(() => {
    const now = Date.now();
    return reminders
      .filter((r) => r.enabled && new Date(r.datetime).getTime() > now)
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())[0] ?? null;
  }, [reminders]);

  const lastEntry = entries[0] ?? null;
  const hasActivity = !!nextReminder || !!lastEntry;

  const tap = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 18), paddingBottom: insets.bottom + 110 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoMark}>
            <Image
              source={require("@/assets/images/app-icon.png")}
              style={{ width: 36, height: 36, borderRadius: 10 }}
              resizeMode="cover"
            />
          </View>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.roleLabel} numberOfLines={1}>
              {getSupportingLabel(user)}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => router.push("/(tabs)/more")}
            style={({ pressed }) => [styles.stagePill, { backgroundColor: stageMeta.bg }, pressed && { opacity: 0.75 }]}
          >
            <View style={[styles.stagePillDot, { backgroundColor: stageMeta.color }]} />
            <Text style={[styles.stagePillText, { color: stageMeta.color }]}>
              {stageMeta.label}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/more")}
            style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.6 }]}
          >
            <Feather name="settings" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* ── Situation Guide Banner ── */}
      <Pressable
        onPress={() => tap("/situation-finder")}
        style={({ pressed }) => [
          styles.helpBanner,
          pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
        ]}
      >
        <View style={styles.helpBannerLeft}>
          <View style={styles.helpBannerIcon}>
            <Feather name="book-open" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.helpBannerTitle}>Step-by-step guidance</Text>
            <Text style={styles.helpBannerSub}>Browse 60+ scenarios for any situation</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={Colors.textSubtle} />
      </Pressable>

      {/* ── Quick Access ── */}
      <View>
        <Text style={styles.sectionTitle}>Quick access</Text>
        <View style={styles.toolGrid}>
          {quickActions.map((a) => (
            <Pressable
              key={a.label}
              onPress={() => tap(a.route)}
              style={({ pressed }) => [
                styles.toolCard,
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
            >
              {a.label === "Ask Ragna" ? (
                <Image
                  source={require("@/assets/images/ragna-icon.png")}
                  style={{ width: 38, height: 38, borderRadius: 10, overflow: "hidden" } as any}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.toolIcon, { backgroundColor: a.iconColor + "22" }]}>
                  <Feather name={a.icon as any} size={18} color={a.iconColor} />
                </View>
              )}
              <Text style={[styles.toolLabel, { color: a.iconColor }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Active Dying Protocol (during + caregiver only) ── */}
      {stage === "during" && !isPatient && (
        <Pressable
          onPress={() => tap("/active-dying")}
          style={({ pressed }) => [
            styles.activeDyingCard,
            pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
          ]}
        >
          <View style={styles.activeDyingIconWrap}>
            <Feather name="heart" size={18} color={Colors.journeyAfter} />
          </View>
          <View style={styles.activeDyingText}>
            <Text style={styles.activeDyingTitle}>Active Dying Protocol</Text>
            <Text style={styles.activeDyingBody}>
              Signs to expect in the final hours, what they mean, and what to do.
            </Text>
          </View>
          <Feather name="chevron-right" size={15} color={Colors.textSubtle} />
        </Pressable>
      )}

      {/* ── Activity Snapshot ── */}
      {hasActivity && (
        <View>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.snapshotCol}>
            {nextReminder && (
              <Pressable
                onPress={() => tap("/reminders")}
                style={({ pressed }) => [styles.snapshotCard, pressed && { opacity: 0.88 }]}
              >
                <View style={[styles.snapshotIconWrap, { backgroundColor: Colors.primaryPale }]}>
                  <Feather name="bell" size={16} color={Colors.primary} />
                </View>
                <View style={styles.snapshotText}>
                  <Text style={styles.snapshotMeta}>Next reminder</Text>
                  <Text style={styles.snapshotTitle} numberOfLines={1}>{nextReminder.label}</Text>
                  <Text style={styles.snapshotSub}>{formatReminderTime(nextReminder.datetime)}</Text>
                </View>
                <Feather name="chevron-right" size={15} color={Colors.textSubtle} />
              </Pressable>
            )}

            {lastEntry && (() => {
              const meta = JOURNAL_TYPE_META[lastEntry.type];
              return (
                <Pressable
                  onPress={() => tap("/journal")}
                  style={({ pressed }) => [styles.snapshotCard, pressed && { opacity: 0.88 }]}
                >
                  <View style={[styles.snapshotIconWrap, { backgroundColor: meta.bg }]}>
                    <Feather name={meta.icon as any} size={16} color={meta.color} />
                  </View>
                  <View style={styles.snapshotText}>
                    <Text style={styles.snapshotMeta}>Latest journal entry</Text>
                    <Text style={styles.snapshotTitle} numberOfLines={1}>{lastEntry.title}</Text>
                    <Text style={styles.snapshotSub}>{lastEntry.date}</Text>
                  </View>
                  <Feather name="chevron-right" size={15} color={Colors.textSubtle} />
                </Pressable>
              );
            })()}
          </View>
        </View>
      )}

      {/* ── Your Journey ── */}
      <View>
        <Text style={styles.sectionTitle}>Your Journey</Text>
        <Pressable
          onPress={() => tap("/(tabs)/journey")}
          style={({ pressed }) => [
            styles.journeyCard,
            { borderLeftColor: stageMeta.color },
            pressed && { opacity: 0.88 },
          ]}
        >
          <View style={[styles.journeyIconWrap, { backgroundColor: stageMeta.color + "20" }]}>
            <Feather name={stageMeta.icon as any} size={22} color={stageMeta.color} />
          </View>
          <View style={styles.journeyCardText}>
            <Text style={[styles.journeyCardStage, { color: stageMeta.color }]}>
              {stageMeta.label}
            </Text>
            <Text style={styles.journeyCardDesc}>{stageMeta.desc}</Text>
            <Text style={[styles.journeyCardLink, { color: Colors.primary }]}>
              Open Journey Navigator →
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={Colors.textSubtle} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    gap: 22,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: "hidden",
  },
  greeting: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  roleLabel: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stagePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  stagePillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  stagePillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceMid,
    alignItems: "center",
    justifyContent: "center",
  },

  // Situation Guide banner — calm, not ember
  helpBanner: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  helpBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  helpBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  helpBannerTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  helpBannerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Section title
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 12,
  },

  // Tool grid — uniform surfaceMid background, only icon holds color
  toolGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  toolCard: {
    width: "47.5%",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    backgroundColor: Colors.surfaceMid,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  toolIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  toolLabel: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },

  // Activity snapshot
  snapshotCol: {
    gap: 8,
  },
  snapshotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  snapshotIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  snapshotText: {
    flex: 1,
    gap: 1,
  },
  snapshotMeta: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  snapshotTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    letterSpacing: -0.1,
  },
  snapshotSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },

  // Active Dying card — calm, neutral surface with violet left border
  activeDyingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    backgroundColor: Colors.surfaceMid,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderLeftWidth: 3,
    borderLeftColor: Colors.journeyAfter,
  },
  activeDyingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: Colors.journeyAfter + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  activeDyingText: { flex: 1, gap: 2 },
  activeDyingTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  activeDyingBody: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 17,
  },

  // Journey card — neutral body, left border in stage color only
  journeyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    padding: 16,
    backgroundColor: Colors.surfaceMid,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderLeftWidth: 3,
  },
  journeyIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  journeyCardText: {
    flex: 1,
    gap: 3,
  },
  journeyCardStage: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  journeyCardDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  journeyCardLink: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },
});
