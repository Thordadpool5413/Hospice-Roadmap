import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
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
  color: string;
  bg: string;
};

const STAGE_ACTIONS: Record<JourneyStage, QuickAction[]> = {
  before: [
    { label: "Ask Ragna", icon: "compass", route: "/(tabs)/help", color: Colors.primary, bg: Colors.primaryPale },
    { label: "Evaluate Eligibility", icon: "clipboard", route: "/evaluation", color: Colors.journeyBefore, bg: Colors.journeyBeforePale },
    { label: "Find Providers", icon: "map-pin", route: "/(tabs)/providers", color: "#5A7FA8", bg: "#EBF2FA" },
    { label: "Situation Finder", icon: "alert-circle", route: "/situation-finder", color: Colors.error, bg: Colors.errorPale },
  ],
  during: [
    { label: "Ask Ragna", icon: "compass", route: "/(tabs)/help", color: Colors.primary, bg: Colors.primaryPale },
    { label: "Symptom Log", icon: "bar-chart-2", route: "/symptom-tracker", color: "#5A7FA8", bg: "#EBF2FA" },
    { label: "Journal", icon: "edit-3", route: "/journal", color: "#7A8A6A", bg: "#F0F4EB" },
    { label: "Goals of Care", icon: "star", route: "/goals-of-care", color: "#7A5C8A", bg: "#F5EFF8" },
  ],
  after: [
    { label: "Ask Ragna", icon: "compass", route: "/(tabs)/help", color: Colors.primary, bg: Colors.primaryPale },
    { label: "Journal", icon: "edit-3", route: "/journal", color: "#7A8A6A", bg: "#F0F4EB" },
    { label: "Find Providers", icon: "map-pin", route: "/(tabs)/providers", color: Colors.journeyAfter, bg: Colors.journeyAfterPale },
    { label: "Get Support", icon: "message-circle", route: "/support", color: "#8A6A9A", bg: "#F0EBF6" },
  ],
};

const URGENT_CAREGIVER = [
  { label: "Breathing difficulty", id: "breathing-changes" },
  { label: "Worsening pain", id: "pain-worsening" },
  { label: "Agitation", id: "agitation-restlessness" },
  { label: "Patient has fallen", id: "fall-recovery" },
  { label: "Signs of dying", id: "approaching-death" },
  { label: "Not sure what's happening", id: "not-sure-whats-happening" },
];

const URGENT_PATIENT = [
  { label: "Breathing difficulty", id: "breathing-changes" },
  { label: "Worsening pain", id: "pain-worsening" },
  { label: "Feeling agitated", id: "agitation-restlessness" },
  { label: "I've fallen", id: "fall-recovery" },
  { label: "Not sure what's happening", id: "not-sure-whats-happening" },
];

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
  const urgentItems = isPatient ? URGENT_PATIENT : URGENT_CAREGIVER;

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
            <Feather name="map" size={16} color="#fff" />
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

      {/* ── Situation Guide ── */}
      <View>
        <Pressable
          onPress={() => tap("/situation-finder")}
          style={({ pressed }) => [
            styles.helpBanner,
            pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
          ]}
        >
          <View style={styles.helpBannerLeft}>
            <View style={styles.helpBannerIcon}>
              <Feather name="book-open" size={22} color="#fff" />
            </View>
            <View>
              <Text style={styles.helpBannerTitle}>What's happening right now?</Text>
              <Text style={styles.helpBannerSub}>Step-by-step guidance for any situation</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.75)" />
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsScroll}
        >
          {urgentItems.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => tap(`/guidance/${s.id}`)}
              style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.chipText}>{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

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
                { backgroundColor: a.bg },
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
            >
              <View style={[styles.toolIcon, { backgroundColor: a.color }]}>
                <Feather name={a.icon as any} size={18} color="#fff" />
              </View>
              <Text style={[styles.toolLabel, { color: a.color }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Active Dying Protocol Card (during stage, caregivers only) ── */}
      {stage === "during" && !isPatient && (
        <Pressable
          onPress={() => tap("/active-dying")}
          style={({ pressed }) => [
            styles.activeDyingCard,
            pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
          ]}
        >
          <View style={styles.activeDyingIconWrap}>
            <Feather name="heart" size={20} color="#7A5C8A" />
          </View>
          <View style={styles.activeDyingText}>
            <Text style={styles.activeDyingTitle}>Active Dying Protocol</Text>
            <Text style={styles.activeDyingBody}>
              Signs to expect in the final hours, what they mean, and what to do.
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color="rgba(122,92,138,0.5)" />
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
                <View style={[styles.snapshotIconWrap, { backgroundColor: "#EBF2FA" }]}>
                  <Feather name="bell" size={16} color="#5A7FA8" />
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

            {!nextReminder && !lastEntry && null}
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
            { borderLeftColor: stageMeta.color, backgroundColor: stageMeta.bg },
            pressed && { opacity: 0.88 },
          ]}
        >
          <View style={[styles.journeyIconWrap, { backgroundColor: stageMeta.color + "22" }]}>
            <Feather name={stageMeta.icon as any} size={22} color={stageMeta.color} />
          </View>
          <View style={styles.journeyCardText}>
            <Text style={[styles.journeyCardStage, { color: stageMeta.color }]}>
              {stageMeta.label}
            </Text>
            <Text style={styles.journeyCardDesc}>{stageMeta.desc}</Text>
            <Text style={[styles.journeyCardLink, { color: stageMeta.color }]}>
              Open Journey Navigator →
            </Text>
          </View>
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
    gap: 20,
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
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Situation Guide banner
  helpBanner: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  helpBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  helpBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  helpBannerTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  helpBannerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.82)",
    marginTop: 2,
  },
  chipsScroll: {
    marginTop: 10,
  },
  chips: {
    flexDirection: "row",
    gap: 7,
    paddingRight: 20,
  },
  chip: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.primary + "28",
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.primaryDark,
  },

  // Section title
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 12,
  },

  // Tool grid
  toolGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  toolCard: {
    width: "47.5%",
    borderRadius: 14,
    padding: 13,
    gap: 9,
  },
  toolIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toolLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
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

  activeDyingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#F5EFF8",
    borderWidth: 1,
    borderColor: "#C4A8D440",
    borderLeftWidth: 4,
    borderLeftColor: "#7A5C8A",
  },
  activeDyingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#7A5C8A18",
    alignItems: "center",
    justifyContent: "center",
  },
  activeDyingText: { flex: 1, gap: 2 },
  activeDyingTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#7A5C8A",
    letterSpacing: -0.2,
  },
  activeDyingBody: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 17,
  },

  // Journey card
  journeyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "transparent",
    borderLeftWidth: 4,
  },
  journeyIconWrap: {
    width: 48,
    height: 48,
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
