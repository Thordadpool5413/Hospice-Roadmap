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

// ─── Star field data ──────────────────────────────────────────────────────────

const STARS: Array<{ top: string; left: string; size: number; opacity: number }> = [
  // Upper sky — dense
  { top: "2%",  left: "5%",  size: 1.5, opacity: 0.80 },
  { top: "1%",  left: "18%", size: 1,   opacity: 0.55 },
  { top: "4%",  left: "32%", size: 2,   opacity: 0.85 },
  { top: "2%",  left: "48%", size: 1,   opacity: 0.50 },
  { top: "3%",  left: "62%", size: 1.5, opacity: 0.65 },
  { top: "1%",  left: "78%", size: 2,   opacity: 0.90 },
  { top: "5%",  left: "90%", size: 1,   opacity: 0.45 },
  { top: "7%",  left: "12%", size: 1,   opacity: 0.60 },
  { top: "8%",  left: "27%", size: 1.5, opacity: 0.75 },
  { top: "6%",  left: "55%", size: 1,   opacity: 0.50 },
  { top: "9%",  left: "70%", size: 2,   opacity: 0.70 },
  { top: "7%",  left: "85%", size: 1.5, opacity: 0.60 },
  // Upper-mid
  { top: "12%", left: "3%",  size: 1.5, opacity: 0.65 },
  { top: "11%", left: "22%", size: 1,   opacity: 0.45 },
  { top: "14%", left: "42%", size: 2,   opacity: 0.80 },
  { top: "10%", left: "60%", size: 1,   opacity: 0.55 },
  { top: "13%", left: "75%", size: 1.5, opacity: 0.85 },
  { top: "15%", left: "92%", size: 1,   opacity: 0.40 },
  { top: "18%", left: "8%",  size: 1,   opacity: 0.60 },
  { top: "17%", left: "30%", size: 1.5, opacity: 0.50 },
  { top: "19%", left: "50%", size: 2,   opacity: 0.75 },
  { top: "16%", left: "68%", size: 1,   opacity: 0.85 },
  { top: "20%", left: "83%", size: 1.5, opacity: 0.45 },
  // Around golden streak — sparser (it's bright there)
  { top: "24%", left: "14%", size: 1,   opacity: 0.35 },
  { top: "22%", left: "38%", size: 1.5, opacity: 0.45 },
  { top: "26%", left: "58%", size: 1,   opacity: 0.30 },
  { top: "23%", left: "79%", size: 2,   opacity: 0.40 },
  // Below mid — moderate density
  { top: "32%", left: "6%",  size: 1.5, opacity: 0.55 },
  { top: "30%", left: "25%", size: 1,   opacity: 0.45 },
  { top: "35%", left: "47%", size: 2,   opacity: 0.65 },
  { top: "31%", left: "66%", size: 1,   opacity: 0.70 },
  { top: "34%", left: "88%", size: 1.5, opacity: 0.50 },
  { top: "38%", left: "15%", size: 1,   opacity: 0.55 },
  { top: "40%", left: "40%", size: 1.5, opacity: 0.60 },
  { top: "37%", left: "62%", size: 1,   opacity: 0.45 },
  { top: "42%", left: "80%", size: 2,   opacity: 0.65 },
  // Lower
  { top: "46%", left: "4%",  size: 1,   opacity: 0.50 },
  { top: "48%", left: "28%", size: 1.5, opacity: 0.55 },
  { top: "50%", left: "52%", size: 1,   opacity: 0.70 },
  { top: "47%", left: "74%", size: 2,   opacity: 0.60 },
  { top: "54%", left: "16%", size: 1.5, opacity: 0.45 },
  { top: "56%", left: "42%", size: 1,   opacity: 0.65 },
  { top: "58%", left: "70%", size: 1.5, opacity: 0.55 },
  { top: "62%", left: "8%",  size: 1,   opacity: 0.40 },
  { top: "65%", left: "48%", size: 2,   opacity: 0.50 },
  { top: "68%", left: "84%", size: 1,   opacity: 0.45 },
];

// ─── Cosmic Background ────────────────────────────────────────────────────────

function CosmicBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">

      {/* ── 1. Deep space base ── */}
      <LinearGradient
        colors={["#060010", "#080018", "#070A22", "#060C1E"]}
        locations={[0, 0.25, 0.60, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── 2. Blue-violet upper nebula (large, centered upper area) ── */}
      <View style={bg.nebulaCenterTop} />

      {/* ── 3. Blue glow - upper left spread ── */}
      <View style={bg.nebulaLeftBlue} />

      {/* ── 4. Golden point source - upper right ── */}
      <View style={bg.goldenPoint} />
      <View style={bg.goldenPointCore} />

      {/* ── 5. GOLDEN HORIZONTAL STREAK — key visual element ── */}
      {/* Wide soft glow band — vertical gradient makes it a diffuse horizontal bar */}
      <LinearGradient
        colors={["transparent", "rgba(210, 125, 18, 0.30)", "rgba(235, 155, 25, 0.26)", "rgba(210, 125, 18, 0.30)", "transparent"]}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={bg.goldenStreakV}
      />
      {/* Sharp bright centre line */}
      <LinearGradient
        colors={["transparent", "rgba(255, 165, 30, 0.55)", "rgba(255, 180, 40, 0.65)", "rgba(255, 165, 30, 0.55)", "transparent"]}
        locations={[0, 0.20, 0.50, 0.80, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={bg.goldenStreakH}
      />

      {/* ── 6. Stars ── */}
      {STARS.map((s, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: s.top as any,
            left: s.left as any,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: "#FFFFFF",
            opacity: s.opacity,
          }}
        />
      ))}

      {/* ── 7. Bottom fade for legibility ── */}
      <LinearGradient
        colors={["transparent", "rgba(5, 6, 18, 0.55)"]}
        style={bg.bottomFade}
      />
    </View>
  );
}

const bg = StyleSheet.create({
  // Large centered blue-violet nebula cloud (upper 40% of screen)
  nebulaCenterTop: {
    position: "absolute",
    top: -160, left: -100,
    width: 500, height: 500,
    borderRadius: 250,
    backgroundColor: "rgba(25, 55, 210, 0.20)",
    transform: [{ scaleX: 1.4 }, { scaleY: 0.9 }],
  },
  // Blue spread from upper left
  nebulaLeftBlue: {
    position: "absolute",
    top: 30, left: -60,
    width: 280, height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(30, 65, 195, 0.14)",
  },
  // Golden point light source — upper right quadrant (warm, diffuse)
  goldenPoint: {
    position: "absolute",
    top: -60, right: -80,
    width: 380, height: 380,
    borderRadius: 190,
    backgroundColor: "rgba(215, 130, 20, 0.11)",
    transform: [{ scaleX: 1.3 }, { scaleY: 0.85 }],
  },
  goldenPointCore: {
    position: "absolute",
    top: 15, right: 15,
    width: 160, height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(250, 165, 35, 0.10)",
  },
  // The golden horizontal streak — positioned just below hero card (~37% from top)
  goldenStreakH: {
    position: "absolute",
    top: "36%",
    left: 0, right: 0,
    height: 2,
  },
  goldenStreakV: {
    position: "absolute",
    top: "30%",
    left: 0, right: 0,
    height: 140,
  },
  bottomFade: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: 250,
  },
});

// ─── Role config ──────────────────────────────────────────────────────────────

type ActionItem = {
  label: string; icon: string; route: string;
  color: string; tint?: boolean;
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
    heroSubtitle: "Get step-by-step help for what is happening right now",
    keyActions: [
      { label: "Symptom Log",   icon: "plus-square", route: "/symptom-tracker", color: Colors.accentSymptom,   tint: false },
      { label: "Journal",       icon: "book-open",   route: "/journal",          color: Colors.accentJournal,   tint: true  },
      { label: "Goals of Care", icon: "heart",       route: "/goals-of-care",    color: Colors.accentGoals,     tint: false },
      { label: "Reminders",     icon: "bell",        route: "/reminders",        color: Colors.accentReminders, tint: false },
    ],
    resources: [
      { label: "Situation Guide", sub: "What do I do now?",            icon: "book-open", route: "/situation-finder", color: Colors.accentSituation  },
      { label: "Care Wishes",     sub: "Review & document care wishes", icon: "heart",     route: "/goals-of-care",    color: Colors.accentCareWishes },
    ],
  },
  patient: {
    title: "Patient Home",
    contextLine: () => "Your care and comfort today",
    heroTitle: "How are you feeling right now?",
    heroSubtitle: "Get step-by-step help for symptoms, comfort, and next steps",
    keyActions: [
      { label: "Symptom Log",  icon: "plus-square", route: "/symptom-tracker", color: Colors.accentSymptom,    tint: false },
      { label: "Journal",      icon: "book-open",   route: "/journal",          color: Colors.accentJournal,    tint: true  },
      { label: "Care Wishes",  icon: "heart",       route: "/goals-of-care",    color: Colors.accentCareWishes, tint: false },
      { label: "Reminders",    icon: "bell",        route: "/reminders",        color: Colors.accentReminders,  tint: false },
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
    heroSubtitle: "Get step-by-step help, guidance, and next steps",
    keyActions: [
      { label: "Journal",         icon: "book-open",  route: "/journal",          color: Colors.accentJournal,   tint: true  },
      { label: "Goals of Care",   icon: "heart",      route: "/goals-of-care",    color: Colors.accentGoals,     tint: false },
      { label: "Reminders",       icon: "bell",       route: "/reminders",        color: Colors.accentReminders, tint: false },
      { label: "Situation Guide", icon: "book-open",  route: "/situation-finder", color: Colors.accentSituation, tint: false },
    ],
    resources: [
      { label: "Care Wishes",  sub: "Review & document care wishes", icon: "heart",       route: "/goals-of-care",   color: Colors.accentCareWishes },
      { label: "Symptom Log",  sub: "Track important changes",       icon: "bar-chart-2", route: "/symptom-tracker", color: Colors.accentSymptom    },
    ],
  },
};

