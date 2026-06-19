import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useFamilyContacts } from "@/components/FamilyContactsManager";

import { CaregiverWellnessCard } from "@/components/CaregiverWellnessCard";
import { CosmicBackground } from "@/components/CosmicBackground";
import { NeedHelpNowButton } from "@/components/crisis/NeedHelpNowButton";
import { RagnaPromptCard } from "@/components/crisis/RagnaPromptCard";
import { ProfileSetupWizard } from "@/components/ProfileSetupWizard";
import { Colors } from "@/constants/colors";
import { getProactiveRagnaPrompt } from "@/services/symptomActionSuggestions";
import { useApp } from "@/context/AppContext";
import { useJournal } from "@/context/JournalContext";
import { useReminders } from "@/context/RemindersContext";
import { useSymptoms } from "@/context/SymptomContext";
import { useProfileWizard } from "@/hooks/useProfileWizard";
import { JourneyStage, JournalEntry, Reminder, SymptomEntry } from "@/types";

// ─── Stage config ─────────────────────────────────────────────────────────────

type StageStyle = { label: string; color: string; bg: string; dot: string; border: string };

const STAGE_STYLES: Record<JourneyStage, StageStyle> = {
  before: {
    label: "Before Hospice",
    color: "#78AAEE",
    bg: "rgba(14, 38, 78, 0.85)",
    dot: Colors.journeyBefore,
    border: Colors.journeyBefore + "40",
  },
  during: {
    label: "During Hospice",
    color: "#F09A7A",
    bg: "rgba(76, 42, 57, 0.80)",
    dot: "#FF8B68",
    border: "rgba(240, 154, 122, 0.25)",
  },
  after: {
    label: "After Hospice",
    color: "#B89AE8",
    bg: "rgba(30, 20, 58, 0.85)",
    dot: Colors.journeyAfter,
    border: Colors.journeyAfter + "40",
  },
};

