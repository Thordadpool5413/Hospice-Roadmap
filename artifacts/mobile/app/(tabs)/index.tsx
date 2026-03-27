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

// ─── Stage display metadata ──────────────────────────────────────────────────
const STAGE_META: Record<JourneyStage, { label: string; color: string; bg: string; icon: string; desc: string }> = {
  before: { label: "Before Hospice", color: Colors.journeyBefore, bg: Colors.journeyBeforePale, icon: "search", desc: "Research, planning & eligibility guidance" },
  during: { label: "During Hospice", color: Colors.journeyDuring, bg: Colors.journeyDuringPale, icon: "heart", desc: "Day-to-day care support & navigation" },
  after:  { label: "After Hospice",  color: Colors.journeyAfter,  bg: Colors.journeyAfterPale,  icon: "sun",   desc: "Grief, bereavement & moving forward" },
};

// ─── Tool card definition ────────────────────────────────────────────────────
type Tool = { label: string; sub: string; icon: string; route: string; iconColor: string };

// ─── Role + Stage → tools ────────────────────────────────────────────────────
function getRoleTools(role: string, stage: JourneyStage): Tool[] {
  if (role === "patient") {
    if (stage === "before") return [
      { label: "Symptom Log",    sub: "Track how you're feeling",   icon: "bar-chart-2",  route: "/symptom-tracker", iconColor: Colors.journeyBefore },
      { label: "Eligibility",    sub: "Am I eligible for hospice?", icon: "clipboard",    route: "/evaluation",       iconColor: Colors.journeyBefore },
      { label: "Goals of Care",  sub: "What matters most to you",   icon: "star",         route: "/goals-of-care",    iconColor: Colors.journeyAfter  },
      { label: "Find Providers", sub: "Hospice programs near you",  icon: "map-pin",      route: "/(tabs)/providers", iconColor: Colors.primary        },
    ];
    if (stage === "during") return [
      { label: "Symptom Log",   sub: "Track how you're feeling today", icon: "bar-chart-2", route: "/symptom-tracker", iconColor: Colors.journeyBefore },
      { label: "Journal",       sub: "Write what's on your mind",      icon: "edit-3",      route: "/journal",          iconColor: Colors.primary        },
      { label: "Goals of Care", sub: "What matters most to you",       icon: "star",        route: "/goals-of-care",    iconColor: Colors.journeyAfter  },
      { label: "Reminders",     sub: "Medication & care schedule",     icon: "bell",        route: "/reminders",        iconColor: Colors.primary        },
    ];
    // after
    return [
      { label: "Journal",      sub: "Write what's on your mind", icon: "edit-3",       route: "/journal",          iconColor: Colors.primary        },
      { label: "Get Support",  sub: "Grief & bereavement help",  icon: "message-circle",route: "/support",           iconColor: Colors.journeyAfter  },
      { label: "Find Providers",sub: "Find continuing care",     icon: "map-pin",      route: "/(tabs)/providers", iconColor: Colors.journeyBefore },
      { label: "Goals of Care",sub: "Review & update wishes",   icon: "star",         route: "/goals-of-care",    iconColor: Colors.journeyAfter  },
    ];
  }

  if (role === "caregiver") {
    if (stage === "before") return [
      { label: "Eligibility",    sub: "Check if your patient qualifies", icon: "clipboard",   route: "/evaluation",       iconColor: Colors.journeyBefore },
      { label: "Find Providers", sub: "Hospice programs in your area",   icon: "map-pin",     route: "/(tabs)/providers", iconColor: Colors.primary        },
      { label: "Situation Guide",sub: "Step-by-step for any situation",  icon: "book-open",   route: "/situation-finder", iconColor: Colors.primary        },
      { label: "Goals of Care",  sub: "Document the patient's wishes",   icon: "star",        route: "/goals-of-care",    iconColor: Colors.journeyAfter  },
    ];
    if (stage === "during") return [
      { label: "Symptom Log",     sub: "Track the patient's symptoms",  icon: "bar-chart-2",  route: "/symptom-tracker", iconColor: Colors.journeyBefore },
      { label: "Situation Guide", sub: "Step-by-step for any situation", icon: "book-open",   route: "/situation-finder", iconColor: Colors.primary        },
      { label: "Active Dying",    sub: "What to expect in final hours",  icon: "heart",       route: "/active-dying",     iconColor: Colors.journeyAfter  },
      { label: "Goals of Care",   sub: "Review & document care wishes",  icon: "star",        route: "/goals-of-care",    iconColor: Colors.journeyAfter  },
    ];
    // after
    return [
      { label: "Journal",       sub: "Process your caregiving journey", icon: "edit-3",        route: "/journal",          iconColor: Colors.primary        },
      { label: "Get Support",   sub: "Grief & bereavement resources",  icon: "message-circle", route: "/support",           iconColor: Colors.journeyAfter  },
      { label: "Find Providers",sub: "Find ongoing support services",  icon: "map-pin",       route: "/(tabs)/providers", iconColor: Colors.journeyBefore },
      { label: "Situation Guide",sub: "Browse guidance scenarios",     icon: "book-open",     route: "/situation-finder", iconColor: Colors.primary        },
    ];
  }

  // role === "other"
  if (stage === "before") return [
    { label: "Journey Guide",   sub: "Understand the hospice process", icon: "compass",     route: "/(tabs)/journey",   iconColor: Colors.journeyBefore },
    { label: "Eligibility",     sub: "What qualifies for hospice",     icon: "clipboard",   route: "/evaluation",       iconColor: Colors.journeyBefore },
    { label: "Find Providers",  sub: "Hospice programs near you",      icon: "map-pin",     route: "/(tabs)/providers", iconColor: Colors.primary        },
    { label: "Situation Guide", sub: "Browse 60+ guidance scenarios",  icon: "book-open",   route: "/situation-finder", iconColor: Colors.primary        },
  ];
  if (stage === "during") return [
    { label: "Journey Guide",   sub: "Navigate the hospice journey",  icon: "compass",     route: "/(tabs)/journey",   iconColor: Colors.journeyBefore },
    { label: "Situation Guide", sub: "Browse 60+ guidance scenarios", icon: "book-open",   route: "/situation-finder", iconColor: Colors.primary        },
    { label: "Find Providers",  sub: "Hospice providers near you",    icon: "map-pin",     route: "/(tabs)/providers", iconColor: Colors.primary        },
    { label: "Goals of Care",   sub: "Understand care preferences",   icon: "star",        route: "/goals-of-care",    iconColor: Colors.journeyAfter  },
  ];
  return [
    { label: "Journey Guide",  sub: "Understand what comes next",    icon: "compass",       route: "/(tabs)/journey",   iconColor: Colors.journeyBefore },
    { label: "Get Support",    sub: "Grief & bereavement resources", icon: "message-circle", route: "/support",           iconColor: Colors.journeyAfter  },
    { label: "Find Providers", sub: "Find ongoing care services",    icon: "map-pin",       route: "/(tabs)/providers", iconColor: Colors.primary        },
    { label: "Situation Guide",sub: "Browse guidance scenarios",     icon: "book-open",     route: "/situation-finder", iconColor: Colors.primary        },
  ];
}

