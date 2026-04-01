import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
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

import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

// ─── Role config ──────────────────────────────────────────────────────────────

type ActionItem = {
  label: string; icon: string; route: string;
  color: string; accent?: string;
};
type ResourceItem = {
  label: string; sub: string; icon: string; route: string; color: string;
};
type RoleConfig = {
  title: string;
  contextLine: (patientName?: string) => string;
  heroTitle: string;
  heroSubtitle: string;
  keyActions: ActionItem[];
  resources: ResourceItem[];
};

const ROLE_CONFIG: Record<string, RoleConfig> = {
  caregiver: {
    title: "Caregiver Home",
    contextLine: (n) => n ? `Supporting ${n} today` : "Supporting your loved one today",
    heroTitle: "What is happening right now?",
    heroSubtitle: "Get step-by-step help for any situation",
    keyActions: [
      { label: "Symptom Log",   icon: "activity",  route: "/symptom-tracker", color: Colors.accentSymptom },
      { label: "Journal",       icon: "edit-3",     route: "/journal",          color: Colors.accentJournal },
      { label: "Goals of Care", icon: "heart",      route: "/goals-of-care",    color: Colors.accentGoals },
      { label: "Reminders",     icon: "bell",       route: "/reminders",        color: Colors.accentReminders },
    ],
    resources: [
      { label: "Situation Guide", sub: "What do I do now?",            icon: "compass",   route: "/situation-finder", color: Colors.accentSituation  },
      { label: "Care Wishes",     sub: "Review & document care wishes", icon: "star",      route: "/goals-of-care",    color: Colors.accentCareWishes },
    ],
  },
  patient: {
    title: "Your Care Today",
    contextLine: () => "Your care and comfort today",
    heroTitle: "How are you feeling right now?",
    heroSubtitle: "Get help, answers, and next steps",
    keyActions: [
      { label: "Symptom Log",  icon: "activity",  route: "/symptom-tracker", color: Colors.accentSymptom },
      { label: "Journal",      icon: "edit-3",     route: "/journal",          color: Colors.accentJournal },
      { label: "Care Wishes",  icon: "heart",      route: "/goals-of-care",    color: Colors.accentCareWishes },
      { label: "Reminders",    icon: "bell",       route: "/reminders",        color: Colors.accentReminders },
    ],
    resources: [
      { label: "Situation Guide", sub: "What do I do now?",      icon: "compass", route: "/situation-finder", color: Colors.accentSituation },
      { label: "Goals of Care",   sub: "Review what matters most", icon: "star",  route: "/goals-of-care",    color: Colors.accentGoals     },
    ],
  },
  other: {
    title: "Hospice Support",
    contextLine: () => "Helping someone through hospice",
    heroTitle: "What do you need help with today?",
    heroSubtitle: "Guidance, answers, and next steps",
    keyActions: [
      { label: "Journal",         icon: "edit-3",    route: "/journal",          color: Colors.accentJournal },
      { label: "Goals of Care",   icon: "heart",     route: "/goals-of-care",    color: Colors.accentGoals },
      { label: "Reminders",       icon: "bell",      route: "/reminders",        color: Colors.accentReminders },
      { label: "Situation Guide", icon: "compass",   route: "/situation-finder", color: Colors.accentSituation },
    ],
    resources: [
      { label: "Care Wishes",  sub: "Review & document care wishes", icon: "heart",     route: "/goals-of-care",   color: Colors.accentCareWishes },
      { label: "Symptom Log",  sub: "Track important changes",       icon: "activity",  route: "/symptom-tracker", color: Colors.accentSymptom    },
    ],
  },
};

// ─── Quick Action Card ────────────────────────────────────────────────────────

function ActionCard({ item, onPress }: { item: ActionItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        ac.card,
        pressed && { opacity: 0.80, transform: [{ scale: 0.94 }] },
      ]}
    >
      <LinearGradient
        colors={[item.color + "22", item.color + "08"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={ac.gradient}
      />
      <View style={[ac.iconWrap, { backgroundColor: item.color + "30" }]}>
        <Feather name={item.icon as any} size={19} color={item.color} />
      </View>
      <Text style={ac.label} numberOfLines={1}>{item.label}</Text>
      <Feather name="chevron-right" size={13} color={item.color + "90"} style={{ marginTop: 2 }} />
    </Pressable>
  );
}
const ac = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(80, 120, 210, 0.18)",
    padding: 13,
    gap: 9,
    overflow: "hidden",
    backgroundColor: "rgba(14, 24, 62, 0.85)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#E8F0FF",
    letterSpacing: -0.15,
    lineHeight: 18,
  },
});

