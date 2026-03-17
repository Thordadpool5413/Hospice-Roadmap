import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useSymptoms } from "@/context/SymptomContext";
import { SymptomEntry } from "@/types";

const AGITATION_OPTS = [
  { value: 0 as const, label: "None", color: Colors.primary },
  { value: 1 as const, label: "Mild", color: Colors.amber },
  { value: 2 as const, label: "Moderate", color: "#E07030" },
  { value: 3 as const, label: "Severe", color: Colors.error },
];
const APPETITE_OPTS = [
  { value: 0 as const, label: "None", color: Colors.error },
  { value: 1 as const, label: "Poor", color: "#E07030" },
  { value: 2 as const, label: "Fair", color: Colors.amber },
  { value: 3 as const, label: "Good", color: Colors.primary },
];

function scoreColor(score: number, max = 10) {
  const pct = score / max;
  if (pct <= 0.3) return Colors.primary;
  if (pct <= 0.6) return Colors.amber;
  return Colors.error;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}
function todayTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

interface SliderRowProps {
  label: string;
  icon: string;
  value: number;
  max?: number;
  onChange: (v: number) => void;
  color?: string;
}
function SliderRow({ label, icon, value, max = 10, onChange, color }: SliderRowProps) {
  const c = color ?? scoreColor(value, max);
  const steps = Array.from({ length: max + 1 }, (_, i) => i);
  return (
    <View style={sliderStyles.wrap}>
      <View style={sliderStyles.labelRow}>
        <View style={[sliderStyles.iconWrap, { backgroundColor: c + "18" }]}>
          <Feather name={icon as any} size={14} color={c} />
        </View>
        <Text style={sliderStyles.label}>{label}</Text>
        <View style={[sliderStyles.badge, { backgroundColor: c + "20" }]}>
          <Text style={[sliderStyles.badgeText, { color: c }]}>{value}/{max}</Text>
        </View>
      </View>
      <View style={sliderStyles.steps}>
        {steps.map((s) => (
          <Pressable
            key={s}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(s);
            }}
            style={[
              sliderStyles.step,
              { backgroundColor: s <= value ? scoreColor(s, max) : Colors.divider },
              s === value && { transform: [{ scaleY: 1.4 }] },
            ]}
          />
        ))}
      </View>
      <View style={sliderStyles.rangeRow}>
        <Text style={sliderStyles.rangeLabel}>0 — None</Text>
        <Text style={sliderStyles.rangeLabel}>{max} — Severe</Text>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrap: { gap: 8 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  steps: { flexDirection: "row", gap: 3, alignItems: "center" },
  step: { flex: 1, height: 18, borderRadius: 4 },
  rangeRow: { flexDirection: "row", justifyContent: "space-between" },
  rangeLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textSubtle },
});

interface TrendBarProps { label: string; entries: { date: string; value: number }[]; max?: number; }
function TrendBar({ label, entries, max = 10 }: TrendBarProps) {
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().slice(0, 10);
      const match = entries.find((e) => e.date === ds);
      return { date: ds, value: match ? match.value : null, isToday: i === 6 };
    });
  }, [entries]);

  return (
    <View style={trendStyles.wrap}>
      <Text style={trendStyles.label}>{label}</Text>
      <View style={trendStyles.bars}>
        {days.map((d) => {
          const h = d.value !== null ? (d.value / max) * 44 : 0;
          const c = d.value !== null ? scoreColor(d.value, max) : Colors.divider;
          const dayLabel = new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "narrow" });
          return (
            <View key={d.date} style={trendStyles.barCol}>
              <View style={trendStyles.barContainer}>
                {d.value !== null ? (
                  <View style={[trendStyles.bar, { height: Math.max(h, 4), backgroundColor: c }]} />
                ) : (
                  <View style={[trendStyles.barEmpty]} />
                )}
              </View>
              <Text style={[trendStyles.dayLabel, d.isToday && { color: Colors.primary, fontFamily: "Inter_700Bold" }]}>
                {d.isToday ? "•" : dayLabel}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const trendStyles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },
  bars: { flexDirection: "row", gap: 4, alignItems: "flex-end", height: 52 },
  barCol: { flex: 1, alignItems: "center", gap: 3 },
  barContainer: { flex: 1, justifyContent: "flex-end", width: "100%" },
  bar: { borderRadius: 3, width: "100%", minHeight: 4 },
  barEmpty: { height: 4, backgroundColor: Colors.divider + "60", borderRadius: 2, width: "100%" },
  dayLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: Colors.textSubtle },
});