// ─── Role-specific Ragna subtitle ────────────────────────────────────────────
function getRagnaTagline(role: string, stage: JourneyStage): string {
  if (role === "patient") {
    if (stage === "before") return "Ask anything — symptoms, what hospice means, what to expect";
    if (stage === "during") return "Here with you any time — day or night";
    return "Here to listen and help as you move forward";
  }
  if (role === "caregiver") {
    if (stage === "before") return "Get clear answers about eligibility, planning & what's ahead";
    if (stage === "during") return "Get help with what's happening right now";
    return "Support for grief, next steps & your own wellbeing";
  }
  return "Your guide through every stage of hospice";
}

function formatReminderTime(dt: string): string {
  try {
    const d = new Date(dt);
    return d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch { return dt; }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { entries } = useJournal();
  const { reminders } = useReminders();

  const role  = user?.role ?? "other";
  const stage = user?.journeyStage ?? "during";
  const stageMeta = STAGE_META[stage];
  const tools = getRoleTools(role, stage);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName = (() => {
    if (role === "caregiver") {
      const name = user?.patientProfile?.patientName?.trim();
      if (name) return `Supporting ${name}`;
      return "Caregiver";
    }
    if (role === "patient") return "Patient";
    return "Welcome";
  })();

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
          <Image
            source={require("@/assets/images/app-icon.png")}
            style={styles.appIcon}
            resizeMode="cover"
          />
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => router.push("/(tabs)/more")}
            style={({ pressed }) => [styles.stagePill, { backgroundColor: stageMeta.bg }, pressed && { opacity: 0.75 }]}
          >
            <View style={[styles.stagePillDot, { backgroundColor: stageMeta.color }]} />
            <Text style={[styles.stagePillText, { color: stageMeta.color }]}>{stageMeta.label}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/more")}
            style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.6 }]}
          >
            <Feather name="settings" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* ── Ragna hero card ── */}
      <Pressable
        onPress={() => tap("/(tabs)/help")}
        style={({ pressed }) => [styles.ragnaCard, pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] }]}
      >
        <Image
          source={require("@/assets/images/ragna-icon.png")}
          style={styles.ragnaPortrait}
          resizeMode="cover"
        />
        <View style={styles.ragnaText}>
          <Text style={styles.ragnaTitle}>Ask Ragna</Text>
          <Text style={styles.ragnaSub}>{getRagnaTagline(role, stage)}</Text>
        </View>
        <View style={styles.ragnaCaret}>
          <Feather name="chevron-right" size={18} color={Colors.primary} />
        </View>
      </Pressable>

      {/* ── Role-specific tools ── */}
      <View>
        <Text style={styles.sectionTitle}>
          {role === "patient" ? "Your tools" : role === "caregiver" ? "Care tools" : "Explore"}
        </Text>
        <View style={styles.toolGrid}>
          {tools.map((t) => (
            <Pressable
              key={t.label}
              onPress={() => tap(t.route)}
              style={({ pressed }) => [styles.toolCard, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            >
              <View style={[styles.toolIconWrap, { backgroundColor: t.iconColor + "22" }]}>
                <Feather name={t.icon as any} size={18} color={t.iconColor} />
              </View>
              <View style={styles.toolTextWrap}>
                <Text style={styles.toolLabel}>{t.label}</Text>
                <Text style={styles.toolSub} numberOfLines={2}>{t.sub}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Activity snapshot ── */}
      {hasActivity && (
        <View>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.activityCol}>
            {nextReminder && (
              <Pressable
                onPress={() => tap("/reminders")}
                style={({ pressed }) => [styles.activityRow, pressed && { opacity: 0.88 }]}
              >
                <View style={[styles.activityIcon, { backgroundColor: Colors.primaryPale }]}>
                  <Feather name="bell" size={15} color={Colors.primary} />
                </View>
                <View style={styles.activityText}>
                  <Text style={styles.activityMeta}>Next reminder</Text>
                  <Text style={styles.activityTitle} numberOfLines={1}>{nextReminder.label}</Text>
                  <Text style={styles.activityTime}>{formatReminderTime(nextReminder.datetime)}</Text>
                </View>
                <Feather name="chevron-right" size={14} color={Colors.textSubtle} />
              </Pressable>
            )}
            {lastEntry && (() => {
              const meta = JOURNAL_TYPE_META[lastEntry.type];
              return (
                <Pressable
                  onPress={() => tap("/journal")}
                  style={({ pressed }) => [styles.activityRow, pressed && { opacity: 0.88 }]}
                >
                  <View style={[styles.activityIcon, { backgroundColor: meta.bg }]}>
                    <Feather name={meta.icon as any} size={15} color={meta.color} />
                  </View>
                  <View style={styles.activityText}>
                    <Text style={styles.activityMeta}>Latest journal entry</Text>
                    <Text style={styles.activityTitle} numberOfLines={1}>{lastEntry.title}</Text>
                    <Text style={styles.activityTime}>{lastEntry.date}</Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={Colors.textSubtle} />
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
          style={({ pressed }) => [styles.journeyCard, { borderLeftColor: stageMeta.color }, pressed && { opacity: 0.88 }]}
        >
          <View style={[styles.journeyIconWrap, { backgroundColor: stageMeta.color + "20" }]}>
            <Feather name={stageMeta.icon as any} size={20} color={stageMeta.color} />
          </View>
          <View style={styles.journeyText}>
            <Text style={[styles.journeyStage, { color: stageMeta.color }]}>{stageMeta.label}</Text>
            <Text style={styles.journeyDesc}>{stageMeta.desc}</Text>
            <Text style={styles.journeyLink}>Open Journey Navigator →</Text>
          </View>
          <Feather name="chevron-right" size={15} color={Colors.textSubtle} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { paddingHorizontal: 20, gap: 24 },

  // Header
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  appIcon:     { width: 36, height: 36, borderRadius: 10 },
  greeting:    { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  displayName: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  stagePill:   { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  stagePillDot:{ width: 7, height: 7, borderRadius: 4 },
  stagePillText:{ fontSize: 11, fontFamily: "Inter_600SemiBold" },
  settingsBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surfaceMid, alignItems: "center", justifyContent: "center" },

  // Ragna hero
  ragnaCard: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.primary + "35",
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  ragnaPortrait: { width: 52, height: 52, borderRadius: 14, flexShrink: 0 },
  ragnaText:     { flex: 1, gap: 3 },
  ragnaTitle:    { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.3 },
  ragnaSub:      { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 18 },
  ragnaCaret:    { width: 32, height: 32, borderRadius: 9, backgroundColor: Colors.primary + "18", alignItems: "center", justifyContent: "center" },

  // Section title
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.3, marginBottom: 12 },

  // Tool grid — 2 columns, each card has icon + label + subtitle
  toolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  toolCard: {
    width: "47.5%",
    backgroundColor: Colors.surfaceMid,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  toolIconWrap: { width: 40, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  toolTextWrap: { gap: 3 },
  toolLabel:    { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.2 },
  toolSub:      { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, lineHeight: 15 },

  // Activity
  activityCol:  { gap: 8 },
  activityRow:  { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 13, borderWidth: 1, borderColor: Colors.divider },
  activityIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  activityText: { flex: 1, gap: 1 },
  activityMeta: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: Colors.textSubtle, textTransform: "uppercase", letterSpacing: 0.4 },
  activityTitle:{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, letterSpacing: -0.1 },
  activityTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },

  // Journey card
  journeyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.surfaceMid,
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderLeftWidth: 3,
  },
  journeyIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  journeyText:     { flex: 1, gap: 3 },
  journeyStage:    { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  journeyDesc:     { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 17 },
  journeyLink:     { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.primary, marginTop: 2 },
});