// ─── Resource Card ─────────────────────────────────────────────────────────────

function ResourceCard({ item, onPress }: { item: ResourceItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        rc.card,
        pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={[rc.iconWrap, { backgroundColor: item.color + "25" }]}>
        <Feather name={item.icon as any} size={18} color={item.color} />
      </View>
      <View style={rc.textWrap}>
        <Text style={rc.label}>{item.label}</Text>
        <Text style={rc.sub} numberOfLines={2}>{item.sub}</Text>
      </View>
      <Feather name="arrow-right" size={16} color={item.color + "80"} />
    </Pressable>
  );
}
const rc = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(14, 22, 58, 0.85)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(70, 110, 210, 0.20)",
    paddingHorizontal: 14,
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: { flex: 1, gap: 2 },
  label: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#E8F0FF", letterSpacing: -0.2 },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7A8EB8", lineHeight: 17 },
});

// ─── Journey Card ─────────────────────────────────────────────────────────────

function JourneyCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [jc.card, pressed && { opacity: 0.84, transform: [{ scale: 0.98 }] }]}
    >
      <LinearGradient
        colors={["rgba(88, 182, 255, 0.12)", "rgba(88, 182, 255, 0.04)"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={jc.left}>
        <View style={jc.iconWrap}>
          <Feather name="map" size={20} color={Colors.accentJourney} />
        </View>
        <View style={jc.textWrap}>
          <Text style={jc.label}>During Hospice</Text>
          <Text style={jc.sub}>Journey Guide & Stage Planner</Text>
        </View>
      </View>
      <View style={jc.chevronWrap}>
        <Feather name="chevron-right" size={18} color={Colors.accentJourney} />
      </View>
    </Pressable>
  );
}
const jc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(12, 22, 62, 0.88)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(88, 182, 255, 0.22)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    overflow: "hidden",
    shadowColor: "#2060C0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 5,
  },
  left: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: Colors.accentJourney + "20",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: { flex: 1, gap: 3 },
  label: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#E8F0FF", letterSpacing: -0.25 },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.accentJourney + "CC", lineHeight: 17 },
  chevronWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.accentJourney + "18",
    alignItems: "center", justifyContent: "center",
  },
});

// ─── Hero Ragna Card ──────────────────────────────────────────────────────────