const STAGE_FALLBACK: StageStyle = STAGE_STYLES.during;

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeJournalStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;
  const entryDates = new Set(
    entries.map((e) => new Date(e.timestamp).toISOString().slice(0, 10))
  );
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (entryDates.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function countRemindersToday(reminders: Reminder[]): number {
  const today = new Date().toISOString().slice(0, 10);
  const todayDow = new Date().getDay();
  return reminders.filter((r) => {
    if (!r.enabled) return false;
    if (r.recurrence === "daily") return true;
    if (r.recurrence === "weekly") return new Date(r.datetime).getDay() === todayDow;
    return r.datetime.slice(0, 10) === today;
  }).length;
}

function buildSymptomLine(entry: SymptomEntry): string {
  const parts: string[] = [];
  parts.push(`Pain ${entry.pain}/10`);
  parts.push(`Breathlessness ${entry.breathlessness}/10`);
  if (entry.nausea > 0) parts.push(`Nausea ${entry.nausea}/10`);
  return parts.join(" · ");
}

// ─── Profile completeness ─────────────────────────────────────────────────────

const SETUP_DISMISSED_KEY = "@home_profile_setup_dismissed";

type ProfileField = { label: string; filled: boolean };

function getProfileFields(profile: { patientName?: string; diagnosis?: string; medications?: unknown[]; comfortKitMedications?: string; hospicePhone?: string } | undefined): ProfileField[] {
  return [
    { label: "Patient name",    filled: !!(profile?.patientName?.trim()) },
    { label: "Diagnosis",       filled: !!(profile?.diagnosis?.trim()) },
    { label: "Medications",     filled: !!(profile?.medications && (profile.medications as unknown[]).length > 0) || !!(profile?.comfortKitMedications?.trim()) },
    { label: "Hospice phone",   filled: !!(profile?.hospicePhone?.trim()) },
  ];
}

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

function JourneyCard({ stageLabel, onPress }: { stageLabel: string; onPress: () => void }) {
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
          <Text style={jc.label}>{stageLabel}</Text>
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
      <View style={hero.glowRing} />
      <View style={hero.card}>
        <LinearGradient
          colors={["rgba(16, 28, 80, 0.96)", "rgba(12, 20, 68, 0.98)"]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={hero.question}>{title}</Text>
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

// ─── Today Status Row ─────────────────────────────────────────────────────────

type StatusChip = {
  icon: string;
  label: string;
  color: string;
  route: string;
  filled: boolean;
};

function TodayStatusRow({ chips, onPress }: {
  chips: StatusChip[];
  onPress: (route: string) => void;
}) {
  return (
    <View style={ts.row}>
      {chips.map((chip) => (
        <Pressable
          key={chip.label}
          onPress={() => onPress(chip.route)}
          style={({ pressed }) => [
            ts.chip,
            { borderColor: chip.color + (chip.filled ? "50" : "28") },
            chip.filled && { backgroundColor: chip.color + "14" },
            pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Feather
            name={chip.icon as any}
            size={13}
            color={chip.filled ? chip.color : chip.color + "80"}
          />
          <Text style={[ts.label, { color: chip.filled ? chip.color : chip.color + "80" }]} numberOfLines={1}>
            {chip.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
const ts = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(80, 120, 200, 0.28)",
    backgroundColor: "rgba(14, 22, 58, 0.70)",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.1,
  },
});

// ─── Profile Setup Card ───────────────────────────────────────────────────────

function ProfileSetupCard({
  fields,
  onPress,
  onDismiss,
}: {
  fields: ProfileField[];
  onPress: () => void;
  onDismiss: () => void;
}) {
  const filledCount = fields.filter((f) => f.filled).length;
  const total = fields.length;

  return (
    <View style={ps.card}>
      <LinearGradient
        colors={["rgba(26, 42, 90, 0.70)", "rgba(18, 30, 70, 0.60)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={ps.top}>
        <View style={ps.iconWrap}>
          <Feather name="user" size={16} color={Colors.primary} />
        </View>
        <View style={ps.textWrap}>
          <Text style={ps.title}>Complete your profile</Text>
          <Text style={ps.sub}>{filledCount} of {total} key fields set up</Text>
        </View>
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          style={({ pressed }) => [ps.dismissBtn, pressed && { opacity: 0.5 }]}
        >
          <Feather name="x" size={15} color="#4A6090" />
        </Pressable>
      </View>
      <View style={ps.dots}>
        {fields.map((f) => (
          <View
            key={f.label}
            style={[
              ps.dot,
              f.filled
                ? { backgroundColor: Colors.primary }
                : { backgroundColor: "rgba(80, 120, 200, 0.22)" },
            ]}
          />
        ))}
      </View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [ps.cta, pressed && { opacity: 0.80 }]}
      >
        <Text style={ps.ctaText}>Finish setup</Text>
        <Feather name="arrow-right" size={13} color={Colors.primary} />
      </Pressable>
    </View>
  );
}
const ps = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(80, 130, 220, 0.22)",
    padding: 14,
    gap: 11,
    overflow: "hidden",
    backgroundColor: "rgba(14, 22, 58, 0.70)",
    shadowColor: "#1040A0",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.primary + "20",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: { flex: 1 },
  title: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#D8E8FF", letterSpacing: -0.2 },
  sub:   { fontSize: 11, fontFamily: "Inter_400Regular", color: "#5A78A8", marginTop: 1 },
  dismissBtn: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  dots: { flexDirection: "row", gap: 6, paddingLeft: 44 },
  dot:  { width: 28, height: 4, borderRadius: 2 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingLeft: 44,
  },
  ctaText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
    letterSpacing: -0.1,
  },
});

// ─── Today's Symptom Summary ──────────────────────────────────────────────────

function TodaySymptomSummary({ entry, onPress }: { entry: SymptomEntry; onPress: () => void }) {
  const line = buildSymptomLine(entry);
  const isHighPain = entry.pain >= 7 || entry.breathlessness >= 7;
  const accentColor = isHighPain ? Colors.accent : Colors.accentSymptom;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        sy.card,
        { borderColor: accentColor + "35" },
        pressed && { opacity: 0.80 },
      ]}
    >
      <View style={[sy.dot, { backgroundColor: accentColor }]} />
      <View style={sy.textWrap}>
        <Text style={sy.label}>Today's check-in</Text>
        <Text style={[sy.values, { color: accentColor }]} numberOfLines={1}>{line}</Text>
      </View>
      <Feather name="chevron-right" size={14} color={accentColor + "80"} />
    </Pressable>
  );
}
const sy = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(14, 22, 58, 0.65)",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  dot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  textWrap: { flex: 1, gap: 1 },
  label:  { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#4A6090", letterSpacing: 0.1 },
  values: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: -0.1 },
});

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { getTodayEntry, entries: symptomEntries } = useSymptoms();
  const { entries: journalEntries } = useJournal();
  const { reminders } = useReminders();
  const { contacts: familyContacts } = useFamilyContacts();

  const [setupDismissed, setSetupDismissed] = useState(false);
  const [ragnaPromptDismissed, setRagnaPromptDismissed] = useState(false);
  const [wizardVisible, setWizardVisible] = useState(false);
  const hasTriggeredWizard = useRef(false);
  const { loaded: wizardLoaded, canShow: wizardCanShow, markCompleted: markWizardCompleted, markDismissed: markWizardDismissed } = useProfileWizard();

  useEffect(() => {
    AsyncStorage.getItem(SETUP_DISMISSED_KEY)
      .then((val) => { if (val === "1") setSetupDismissed(true); })
      .catch(() => {});
  }, []);

  const dismissSetup = useCallback(() => {
    setSetupDismissed(true);
    AsyncStorage.setItem(SETUP_DISMISSED_KEY, "1").catch(() => {});
  }, []);

  const role   = user?.role ?? "other";
  const config = useMemo(() => ROLE_CONFIG[role] ?? ROLE_CONFIG.other, [role]);
  const patientName = user?.patientProfile?.patientName?.trim();
  const contextLine = config.contextLine(patientName);

  const journeyStage: JourneyStage = (user?.journeyStage as JourneyStage) ?? "during";
  const stageStyle = STAGE_STYLES[journeyStage] ?? STAGE_FALLBACK;

  const todayEntry = getTodayEntry();
  const journalStreak = useMemo(() => computeJournalStreak(journalEntries), [journalEntries]);
  const remindersToday = useMemo(() => countRemindersToday(reminders), [reminders]);

  const profileFields = useMemo(() => getProfileFields(user?.patientProfile), [user?.patientProfile]);
  const allFieldsFilled = profileFields.every((f) => f.filled);
  const showSetupCard = !setupDismissed && !allFieldsFilled;

  // Wizard trigger — show once after onboarding with a 1.5s delay.
  // A session ref prevents re-triggering on every re-render.
  const isOnboarded = !!user?.onboardingComplete;
  useEffect(() => {
    if (hasTriggeredWizard.current) return;
    if (!wizardLoaded || !isOnboarded || allFieldsFilled || !wizardCanShow) return;
    hasTriggeredWizard.current = true;
    const t = setTimeout(() => setWizardVisible(true), 1500);
    return () => clearTimeout(t);
  }, [wizardLoaded, isOnboarded, allFieldsFilled, wizardCanShow]);

  const statusChips: StatusChip[] = [
    todayEntry
      ? { icon: "check-circle", label: "Check-in done", color: Colors.accentSymptom, route: "/symptom-tracker", filled: true }
      : { icon: "activity",    label: "Check in today", color: Colors.accentSymptom, route: "/symptom-tracker", filled: false },
    {
      icon: "bell",
      label: remindersToday > 0 ? `${remindersToday} reminder${remindersToday > 1 ? "s" : ""} today` : "No reminders",
      color: Colors.accentReminders,
      route: "/reminders",
      filled: remindersToday > 0,
    },
    journalStreak > 0
      ? { icon: "edit-3", label: `${journalStreak}-day streak`, color: Colors.accentJournal, route: "/journal", filled: true }
      : { icon: "edit-3", label: "Start journaling",            color: Colors.accentJournal, route: "/journal", filled: false },
  ];

  const tap = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const rows: [ActionItem, ActionItem][] = [
    [config.keyActions[0], config.keyActions[1]],
    [config.keyActions[2], config.keyActions[3]],
  ];

  const proactiveRagna = useMemo(
    () => getProactiveRagnaPrompt(symptomEntries, patientName),
    [symptomEntries, patientName],
  );

  const stagePriorityResources: ResourceItem[] = useMemo(() => {
    if (journeyStage === "before") {
      return [
        { label: "Find hospice providers", sub: "Search by ZIP — compare agencies", icon: "search", route: "/(tabs)/providers", color: Colors.accentJourney },
        { label: "Interview scorecard", sub: "Questions to ask every hospice", icon: "check-square", route: "/hospice-interview", color: Colors.accentGoals },
        { label: "Is it time for hospice?", sub: "Myths, timing, and next steps", icon: "help-circle", route: "/hospice-myths", color: Colors.accentSituation },
      ];
    }
    if (journeyStage === "after") {
      return [
        { label: "Grief & bereavement", sub: "What to expect and who can help", icon: "cloud", route: "/guidance/bereavement-support", color: "#9A7ACC" },
        { label: "Talk to Ragna", sub: "Gentle grief check-in", icon: "message-circle", route: "/(tabs)/help", color: Colors.primary },
        { label: "Family updates", sub: "Wind down updates when you're ready", icon: "message-square", route: "/family-updates", color: Colors.success },
      ];
    }
    return [
      { label: "Signs death may be near", sub: "What to watch for and how to help", icon: "moon", route: "/guidance/approaching-death", color: "#9A7ACC" },
      { label: "Emergency card", sub: "One-tap call, read aloud, share", icon: "credit-card", route: "/emergency-card", color: Colors.error },
      { label: "Equipment help", sub: "Oxygen, bed, suction troubleshooting", icon: "tool", route: "/need-help-now", color: Colors.amber },
    ];
  }, [journeyStage]);

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
            <View style={[sc.stagePill, { backgroundColor: stageStyle.bg, borderColor: stageStyle.border }]}>
              <View style={[sc.stageDot, { backgroundColor: stageStyle.dot }]} />
              <Text style={[sc.stagePillText, { color: stageStyle.color }]}>{stageStyle.label}</Text>
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

        {/* ── Today at a glance ── */}
        <TodayStatusRow chips={statusChips} onPress={tap} />

        {/* ── Caregiver daily wellness check-in ── */}
        {(role === "caregiver" || role === "other") && (
          <CaregiverWellnessCard />
        )}

        {/* ── Profile setup nudge ── */}
        {showSetupCard && (
          <ProfileSetupCard
            fields={profileFields}
            onPress={() => tap("/patient-profile")}
            onDismiss={dismissSetup}
          />
        )}

        {/* ── Crisis-first entry ── */}
        <NeedHelpNowButton variant="hero" />

        {!ragnaPromptDismissed && proactiveRagna && journeyStage === "during" && (
          <RagnaPromptCard
            reason={proactiveRagna.reason}
            initialMessage={proactiveRagna.message}
            onDismiss={() => setRagnaPromptDismissed(true)}
          />
        )}

        {/* ── Stage-specific priorities ── */}
        <View style={sc.section}>
          <SectionHeader title={journeyStage === "before" ? "Choosing hospice" : journeyStage === "after" ? "After hospice" : "During hospice"} />
          <View style={sc.resourceCol}>
            {stagePriorityResources.map((item) => (
              <ResourceCard key={item.label} item={item} onPress={() => tap(item.route)} />
            ))}
          </View>
        </View>

        {/* ── Hero Ragna ── */}
        <HeroRagnaCard
          title={journeyStage === "after" ? "Grief support from Ragna" : config.heroTitle}
          subtitle={journeyStage === "after" ? "Check in when you need someone who remembers your story" : config.heroSubtitle}
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
          {todayEntry && (
            <TodaySymptomSummary
              entry={todayEntry}
              onPress={() => tap("/symptom-tracker")}
            />
          )}
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

        {/* ── Family Updates shortcut (caregiver/other only, when contacts or data exists) ── */}
        {journeyStage !== "after" && role !== "patient" && (familyContacts.length > 0 || !!todayEntry || journalEntries.length > 0) && (
          <Pressable
            onPress={() => tap("/family-updates")}
            style={({ pressed }) => [fu.card, pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] }]}
          >
            <LinearGradient
              colors={["rgba(58, 128, 96, 0.14)", "rgba(58, 128, 96, 0.05)"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={fu.left}>
              <View style={fu.iconWrap}>
                <Feather name="message-square" size={20} color={Colors.success} />
              </View>
              <View style={fu.textWrap}>
                <Text style={fu.label}>Send family update</Text>
                <Text style={fu.sub}>
                  {familyContacts.length > 0
                    ? `${familyContacts.length} contact${familyContacts.length !== 1 ? "s" : ""} · SMS update`
                    : "Keep family in the loop · SMS"}
                </Text>
              </View>
            </View>
            <View style={fu.chevronWrap}>
              <Feather name="chevron-right" size={18} color={Colors.success} />
            </View>
          </Pressable>
        )}

        {/* ── Journey card ── */}
        <JourneyCard stageLabel={stageStyle.label} onPress={() => tap("/(tabs)/journey")} />

      </ScrollView>

      <ProfileSetupWizard
        visible={wizardVisible}
        onComplete={() => {
          setWizardVisible(false);
          markWizardCompleted().catch(() => {});
        }}
        onDismiss={() => {
          setWizardVisible(false);
          markWizardDismissed().catch(() => {});
        }}
      />
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
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  stageDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  stagePillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
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

const fu = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(12, 22, 58, 0.88)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(58, 128, 96, 0.28)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    overflow: "hidden",
    shadowColor: "#2A7A58",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  left: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: Colors.success + "20",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: { flex: 1, gap: 3 },
  label: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#E8F0FF", letterSpacing: -0.25 },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.success + "AA", lineHeight: 17 },
  chevronWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.success + "18",
    alignItems: "center", justifyContent: "center",
  },
});
