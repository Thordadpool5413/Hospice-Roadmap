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

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

// ─── Role × Content Config ───────────────────────────────────────────────────

type ActionItem = {
  label: string;
  icon: string;
  route: string;
  color: string;
};
type ResourceItem = {
  label: string;
  sub: string;
  icon: string;
  route: string;
  color: string;
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
    heroSubtitle: "Get step by step help for what is happening right now",
    keyActions: [
      { label: "Symptom Log",   icon: "plus-square",  route: "/symptom-tracker", color: Colors.accentSymptom    },
      { label: "Journal",       icon: "edit-3",        route: "/journal",          color: Colors.accentJournal    },
      { label: "Goals of Care", icon: "heart",         route: "/goals-of-care",    color: Colors.accentGoals      },
      { label: "Reminders",     icon: "bell",          route: "/reminders",        color: Colors.accentReminders  },
    ],
    resources: [
      { label: "Situation Guide", sub: "What do I do now?",           icon: "book-open", route: "/situation-finder", color: Colors.accentSituation  },
      { label: "Care Wishes",     sub: "Review & document care wishes", icon: "heart",    route: "/goals-of-care",    color: Colors.accentCareWishes },
    ],
  },
  patient: {
    title: "Patient Home",
    contextLine: () => "Your care and comfort today",
    heroTitle: "How are you feeling right now?",
    heroSubtitle: "Get step by step help for symptoms, comfort, and next steps",
    keyActions: [
      { label: "Symptom Log",  icon: "plus-square", route: "/symptom-tracker", color: Colors.accentSymptom   },
      { label: "Journal",      icon: "edit-3",       route: "/journal",          color: Colors.accentJournal   },
      { label: "Care Wishes",  icon: "heart",        route: "/goals-of-care",    color: Colors.accentCareWishes},
      { label: "Reminders",    icon: "bell",         route: "/reminders",        color: Colors.accentReminders },
    ],
    resources: [
      { label: "Situation Guide", sub: "What do I do now?",      icon: "book-open", route: "/situation-finder", color: Colors.accentSituation },
      { label: "Goals of Care",   sub: "Review what matters most", icon: "star",    route: "/goals-of-care",    color: Colors.accentGoals     },
    ],
  },
  other: {
    title: "Support Home",
    contextLine: () => "Helping someone through hospice",
    heroTitle: "What do you need help with today?",
    heroSubtitle: "Get step by step help, guidance, and next steps",
    keyActions: [
      { label: "Journal",         icon: "edit-3",     route: "/journal",          color: Colors.accentJournal   },
      { label: "Goals of Care",   icon: "heart",      route: "/goals-of-care",    color: Colors.accentGoals     },
      { label: "Reminders",       icon: "bell",       route: "/reminders",        color: Colors.accentReminders },
      { label: "Situation Guide", icon: "book-open",  route: "/situation-finder", color: Colors.accentSituation },
    ],
    resources: [
      { label: "Care Wishes",  sub: "Review & document care wishes", icon: "heart",       route: "/goals-of-care",    color: Colors.accentCareWishes },
      { label: "Symptom Log",  sub: "Track important changes",       icon: "bar-chart-2", route: "/symptom-tracker",  color: Colors.accentSymptom    },
    ],
  },
};

// ─── Shared Card Components ───────────────────────────────────────────────────

function HeroRagnaCard({ title, subtitle, onPress }: {
  title: string; subtitle: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.93, transform: [{ scale: 0.988 }] }]}
    >
      <View style={hero.outer}>
        {/* Glow border layer */}
        <View style={hero.glowBorder} />
        <View style={hero.inner}>
          <Text style={hero.question}>{title}</Text>

          {/* Ask Ragna CTA row */}
          <LinearGradient
            colors={["#1C3378", "#2E2870"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={hero.ctaRow}
          >
            <Image
              source={require("@/assets/images/ragna-icon.png")}
              style={hero.ragnaAvatar}
              resizeMode="cover"
            />
            <Text style={hero.ctaLabel}>Ask Ragna</Text>
            <View style={hero.chevronWrap}>
              <Feather name="chevron-right" size={17} color="#fff" />
            </View>
          </LinearGradient>

          <Text style={hero.subtitle}>{subtitle}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const hero = StyleSheet.create({
  outer: {
    borderRadius: 18,
    padding: 2,
    shadowColor: "#58C8FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#58C8FF",
    opacity: 0.65,
  },
  inner: {
    backgroundColor: "rgba(20, 40, 88, 0.92)",
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  question: {
    fontSize: 21,
    fontFamily: "Inter_700Bold",
    color: "#F3F6FF",
    letterSpacing: -0.4,
    lineHeight: 27,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "rgba(130, 190, 255, 0.20)",
  },
  ragnaAvatar: { width: 38, height: 38, borderRadius: 10, flexShrink: 0 },
  ctaLabel: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold", color: "#F3F6FF", letterSpacing: -0.2 },
  chevronWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#8F9AB8", lineHeight: 18 },
});

function ActionCard({ item, onPress }: { item: ActionItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        ac.card,
        pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
      ]}
    >
      <View style={[ac.iconWrap, { backgroundColor: item.color + "22" }]}>
        <Feather name={item.icon as any} size={20} color={item.color} />
      </View>
      <Text style={ac.label}>{item.label}</Text>
      <Feather name="chevron-right" size={13} color={Colors.textSubtle} style={ac.caret} />
    </Pressable>
  );
}
const ac = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "rgba(22, 39, 84, 0.88)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(130, 190, 255, 0.18)",
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#F3F6FF", letterSpacing: -0.2, flex: 1 },
  caret: { alignSelf: "flex-end" },
});