function HeroRagnaCard({ title, subtitle, onPress }: {
  title: string; subtitle: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] }]}
    >
      {/* Outer glow ring */}
      <View style={hero.glowRing} />
      <View style={hero.card}>
        {/* Background gradient */}
        <LinearGradient
          colors={["rgba(16, 28, 80, 0.96)", "rgba(12, 20, 68, 0.98)"]}
          style={StyleSheet.absoluteFill}
        />

        {/* Title */}
        <Text style={hero.question}>{title}</Text>

        {/* Ask Ragna CTA */}
        <LinearGradient
          colors={["rgba(28, 48, 110, 0.95)", "rgba(22, 36, 95, 0.98)", "rgba(34, 24, 90, 0.95)"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={hero.ctaRow}
        >
          <Image
            source={require("@/assets/images/ragna-icon.png")}
            style={hero.avatar}
            resizeMode="cover"
          />
          <View style={hero.ctaTextWrap}>
            <Text style={hero.ctaLabel}>Ask Ragna</Text>
            <Text style={hero.ctaHint}>AI guide · always here</Text>
          </View>
          <View style={hero.ctaArrow}>
            <Feather name="arrow-right" size={16} color="#A0C8FF" />
          </View>
        </LinearGradient>

        {/* Subtitle */}
        <Text style={hero.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}
const hero = StyleSheet.create({
  glowRing: {
    position: "absolute",
    inset: -1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(70, 180, 255, 0.50)",
    shadowColor: "#50C0FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.50,
    shadowRadius: 16,
    elevation: 0,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(70, 150, 240, 0.15)",
    overflow: "hidden",
    shadowColor: "#1040A0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.50,
    shadowRadius: 20,
    elevation: 10,
  },
  question: {
    fontSize: 21,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "rgba(100, 150, 255, 0.22)",
  },
  avatar: {
    width: 44, height: 44,
    borderRadius: 12,
    flexShrink: 0,
  },
  ctaTextWrap: { flex: 1, gap: 2 },
  ctaLabel: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.3,
  },
  ctaHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#7A96CC",
    letterSpacing: 0.1,
  },
  ctaArrow: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center", justifyContent: "center",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#6A80AE",
    lineHeight: 19,
  },
});

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={sh.row}>
      <Text style={sh.title}>{title}</Text>
      <View style={sh.line} />
    </View>
  );
}
const sh = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#4A6090",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    flexShrink: 0,
  },
  line: { flex: 1, height: 1, backgroundColor: "rgba(60, 90, 160, 0.25)" },
});

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();

  const role   = user?.role ?? "other";
  const config = useMemo(() => ROLE_CONFIG[role] ?? ROLE_CONFIG.other, [role]);
  const patientName = user?.patientProfile?.patientName?.trim();
  const contextLine = config.contextLine(patientName);

  const tap = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const rows: [ActionItem, ActionItem][] = [
    [config.keyActions[0], config.keyActions[1]],
    [config.keyActions[2], config.keyActions[3]],
  ];

  return (
    <View style={sc.root}>
      <CosmicBackground />
      <ScrollView
        style={sc.scroll}
        contentContainerStyle={[
          sc.content,
          { paddingTop: insets.top + (Platform.OS === "web" ? 72 : 22), paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={sc.header}>
          <View style={sc.headerLeft}>
            <View style={sc.stagePill}>
              <View style={sc.stageDot} />
              <Text style={sc.stagePillText}>During Hospice</Text>
            </View>
            <Text style={sc.pageTitle}>{config.title}</Text>
            <Text style={sc.contextLine}>{contextLine}</Text>
          </View>
          <Pressable
            onPress={() => tap("/(tabs)/more")}
            style={({ pressed }) => [sc.settingsBtn, pressed && { opacity: 0.55, transform: [{ scale: 0.9 }] }]}
          >
            <Feather name="settings" size={19} color="rgba(150, 175, 230, 0.75)" />
          </Pressable>
        </View>

        {/* ── Hero ── */}
        <HeroRagnaCard
          title={config.heroTitle}
          subtitle={config.heroSubtitle}
          onPress={() => tap("/(tabs)/help")}
        />

        {/* ── Key Actions ── */}
        <View style={sc.section}>
          <SectionHeader title="Quick Actions" />
          <View style={sc.actionGrid}>
            {rows.map((row, ri) => (
              <View key={ri} style={sc.actionRow}>
                <ActionCard item={row[0]} onPress={() => tap(row[0].route)} />
                <ActionCard item={row[1]} onPress={() => tap(row[1].route)} />
              </View>
            ))}
          </View>
        </View>

        {/* ── Helpful Resources ── */}
        <View style={sc.section}>
          <SectionHeader title="Resources" />
          <View style={sc.resourceCol}>
            {config.resources.map((item) => (
              <ResourceCard key={item.label} item={item} onPress={() => tap(item.route)} />
            ))}
          </View>
        </View>

        {/* ── Journey card ── */}
        <JourneyCard onPress={() => tap("/(tabs)/journey")} />

      </ScrollView>
    </View>
  );
}

const sc = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#030A18" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 24 },

  header:      { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  headerLeft:  { flex: 1, gap: 6 },

  stagePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(76, 42, 57, 0.80)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(240, 154, 122, 0.25)",
  },
  stageDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: "#FF8B68",
  },
  stagePillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#F09A7A",
    letterSpacing: 0.2,
  },

  pageTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.7,
    lineHeight: 34,
  },
  contextLine: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#6880A8",
    lineHeight: 20,
  },

  settingsBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(80, 110, 180, 0.18)",
    marginTop: 8,
  },

  section: { gap: 12 },
  actionGrid: { gap: 10 },
  actionRow: { flexDirection: "row", gap: 10 },
  resourceCol: { gap: 10 },
});