export default function SymptomTrackerScreen() {
  const insets = useSafeAreaInsets();
  const { entries, addEntry, updateEntry, deleteEntry, getTodayEntry } = useSymptoms();
  const today = todayDate();
  const existing = getTodayEntry();
  const isEditing = !!existing;

  const [pain, setPain] = useState(existing?.pain ?? 0);
  const [breathlessness, setBreathlessness] = useState(existing?.breathlessness ?? 0);
  const [nausea, setNausea] = useState(existing?.nausea ?? 0);
  const [agitation, setAgitation] = useState<0|1|2|3>(existing?.agitation ?? 0);
  const [appetite, setAppetite] = useState<0|1|2|3>(existing?.appetite ?? 2);
  const [restlessness, setRestlessness] = useState(existing?.restlessness ?? false);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const recentEntries = useMemo(() => entries.slice(0, 30), [entries]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const payload = {
      date: today,
      time: todayTime(),
      pain, breathlessness, nausea, agitation, appetite, restlessness,
      notes: notes.trim() || undefined,
    };
    if (isEditing && existing) {
      await updateEntry(existing.id, payload);
    } else {
      await addEntry(payload);
    }
    setIsSaving(false);
    Alert.alert("Saved", "Today's symptoms have been logged.", [{ text: "OK" }]);
  };

  const handleDelete = (entry: SymptomEntry) => {
    Alert.alert("Delete Entry", `Delete the check-in from ${formatDateLabel(entry.date)}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteEntry(entry.id) },
    ]);
  };

  const highPain = pain >= 7;
  const highBreath = breathlessness >= 7;
  const showAlert = highPain || highBreath || agitation >= 2;

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Symptom Tracker</Text>
          <Text style={styles.headerSub}>Daily check-in · {formatDateLabel(today)}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Alert banner */}
        {showAlert && (
          <View style={styles.alertBanner}>
            <Feather name="alert-triangle" size={16} color={Colors.amber} />
            <Text style={styles.alertText}>
              {highPain && "Pain is high (7+). "}
              {highBreath && "Breathlessness is high (7+). "}
              {agitation >= 2 && "Significant agitation noted. "}
              Consider calling your hospice nurse.
            </Text>
          </View>
        )}

        {/* Check-in form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{isEditing ? "Update Today's Check-in" : "Today's Check-in"}</Text>
          <Text style={styles.formSub}>Tap each bar to set the score. 0 = none, 10 = worst possible.</Text>

          <View style={styles.sliders}>
            <SliderRow label="Pain" icon="zap" value={pain} onChange={setPain} />
            <View style={styles.divider} />
            <SliderRow label="Breathlessness" icon="wind" value={breathlessness} onChange={setBreathlessness} />
            <View style={styles.divider} />
            <SliderRow label="Nausea" icon="activity" value={nausea} onChange={setNausea} />
          </View>

          {/* Agitation */}
          <View style={styles.optSection}>
            <Text style={styles.optLabel}>Agitation level</Text>
            <View style={styles.optRow}>
              {AGITATION_OPTS.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAgitation(o.value); }}
                  style={({ pressed }) => [
                    styles.optBtn,
                    agitation === o.value && { borderColor: o.color, backgroundColor: o.color + "18" },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={[styles.optBtnText, agitation === o.value && { color: o.color, fontFamily: "Inter_700Bold" }]}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Appetite */}
          <View style={styles.optSection}>
            <Text style={styles.optLabel}>Appetite</Text>
            <View style={styles.optRow}>
              {APPETITE_OPTS.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAppetite(o.value); }}
                  style={({ pressed }) => [
                    styles.optBtn,
                    appetite === o.value && { borderColor: o.color, backgroundColor: o.color + "18" },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={[styles.optBtnText, appetite === o.value && { color: o.color, fontFamily: "Inter_700Bold" }]}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Restlessness toggle */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRestlessness((v) => !v); }}
            style={({ pressed }) => [styles.toggleRow, restlessness && styles.toggleRowActive, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.toggleDot, restlessness && { backgroundColor: Colors.amber }]} />
            <Text style={[styles.toggleLabel, restlessness && { color: Colors.amber, fontFamily: "Inter_600SemiBold" }]}>
              Restlessness or agitation noted
            </Text>
            <Feather name={restlessness ? "check-square" : "square"} size={18} color={restlessness ? Colors.amber : Colors.textSubtle} />
          </Pressable>

          {/* Notes */}
          <View style={styles.notesWrap}>
            <Text style={styles.optLabel}>Notes for hospice team</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any observations, questions, or changes to report…"
              placeholderTextColor={Colors.textSubtle}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [styles.saveBtn, isSaving && { opacity: 0.6 }, pressed && { opacity: 0.85 }]}
          >
            <Feather name="save" size={17} color="#fff" />
            <Text style={styles.saveBtnText}>{isSaving ? "Saving…" : isEditing ? "Update Check-in" : "Save Check-in"}</Text>
          </Pressable>
        </View>

        {/* Ask Vera */}
        {(pain > 0 || breathlessness > 0 || nausea > 0 || agitation > 0) && (
          <Pressable
            onPress={() => {
              const symptoms = [
                pain > 0 && `pain ${pain}/10`,
                breathlessness > 0 && `breathlessness ${breathlessness}/10`,
                nausea > 0 && `nausea ${nausea}/10`,
                agitation > 0 && `${AGITATION_OPTS[agitation].label.toLowerCase()} agitation`,
              ].filter(Boolean).join(", ");
              router.push({
                pathname: "/(tabs)/help",
                params: { initialMessage: `I just logged today's symptoms: ${symptoms}. Can you help me understand what these levels mean and what I should do to keep my loved one comfortable?` },
              } as any);
            }}
            style={({ pressed }) => [styles.veraBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
          >
            <View style={styles.veraBtnIcon}>
              <Feather name="compass" size={18} color="#fff" />
            </View>
            <View style={styles.veraBtnText}>
              <Text style={styles.veraBtnTitle}>Ask Vera about today's symptoms</Text>
              <Text style={styles.veraBtnSub}>Get personalized guidance on what you're seeing</Text>
            </View>
            <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.7)" />
          </Pressable>
        )}

        {/* 7-day trends */}
        {recentEntries.length >= 2 && (
          <View style={styles.trendsCard}>
            <Text style={styles.trendsTitle}>7-Day Trends</Text>
            <Text style={styles.trendsSub}>Most recent check-ins</Text>
            <View style={styles.trendGrid}>
              <TrendBar label="Pain" entries={recentEntries.map((e) => ({ date: e.date, value: e.pain }))} />
              <TrendBar label="Breathlessness" entries={recentEntries.map((e) => ({ date: e.date, value: e.breathlessness }))} />
              <TrendBar label="Nausea" entries={recentEntries.map((e) => ({ date: e.date, value: e.nausea }))} />
            </View>
          </View>
        )}

        {/* History */}
        {recentEntries.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Check-in History</Text>
            <View style={styles.historyList}>
              {recentEntries.slice(0, 10).map((entry) => (
                <Pressable
                  key={entry.id}
                  onLongPress={() => handleDelete(entry)}
                  delayLongPress={600}
                  style={({ pressed }) => [styles.historyCard, pressed && { opacity: 0.88 }]}
                >
                  <View style={styles.historyCardLeft}>
                    <Text style={styles.historyDate}>{formatDateLabel(entry.date)}</Text>
                    <View style={styles.historyScores}>
                      {[
                        { label: "Pain", value: entry.pain, icon: "zap" },
                        { label: "Breath", value: entry.breathlessness, icon: "wind" },
                        { label: "Nausea", value: entry.nausea, icon: "activity" },
                      ].map((s) => (
                        <View key={s.label} style={styles.historyScore}>
                          <Text style={[styles.historyScoreNum, { color: scoreColor(s.value) }]}>{s.value}</Text>
                          <Text style={styles.historyScoreLabel}>{s.label}</Text>
                        </View>
                      ))}
                      <View style={styles.historyScore}>
                        <Text style={[styles.historyScoreNum, { color: AGITATION_OPTS[entry.agitation].color }]}>
                          {AGITATION_OPTS[entry.agitation].label}
                        </Text>
                        <Text style={styles.historyScoreLabel}>Agitation</Text>
                      </View>
                    </View>
                    {entry.notes ? <Text style={styles.historyNotes} numberOfLines={1}>{entry.notes}</Text> : null}
                  </View>
                  <Feather name="more-vertical" size={14} color={Colors.textSubtle} />
                </Pressable>
              ))}
            </View>
            <Text style={styles.historyHint}>Long-press any entry to delete</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 1 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },

  alertBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: Colors.amberPale, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.amber + "40",
  },
  alertText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.amber, lineHeight: 19 },

  formCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.divider, padding: 16, gap: 16,
  },
  formTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.2 },
  formSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: -8 },
  sliders: { gap: 16 },
  divider: { height: 1, backgroundColor: Colors.divider },

  optSection: { gap: 8 },
  optLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  optRow: { flexDirection: "row", gap: 8 },
  optBtn: {
    flex: 1, paddingVertical: 8, alignItems: "center",
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.divider,
    backgroundColor: Colors.backgroundSecondary,
  },
  optBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textMuted },

  toggleRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 10, borderWidth: 1.5,
    borderColor: Colors.divider, backgroundColor: Colors.backgroundSecondary,
  },
  toggleRowActive: { borderColor: Colors.amber, backgroundColor: Colors.amberPale },
  toggleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.divider },
  toggleLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.textSecondary },

  notesWrap: { gap: 6 },
  notesInput: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: 10,
    padding: 12, fontSize: 13, fontFamily: "Inter_400Regular",
    color: Colors.text, minHeight: 72, lineHeight: 20,
    borderWidth: 1, borderColor: Colors.divider,
  },

  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14,
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },

  veraBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.primary, borderRadius: 16, padding: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 10, elevation: 4,
  },
  veraBtnIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  veraBtnText: { flex: 1 },
  veraBtnTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.2 },
  veraBtnSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 2 },

  trendsCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.divider, padding: 16, gap: 12,
  },
  trendsTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.2 },
  trendsSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: -6 },
  trendGrid: { gap: 16 },

  historySection: { gap: 10 },
  historyTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.2 },
  historyList: { gap: 8 },
  historyCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.divider,
    padding: 12, gap: 8,
  },
  historyCardLeft: { flex: 1, gap: 6 },
  historyDate: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  historyScores: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  historyScore: { alignItems: "center", gap: 2 },
  historyScoreNum: { fontSize: 16, fontFamily: "Inter_700Bold" },
  historyScoreLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: Colors.textMuted, textTransform: "uppercase" },
  historyNotes: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, fontStyle: "italic" },
  historyHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSubtle, textAlign: "center" },
});