function ResourceCard({ item, onPress }: { item: ResourceItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        rc.card,
        pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={[rc.iconWrap, { backgroundColor: item.color + "22" }]}>
        <Feather name={item.icon as any} size={18} color={item.color} />
      </View>
      <Text style={rc.label}>{item.label}</Text>
      <Text style={rc.sub} numberOfLines={2}>{item.sub}</Text>
    </Pressable>
  );
}
const rc = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "rgba(22, 39, 84, 0.84)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(109, 146, 219, 0.28)",
    padding: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#F3F6FF", letterSpacing: -0.2 },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#8F9AB8", lineHeight: 16 },
});

function JourneyCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        jc.card,
        pressed && { opacity: 0.88 },
      ]}
    >
      <View style={jc.iconWrap}>
        <Feather name="navigation" size={20} color={Colors.accentJourney} />
      </View>
      <View style={jc.textWrap}>
        <Text style={jc.title}>During Hospice</Text>
        <Text style={jc.sub}>Journey Guide →</Text>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textSubtle} />
    </Pressable>
  );
}
const jc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(21, 40, 86, 0.88)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(120, 170, 255, 0.24)",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.accentJourney + "20",
    alignItems: "center", justifyContent: "center",
  },
  textWrap: { flex: 1 },
  title: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#F3F6FF", letterSpacing: -0.2 },
  sub: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.accentJourney, marginTop: 2 },
});

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();

  const role  = user?.role ?? "other";
  const config = useMemo(() => ROLE_CONFIG[role] ?? ROLE_CONFIG.other, [role]);
  const patientName = user?.patientProfile?.patientName?.trim();
  const contextLine = config.contextLine(patientName);

  const tap = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <ScrollView
      style={sc.container}
      contentContainerStyle={[
        sc.content,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 18), paddingBottom: insets.bottom + 110 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Background ambient glow ── */}
      <View style={sc.ambientGlow} pointerEvents="none" />

      {/* ── Header ── */}
      <View style={sc.header}>
        <View style={sc.headerLeft}>
          <Text style={sc.pageTitle}>{config.title}</Text>
          {/* Stage pill */}
          <View style={sc.stagePill}>
            <View style={sc.stageDot} />
            <Text style={sc.stagePillText}>During Hospice</Text>
          </View>
          <Text style={sc.contextLine}>{contextLine}</Text>
        </View>
        <Pressable
          onPress={() => tap("/(tabs)/more")}
          style={({ pressed }) => [sc.settingsBtn, pressed && { opacity: 0.65 }]}
        >
          <Feather name="settings" size={20} color={Colors.textSecondary} />
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
        <Text style={sc.sectionTitle}>Key Actions</Text>
        <View style={sc.actionGrid}>
          {config.keyActions.map((item) => (
            <ActionCard key={item.label} item={item} onPress={() => tap(item.route)} />
          ))}
        </View>
      </View>

      {/* ── Helpful Resources ── */}
      <View style={sc.section}>
        <Text style={sc.sectionTitle}>Helpful Resources</Text>
        <View style={sc.resourceRow}>
          {config.resources.map((item) => (
            <ResourceCard key={item.label} item={item} onPress={() => tap(item.route)} />
          ))}
        </View>
      </View>

      {/* ── Journey card ── */}
      <JourneyCard onPress={() => tap("/(tabs)/journey")} />

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sc = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { paddingHorizontal: 20, gap: 22 },

  // Ambient background glow
  ambientGlow: {
    position: "absolute",
    top: -80, left: -60, right: -60,
    height: 320,
    borderRadius: 200,
    backgroundColor: "rgba(40, 100, 200, 0.07)",
    transform: [{ scaleX: 1.4 }],
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerLeft: { flex: 1, gap: 6 },
  pageTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#F3F6FF",
    letterSpacing: -0.5,
  },

  // Stage pill — fixed warm rose
  stagePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.stagePillBg,
    alignSelf: "flex-start",
  },
  stageDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: Colors.stagePillDot,
  },
  stagePillText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.stagePillText,
  },

  contextLine: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  settingsBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceMid,
    borderWidth: 1, borderColor: Colors.divider,
    alignItems: "center", justifyContent: "center",
    marginTop: 4,
  },

  // Sections
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#F3F6FF",
    letterSpacing: -0.3,
  },

  // Key actions grid — 2×2
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  // Resources row — 2 equal cards
  resourceRow: {
    flexDirection: "row",
    gap: 10,
  },
});