// ─── Action card (horizontal row) ─────────────────────────────────────────────

function ActionCard({ item, hasChevron, onPress }: {
  item: ActionItem; hasChevron: boolean; onPress: () => void;
}) {
  const cardBg = item.tint
    ? "rgba(65, 40, 8, 0.82)"   // amber/warm tint for Journal
    : "rgba(16, 30, 70, 0.80)"; // standard dark blue

  const cardBorder = item.tint
    ? `rgba(180, 120, 20, 0.35)` // amber border
    : "rgba(80, 120, 200, 0.22)"; // blue border

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        ac.card,
        { backgroundColor: cardBg, borderColor: cardBorder },
        pressed && { opacity: 0.82, transform: [{ scale: 0.96 }] },
      ]}
    >
      <View style={[ac.iconWrap, { backgroundColor: item.color + "28" }]}>
        <Feather name={item.icon as any} size={18} color={item.color} />
      </View>
      <Text style={[ac.label, item.tint && { color: "#F0C060" }]} numberOfLines={1}>{item.label}</Text>
      {hasChevron && (
        <Feather name="chevron-right" size={16} color={item.tint ? "rgba(200,150,50,0.7)" : "rgba(130,170,255,0.55)"} />
      )}
    </Pressable>
  );
}
const ac = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 13,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  iconWrap: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#E8EEFF",
    letterSpacing: -0.1,
  },
});

// ─── Resource card ─────────────────────────────────────────────────────────────

function ResourceCard({ item, onPress }: { item: ResourceItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        resc.card,
        pressed && { opacity: 0.84, transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={[resc.iconWrap, { backgroundColor: item.color + "22" }]}>
        <Feather name={item.icon as any} size={17} color={item.color} />
      </View>
      <Text style={resc.label}>{item.label}</Text>
      <Text style={resc.sub} numberOfLines={2}>{item.sub}</Text>
    </Pressable>
  );
}
const resc = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "rgba(16, 28, 70, 0.82)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(80, 120, 200, 0.22)",
    padding: 14,
    gap: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30,
    shadowRadius: 7,
    elevation: 4,
  },
  iconWrap: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#E8EEFF", letterSpacing: -0.2 },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#8F9AB8", lineHeight: 17 },
});

// ─── Journey card ─────────────────────────────────────────────────────────────

function JourneyCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [jc.card, pressed && { opacity: 0.86 }]}
    >
      <View style={jc.iconWrap}>
        <Feather name="navigation" size={20} color={Colors.accentJourney} />
      </View>
      <View style={jc.textWrap}>
        <Text style={jc.title}>During Hospice</Text>
        <Text style={jc.sub}>Journey Guide →</Text>
      </View>
      <Feather name="chevron-right" size={18} color="rgba(130,170,255,0.55)" />
    </Pressable>
  );
}
const jc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(15, 26, 68, 0.85)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(90, 140, 230, 0.28)",
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 4,
  },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.accentJourney + "20",
    alignItems: "center", justifyContent: "center",
  },
  textWrap: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#E8EEFF", letterSpacing: -0.2 },
  sub: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.accentJourney },
});

// ─── Hero Ragna card ──────────────────────────────────────────────────────────

function HeroRagnaCard({ title, subtitle, onPress }: {
  title: string; subtitle: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.93, transform: [{ scale: 0.988 }] }]}
    >
      {/* Glow ring */}
      <View style={hero.glowRing} />
      <View style={hero.card}>
        <Text style={hero.question}>{title}</Text>

        {/* Ask Ragna CTA — gradient row */}
        <LinearGradient
          colors={["#1A2E6A", "#232060", "#2A1A6A"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={hero.ctaRow}
        >
          <Image
            source={require("@/assets/images/ragna-icon.png")}
            style={hero.avatar}
            resizeMode="cover"
          />
          <Text style={hero.ctaText}>Ask Ragna</Text>
          <View style={hero.chevronBubble}>
            <Feather name="chevron-right" size={16} color="#A0C8FF" />
          </View>
        </LinearGradient>

        <Text style={hero.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}
const hero = StyleSheet.create({
  glowRing: {
    position: "absolute",
    inset: -1.5,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#4AACF0",
    shadowColor: "#58C8FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 0,
  },
  card: {
    backgroundColor: "rgba(12, 24, 70, 0.86)",
    borderRadius: 17,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(80, 160, 240, 0.20)",
    shadowColor: "#2060C0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 16,
    elevation: 8,
  },
  question: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#F0F4FF",
    letterSpacing: -0.4,
    lineHeight: 27,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(100, 140, 240, 0.25)",
  },
  avatar: { width: 40, height: 40, borderRadius: 10, flexShrink: 0 },
  ctaText: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", color: "#F0F4FF", letterSpacing: -0.3 },
  chevronBubble: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center", justifyContent: "center",
  },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#7A8EB8", lineHeight: 18 },
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

  // Action grid: 2 rows × 2 cols  →  [[0,1],[2,3]]
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
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 18), paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={sc.header}>
          <View style={sc.headerLeft}>
            <Text style={sc.pageTitle}>{config.title}</Text>
            <View style={sc.stagePill}>
              <View style={sc.stageDot} />
              <Text style={sc.stagePillText}>During Hospice</Text>
            </View>
            <Text style={sc.contextLine}>{contextLine}</Text>
          </View>
          <Pressable
            onPress={() => tap("/(tabs)/more")}
            style={({ pressed }) => [sc.settingsBtn, pressed && { opacity: 0.6 }]}
          >
            <Feather name="settings" size={20} color="rgba(170,190,230,0.80)" />
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
            {rows.map((row, ri) => (
              <View key={ri} style={sc.actionRow}>
                {/* left card — no chevron */}
                <ActionCard
                  item={row[0]}
                  hasChevron={false}
                  onPress={() => tap(row[0].route)}
                />
                {/* right card — has chevron */}
                <ActionCard
                  item={row[1]}
                  hasChevron
                  onPress={() => tap(row[1].route)}
                />
              </View>
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
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sc = StyleSheet.create({
  root:    { flex: 1, backgroundColor: "#05080F" },
  scroll:  { flex: 1, backgroundColor: "transparent" },
  content: { paddingHorizontal: 20, gap: 22 },

  // Header
  header:      { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  headerLeft:  { flex: 1, gap: 7 },
  pageTitle:   {
    fontSize: 26, fontFamily: "Inter_700Bold",
    color: "#F0F4FF", letterSpacing: -0.6,
  },

  // Stage pill — warm rose (fixed)
  stagePill: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 11, paddingVertical: 5,
    borderRadius: 20, alignSelf: "flex-start",
    backgroundColor: "#4C2A39",
    shadowColor: "#FF8B68",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  stageDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#FF8B68" },
  stagePillText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#F09A7A" },

  contextLine: {
    fontSize: 14, fontFamily: "Inter_400Regular",
    color: "#9AAAC8", lineHeight: 19,
  },

  settingsBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(20, 38, 90, 0.70)",
    borderWidth: 1, borderColor: "rgba(80, 120, 200, 0.28)",
    alignItems: "center", justifyContent: "center",
    marginTop: 4,
  },

  // Sections
  section:      { gap: 12 },
  sectionTitle: {
    fontSize: 17, fontFamily: "Inter_700Bold",
    color: "#E8EEFF", letterSpacing: -0.3,
  },

  // Action grid — 2 rows of 2 side-by-side cards
  actionGrid: { gap: 8 },
  actionRow:  { flexDirection: "row", gap: 8 },

  // Resources — 2 equal-width cards side by side
  resourceRow: { flexDirection: "row", gap: 8 },
});
