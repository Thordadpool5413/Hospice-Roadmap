import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { SparklineCard, CombinedTrendChart } from "@/components/SymptomSparkline";
import { Colors } from "@/constants/colors";
import { useRagnaLearning } from "@/context/RagnaLearningContext";
import { useSymptoms } from "@/context/SymptomContext";
import { useApp } from "@/context/AppContext";
import { SymptomEntry } from "@/types";
import { PremiumGate } from "@/components/PremiumGate";
import { checkAndScheduleEscalationAlerts } from "@/utils/escalationNotifier";

// ─── Constants ───────────────────────────────────────────────────────────────

const AGITATION_OPTS = [
  { value: 0 as const, label: "None",     color: Colors.primary },
  { value: 1 as const, label: "Mild",     color: Colors.amber },
  { value: 2 as const, label: "Moderate", color: "#E07030" },
  { value: 3 as const, label: "Severe",   color: Colors.error },
];
const APPETITE_OPTS = [
  { value: 0 as const, label: "None", color: Colors.error },
  { value: 1 as const, label: "Poor", color: "#E07030" },
  { value: 2 as const, label: "Fair", color: Colors.amber },
  { value: 3 as const, label: "Good", color: Colors.primary },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayDate() { return new Date().toISOString().slice(0, 10); }
function todayTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function scoreColor(score: number, max = 10) {
  const p = score / max;
  if (p <= 0) return Colors.divider;
  if (p <= 0.3) return Colors.primary;
  if (p <= 0.6) return Colors.amber;
  return Colors.error;
}
function shortDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function longDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

// ─── SliderRow ────────────────────────────────────────────────────────────────

function SliderRow({ label, icon, value, max = 10, onChange }: {
  label: string; icon: string; value: number; max?: number; onChange: (v: number) => void;
}) {
  const c = scoreColor(value, max);
  return (
    <View style={sliderSt.wrap}>
      <View style={sliderSt.labelRow}>
        <View style={[sliderSt.iconWrap, { backgroundColor: (value > 0 ? c : Colors.textSubtle) + "20" }]}>
          <Feather name={icon as any} size={14} color={value > 0 ? c : Colors.textSubtle} />
        </View>
        <Text style={sliderSt.label}>{label}</Text>
        <View style={[sliderSt.badge, { backgroundColor: (value > 0 ? c : Colors.textSubtle) + "18" }]}>
          <Text style={[sliderSt.badgeText, { color: value > 0 ? c : Colors.textSubtle }]}>{value}/{max}</Text>
        </View>
      </View>
      <View style={sliderSt.steps}>
        {Array.from({ length: max + 1 }, (_, i) => (
          <Pressable
            key={i}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(i); }}
            style={[
              sliderSt.step,
              { backgroundColor: i <= value ? scoreColor(i, max) : Colors.divider },
              i === value && { transform: [{ scaleY: 1.5 }] },
            ]}
          />
        ))}
      </View>
      <View style={sliderSt.rangeRow}>
        <Text style={sliderSt.rangeLabel}>0 — None</Text>
        <Text style={sliderSt.rangeLabel}>{max} — Worst</Text>
      </View>
    </View>
  );
}
const sliderSt = StyleSheet.create({
  wrap: { gap: 9 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  iconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#DDE8FF" },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 9 },
  badgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  steps: { flexDirection: "row", gap: 3, alignItems: "center" },
  step: { flex: 1, height: 19, borderRadius: 4 },
  rangeRow: { flexDirection: "row", justifyContent: "space-between" },
  rangeLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#3A5080" },
});

// ─── CalendarStrip (14 days) ──────────────────────────────────────────────────

function CalendarStrip({ entries, selectedDate, onSelectDate }: {
  entries: SymptomEntry[];
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
}) {
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (13 - i));
      const ds = d.toISOString().slice(0, 10);
      const entry = entries.find((e) => e.date === ds);
      const dow = new Date(ds + "T12:00:00").getDay();
      const dayLetter = ["S","M","T","W","T","F","S"][dow];
      const dayNum = d.getDate();
      const isToday = i === 13;
      let dotColor = Colors.divider + "50";
      if (entry) {
        const maxScore = Math.max(entry.pain, entry.breathlessness, entry.nausea);
        dotColor = scoreColor(maxScore > 0 ? maxScore : 1, 10);
      }
      return { ds, entry, dayLetter, dayNum, isToday, dotColor };
    });
  }, [entries]);

  return (
    <View style={calSt.wrap}>
      <View style={calSt.header}>
        <Text style={calSt.title}>14-Day Calendar</Text>
        {selectedDate && (
          <Pressable onPress={() => onSelectDate(null)} style={calSt.clearBtn}>
            <Text style={calSt.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>
      <View style={calSt.strip}>
        {days.map(({ ds, entry, dayLetter, dayNum, isToday, dotColor }) => {
          const selected = ds === selectedDate;
          return (
            <Pressable
              key={ds}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectDate(selected ? null : ds);
              }}
              style={[
                calSt.dayCell,
                isToday && calSt.todayCell,
                selected && calSt.selectedCell,
              ]}
            >
              <Text style={[calSt.dayLetter, isToday && calSt.todayText, selected && calSt.selectedText]}>
                {dayLetter}
              </Text>
              <View style={[calSt.dot, { backgroundColor: dotColor }, !entry && calSt.dotEmpty]} />
              <Text style={[calSt.dayNum, isToday && calSt.todayText, selected && calSt.selectedText]}>
                {dayNum}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={calSt.legend}>
        {[
          { color: Colors.primary, label: "Low" },
          { color: Colors.amber,   label: "Moderate" },
          { color: Colors.error,   label: "High" },
          { color: Colors.divider, label: "No entry" },
        ].map((l) => (
          <View key={l.label} style={calSt.legendItem}>
            <View style={[calSt.legendDot, { backgroundColor: l.color }]} />
            <Text style={calSt.legendLabel}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const calSt = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(12, 20, 55, 0.90)", borderRadius: 17,
    borderWidth: 1, borderColor: "rgba(55, 85, 170, 0.22)", padding: 16, gap: 13,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20, shadowRadius: 8, elevation: 3,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#DDE8FF" },
  clearBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  clearText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.primary },
  strip: { flexDirection: "row", gap: 3 },
  dayCell: {
    flex: 1, alignItems: "center", gap: 4,
    paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: "transparent",
  },
  todayCell: { borderColor: "rgba(80, 120, 220, 0.40)", backgroundColor: "rgba(60, 100, 200, 0.08)" },
  selectedCell: { borderColor: Colors.primary, backgroundColor: "rgba(60, 100, 200, 0.18)" },
  dayLetter: { fontSize: 9, fontFamily: "Inter_500Medium", color: "#2A3A60" },
  dayNum: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#4A6090" },
  todayText: { color: Colors.primary },
  selectedText: { color: Colors.primary, fontFamily: "Inter_700Bold" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotEmpty: { opacity: 0.30 },
  legend: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#3A5080" },
});

// ─── TrajectoryChart ──────────────────────────────────────────────────────────

function TrajectoryChart({ entries }: { entries: SymptomEntry[] }) {
  const DAYS = 14;
  const BAR_H = 60;
  const today = new Date();
  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (DAYS - 1 - i));
    const ds = d.toISOString().slice(0, 10);
    const entry = entries.find((e) => e.date === ds);
    return { ds, entry, isToday: i === DAYS - 1 };
  }), [entries]);

  const hasData = entries.length > 0;

  return (
    <View style={trajSt.wrap}>
      <View style={trajSt.header}>
        <Text style={trajSt.title}>Symptom Trajectory</Text>
        <Text style={trajSt.sub}>Last {DAYS} days</Text>
      </View>
      <View style={trajSt.legend}>
        {[
          { label: "Pain",     color: Colors.error },
          { label: "Breath",   color: Colors.amber },
          { label: "Nausea",   color: Colors.primary },
        ].map((l) => (
          <View key={l.label} style={trajSt.legendItem}>
            <View style={[trajSt.legendDot, { backgroundColor: l.color }]} />
            <Text style={trajSt.legendLabel}>{l.label}</Text>
          </View>
        ))}
      </View>
      {!hasData ? (
        <View style={trajSt.emptyState}>
          <Feather name="bar-chart-2" size={28} color={Colors.textSubtle} />
          <Text style={trajSt.emptyText}>No check-ins recorded yet.</Text>
          <Text style={trajSt.emptyHint}>Log today's symptoms below to start tracking.</Text>
        </View>
      ) : (
        <View style={trajSt.chart}>
          {days.map(({ ds, entry, isToday }) => {
            const painH   = entry ? Math.max(3, (entry.pain / 10) * BAR_H) : 0;
            const breathH = entry ? Math.max(3, (entry.breathlessness / 10) * BAR_H) : 0;
            const nauseaH = entry ? Math.max(3, (entry.nausea / 10) * BAR_H) : 0;
            return (
              <View key={ds} style={trajSt.col}>
                <View style={[trajSt.barGroup, { height: BAR_H }]}>
                  {entry ? (
                    <>
                      <View style={[trajSt.bar, { height: painH,   backgroundColor: Colors.error   }]} />
                      <View style={[trajSt.bar, { height: breathH, backgroundColor: Colors.amber   }]} />
                      <View style={[trajSt.bar, { height: nauseaH, backgroundColor: Colors.primary }]} />
                    </>
                  ) : (
                    <View style={trajSt.barMissing} />
                  )}
                </View>
                <View style={[trajSt.dateTick, isToday && trajSt.todayTick]} />
              </View>
            );
          })}
        </View>
      )}
      {hasData && (
        <View style={trajSt.axisRow}>
          <Text style={trajSt.axisLabel}>{shortDate(days[0].ds)}</Text>
          <Text style={trajSt.axisLabel}>Today</Text>
        </View>
      )}
    </View>
  );
}
const trajSt = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(12, 20, 55, 0.90)", borderRadius: 17,
    borderWidth: 1, borderColor: "rgba(55, 85, 170, 0.22)", padding: 16, gap: 13,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20, shadowRadius: 8, elevation: 3,
  },
  header: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  title: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#DDE8FF" },
  sub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#4A6090" },
  legend: { flexDirection: "row", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#4A6090" },
  emptyState: { alignItems: "center", paddingVertical: 20, gap: 6 },
  emptyText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#4A6090" },
  emptyHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#3A5080", textAlign: "center" },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  col: { flex: 1, alignItems: "center", gap: 3 },
  barGroup: { flexDirection: "row", alignItems: "flex-end", gap: 2, justifyContent: "center" },
  bar: { width: 5, borderRadius: 3 },
  barMissing: { width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(40, 60, 130, 0.50)" },
  dateTick: { width: 1, height: 4, backgroundColor: "rgba(40, 60, 130, 0.50)" },
  todayTick: { backgroundColor: Colors.primary, width: 2 },
  axisRow: { flexDirection: "row", justifyContent: "space-between" },
  axisLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#3A5080" },
});

// ─── SavedPanel ───────────────────────────────────────────────────────────────

function SavedPanel({ entry, onAskRagna, onDismiss }: {
  entry: { pain: number; breathlessness: number; nausea: number; agitation: number; notes?: string };
  onAskRagna: () => void;
  onDismiss: () => void;
}) {
  const { pain, breathlessness, nausea, agitation } = entry;
  const agLabel = AGITATION_OPTS[agitation]?.label ?? "None";
  const highSeverity = pain >= 7 || breathlessness >= 7 || agitation >= 2;

  return (
    <View style={savedSt.wrap}>
      <View style={savedSt.successRow}>
        <View style={savedSt.checkCircle}>
          <Feather name="check" size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={savedSt.successTitle}>Entry Saved</Text>
          <Text style={savedSt.successSub}>Ragna now has today's data</Text>
        </View>
        <Pressable onPress={onDismiss} style={savedSt.dismissBtn}>
          <Feather name="x" size={16} color={Colors.textSubtle} />
        </Pressable>
      </View>

      <View style={savedSt.scoreRow}>
        {[
          { label: "Pain",    value: pain,           color: scoreColor(pain) },
          { label: "Breath",  value: breathlessness,  color: scoreColor(breathlessness) },
          { label: "Nausea",  value: nausea,           color: scoreColor(nausea) },
        ].map((s) => (
          <View key={s.label} style={savedSt.scoreCell}>
            <Text style={[savedSt.scoreNum, { color: s.value > 0 ? s.color : Colors.textSubtle }]}>
              {s.value}
            </Text>
            <Text style={savedSt.scoreLabel}>{s.label}</Text>
          </View>
        ))}
        <View style={savedSt.scoreCell}>
          <Text style={[savedSt.scoreNum, { color: AGITATION_OPTS[agitation]?.color ?? Colors.textSubtle, fontSize: 12 }]}>
            {agLabel}
          </Text>
          <Text style={savedSt.scoreLabel}>Agitation</Text>
        </View>
      </View>

      {highSeverity && (
        <View style={savedSt.alertRow}>
          <Feather name="alert-triangle" size={13} color={Colors.amber} />
          <Text style={savedSt.alertText}>
            Elevated symptoms detected — Ragna can help you decide whether to call the hospice team.
          </Text>
        </View>
      )}

      <Pressable
        onPress={onAskRagna}
        style={({ pressed }) => [savedSt.ragnaBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
      >
        <Image
          source={require("@/assets/images/ragna-icon.png")}
          style={{ width: 34, height: 34, borderRadius: 9 }}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={savedSt.ragnaBtnTitle}>Get Ragna's Assessment</Text>
          <Text style={savedSt.ragnaBtnSub}>
            {highSeverity
              ? "High severity — Ragna will analyze and advise"
              : "Ask what today's levels mean for comfort care"}
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.7)" />
      </Pressable>
    </View>
  );
}
const savedSt = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(12, 20, 55, 0.90)", borderRadius: 17,
    borderWidth: 1, borderColor: Colors.primary + "45", padding: 16, gap: 14,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 3,
  },
  successRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  checkCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
  },
  successTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#DDE8FF" },
  successSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.primary, marginTop: 1 },
  dismissBtn: { padding: 4 },
  scoreRow: {
    flexDirection: "row",
    backgroundColor: "rgba(8, 14, 40, 0.90)",
    borderRadius: 12, padding: 12, gap: 4,
    borderWidth: 1, borderColor: "rgba(40, 60, 130, 0.30)",
  },
  scoreCell: { flex: 1, alignItems: "center", gap: 2 },
  scoreNum: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#DDE8FF" },
  scoreLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: "#3A5080", textTransform: "uppercase" },
  alertRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "rgba(80, 52, 5, 0.55)", borderRadius: 10, padding: 11,
    borderWidth: 1, borderColor: "rgba(200, 140, 30, 0.30)",
  },
  alertText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.amber, lineHeight: 18 },
  ragnaBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.primary, borderRadius: 15, padding: 14,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.38, shadowRadius: 8, elevation: 4,
  },
  ragnaBtnTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  ragnaBtnSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.82)", marginTop: 2 },
});

// ─── HistoryCard ──────────────────────────────────────────────────────────────

function HistoryCard({ entry, onDelete }: { entry: SymptomEntry; onDelete: () => void }) {
  const ag = AGITATION_OPTS[entry.agitation];
  const ap = APPETITE_OPTS[entry.appetite];
  const max = Math.max(entry.pain, entry.breathlessness, entry.nausea);
  const topColor = scoreColor(max > 0 ? max : 1);
  return (
    <Pressable
      onLongPress={onDelete}
      delayLongPress={600}
      style={({ pressed }) => [histSt.card, pressed && { opacity: 0.88 }]}
    >
      <View style={[histSt.colorBar, { backgroundColor: topColor }]} />
      <View style={{ flex: 1 }}>
        <View style={histSt.topRow}>
          <Text style={histSt.dateText}>{longDate(entry.date)}</Text>
          <Text style={histSt.timeText}>{entry.time}</Text>
        </View>
        <View style={histSt.scoresRow}>
          {[
            { label: "Pain",   value: entry.pain,           color: scoreColor(entry.pain) },
            { label: "Breath", value: entry.breathlessness,  color: scoreColor(entry.breathlessness) },
            { label: "Nausea", value: entry.nausea,          color: scoreColor(entry.nausea) },
          ].map((s) => (
            <View key={s.label} style={histSt.scoreCell}>
              <Text style={[histSt.scoreNum, { color: s.value > 0 ? s.color : Colors.textSubtle }]}>{s.value}</Text>
              <Text style={histSt.scoreLabel}>{s.label}</Text>
            </View>
          ))}
          <View style={histSt.scoreCell}>
            <Text style={[histSt.scoreChip, { color: ag.color, borderColor: ag.color + "50" }]}>
              {ag.label}
            </Text>
            <Text style={histSt.scoreLabel}>Agitation</Text>
          </View>
          <View style={histSt.scoreCell}>
            <Text style={[histSt.scoreChip, { color: ap.color, borderColor: ap.color + "50" }]}>
              {ap.label}
            </Text>
            <Text style={histSt.scoreLabel}>Appetite</Text>
          </View>
        </View>
        {entry.restlessness && (
          <View style={histSt.tagRow}>
            <View style={histSt.tag}><Text style={histSt.tagText}>Restless</Text></View>
          </View>
        )}
        {entry.notes ? (
          <Text style={histSt.notes} numberOfLines={2}>{entry.notes}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
const histSt = StyleSheet.create({
  card: {
    backgroundColor: "rgba(12, 20, 55, 0.90)", borderRadius: 15,
    borderWidth: 1, borderColor: "rgba(55, 85, 170, 0.22)",
    flexDirection: "row", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
  },
  colorBar: { width: 4, borderTopLeftRadius: 15, borderBottomLeftRadius: 15 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, paddingBottom: 6 },
  dateText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#DDE8FF" },
  timeText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#3A5080" },
  scoresRow: { flexDirection: "row", paddingHorizontal: 12, gap: 10, paddingBottom: 10, flexWrap: "wrap" },
  scoreCell: { alignItems: "center", gap: 2 },
  scoreNum: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scoreChip: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1,
  },
  scoreLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: "#3A5080", textTransform: "uppercase" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 6, paddingBottom: 8 },
  tag: {
    backgroundColor: "rgba(80, 52, 5, 0.55)", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: "rgba(200, 140, 30, 0.30)",
  },
  tagText: { fontSize: 10, fontFamily: "Inter_500Medium", color: Colors.amber },
  notes: {
    fontSize: 12, fontFamily: "Inter_400Regular", color: "#5A78A8",
    fontStyle: "italic", paddingHorizontal: 12, paddingBottom: 10, lineHeight: 17,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SymptomTrackerScreen() {
  const insets = useSafeAreaInsets();
  const { entries, addEntry, updateEntry, deleteEntry, getTodayEntry, getRecentEntries } = useSymptoms();
  const { addObservation } = useRagnaLearning();
  const { user } = useApp();
  const today = todayDate();
  const existing = getTodayEntry();
  const isEditing = !!existing;

  const [pain,          setPain]          = useState(existing?.pain ?? 0);
  const [breathlessness, setBreathlessness] = useState(existing?.breathlessness ?? 0);
  const [nausea,         setNausea]         = useState(existing?.nausea ?? 0);
  const [agitation,      setAgitation]      = useState<0|1|2|3>(existing?.agitation ?? 0);
  const [appetite,       setAppetite]       = useState<0|1|2|3>(existing?.appetite ?? 2);
  const [restlessness,   setRestlessness]   = useState(existing?.restlessness ?? false);
  const [notes,          setNotes]          = useState(existing?.notes ?? "");
  const [isSaving,       setIsSaving]       = useState(false);
  const [savedEntry,     setSavedEntry]     = useState<typeof existing | null>(null);
  const [selectedCal,    setSelectedCal]    = useState<string | null>(null);

  const last7   = useMemo(() => getRecentEntries(7),  [entries]);
  const last14  = useMemo(() => getRecentEntries(14), [entries]);
  const allRecent = useMemo(() => entries.slice(0, 30), [entries]);

  const highPain   = pain >= 7;
  const highBreath = breathlessness >= 7;
  const showAlert  = highPain || highBreath || agitation >= 2;

  // when a calendar day is selected, show that entry's details in a mini-panel
  const calEntry = useMemo(
    () => selectedCal ? entries.find((e) => e.date === selectedCal) ?? null : null,
    [selectedCal, entries]
  );

  const handleSave = useCallback(async () => {
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
    setSavedEntry({ ...payload, id: existing?.id ?? "new" } as any);

    // Tell Ragna about this check-in
    const isHighAlert = pain >= 7 || breathlessness >= 7;
    const detail = `pain ${pain}/10, breathlessness ${breathlessness}/10, nausea ${nausea}/10${notes.trim() ? `, note: "${notes.trim().slice(0, 80)}"` : ""}`;
    await addObservation(
      isHighAlert ? "symptom_high" : "symptom_checkin",
      isHighAlert
        ? `High symptom check-in: pain ${pain}/10${breathlessness >= 7 ? `, breathlessness ${breathlessness}/10` : ""}`
        : `Symptom check-in logged`,
      { detail, significant: isHighAlert }
    );

    // Evaluate escalation rules and fire a notification if warranted
    const allEntries = isEditing && existing
      ? entries.map((e) => e.id === existing.id ? { ...e, ...payload, id: e.id } : e)
      : [...entries, { ...payload, id: "pending" } as any];
    checkAndScheduleEscalationAlerts(allEntries, user?.patientProfile?.patientName).catch(() => {});
  }, [isSaving, today, pain, breathlessness, nausea, agitation, appetite, restlessness, notes, isEditing, existing, addObservation, entries, user]);

  const handleDelete = useCallback((entry: SymptomEntry) => {
    Alert.alert("Delete Entry", `Delete the check-in from ${shortDate(entry.date)}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteEntry(entry.id) },
    ]);
  }, [deleteEntry]);

  const handleShare = useCallback(async () => {
    if (allRecent.length === 0) {
      Alert.alert("No Data", "Log at least one symptom check-in before sharing.");
      return;
    }
    const header = `SYMPTOM REPORT — Hospice Roadmap\nGenerated: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n\n${allRecent.length} check-in${allRecent.length !== 1 ? "s" : ""} recorded\n`;
    const divider = "─".repeat(36);
    const rows = allRecent.map((e) => {
      const ag = AGITATION_OPTS[e.agitation]?.label ?? "None";
      const ap = APPETITE_OPTS[e.appetite ?? 2]?.label ?? "Fair";
      const lines = [
        `${longDate(e.date)}  ${e.time}`,
        `  Pain: ${e.pain}/10 · Breathlessness: ${e.breathlessness}/10 · Nausea: ${e.nausea}/10`,
        `  Agitation: ${ag} · Appetite: ${ap}${e.restlessness ? " · Restless" : ""}`,
        e.notes ? `  Notes: "${e.notes}"` : null,
      ];
      return lines.filter(Boolean).join("\n");
    });
    const body = rows.join(`\n${divider}\n`);
    const footer = "\n\nShared from Hospice Roadmap — helping families navigate the hospice journey.";
    try {
      await Share.share({ message: `${header}\n${divider}\n${body}${footer}` });
    } catch {
      // User cancelled or share sheet not available — no action needed.
    }
  }, [allRecent]);

  const openRagna = useCallback((entry: {
    pain: number; breathlessness: number; nausea: number; agitation: number; notes?: string;
  }) => {
    const parts = [
      `Pain: ${entry.pain}/10`,
      `Breathlessness: ${entry.breathlessness}/10`,
      `Nausea: ${entry.nausea}/10`,
      `Agitation: ${AGITATION_OPTS[entry.agitation]?.label ?? "None"}`,
      entry.notes ? `Notes: "${entry.notes}"` : null,
    ].filter(Boolean).join(", ");
    const severity = entry.pain >= 7 || entry.breathlessness >= 7 || entry.agitation >= 2;
    const msg = severity
      ? `I just logged today's symptoms — ${parts}. Some levels are elevated. Can you help me understand what this means and whether I should call the hospice team?`
      : `I just logged today's symptoms — ${parts}. What do these levels tell you about how my loved one is doing, and what can I do to keep them comfortable?`;
    router.push({ pathname: "/(tabs)/help", params: { initialMessage: msg } } as any);
  }, []);

  return (
    <PremiumGate
      featureName="Symptom Tracker"
      showBackButton
      description="Track pain, breathlessness, and other symptoms daily. Ragna uses your check-ins to provide personalized guidance when you need it most."
    >
    <View style={[sc.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <CosmicBackground />
      {/* ── Header ── */}
      <View style={sc.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [sc.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={sc.headerCenter}>
          <Text style={sc.headerTitle}>Symptom Tracker</Text>
          <Text style={sc.headerSub}>{allRecent.length} check-in{allRecent.length !== 1 ? "s" : ""} recorded</Text>
        </View>
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [sc.shareBtn, pressed && { opacity: 0.6 }]}
          accessibilityLabel="Share symptom report"
        >
          <Feather name="share" size={19} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={sc.scroll}
        contentContainerStyle={[sc.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Calendar Strip ── */}
        <CalendarStrip entries={last14} selectedDate={selectedCal} onSelectDate={setSelectedCal} />

        {/* ── Calendar Day Detail ── */}
        {calEntry && (
          <View style={sc.calDetail}>
            <View style={sc.calDetailHeader}>
              <Text style={sc.calDetailTitle}>{longDate(calEntry.date)}</Text>
              <Text style={sc.calDetailTime}>{calEntry.time}</Text>
            </View>
            <View style={sc.calDetailScores}>
              {[
                { label: "Pain",   value: calEntry.pain },
                { label: "Breath", value: calEntry.breathlessness },
                { label: "Nausea", value: calEntry.nausea },
              ].map((s) => (
                <View key={s.label} style={sc.calDetailScore}>
                  <Text style={[sc.calDetailNum, { color: scoreColor(s.value) }]}>{s.value}</Text>
                  <Text style={sc.calDetailLabel}>{s.label}</Text>
                </View>
              ))}
              <View style={sc.calDetailScore}>
                <Text style={[sc.calDetailNum, { color: AGITATION_OPTS[calEntry.agitation]?.color, fontSize: 12 }]}>
                  {AGITATION_OPTS[calEntry.agitation]?.label}
                </Text>
                <Text style={sc.calDetailLabel}>Agitation</Text>
              </View>
            </View>
            {calEntry.notes ? <Text style={sc.calDetailNotes}>{calEntry.notes}</Text> : null}
            {calEntry.date !== today && (
              <Pressable
                onPress={() => openRagna(calEntry)}
                style={({ pressed }) => [sc.calDetailRagna, pressed && { opacity: 0.8 }]}
              >
                <Feather name="message-circle" size={14} color={Colors.primary} />
                <Text style={sc.calDetailRagnaText}>Ask Ragna about this day</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ── Trajectory Chart ── */}
        <TrajectoryChart entries={last14} />

        {/* ── Alert Banner (form-level) ── */}
        {showAlert && !savedEntry && (
          <View style={sc.alertBanner}>
            <Feather name="alert-triangle" size={15} color={Colors.amber} />
            <Text style={sc.alertText}>
              {highPain   && "Pain is high (7+). "}
              {highBreath && "Breathlessness is high (7+). "}
              {agitation >= 2 && "Significant agitation. "}
              Consider contacting your hospice nurse.
            </Text>
          </View>
        )}

        {/* ── Saved Panel (post-save) ── */}
        {savedEntry && (
          <SavedPanel
            entry={savedEntry}
            onAskRagna={() => openRagna(savedEntry)}
            onDismiss={() => setSavedEntry(null)}
          />
        )}

        {/* ── Today's Check-in Form ── */}
        <View style={sc.formCard}>
          <Text style={sc.formTitle}>
            {isEditing ? "Update Today's Check-in" : "Today's Check-in"}
          </Text>
          <Text style={sc.formSub}>
            {today === todayDate() ? longDate(today) : ""} · Tap each bar to set the score
          </Text>

          <View style={sc.sliders}>
            <SparklineCard symptomKey="pain" label="Pain" entries={last7} max={10} />
            <SliderRow label="Pain"          icon="zap"      value={pain}          onChange={setPain} />
            <View style={sc.divider} />
            <SparklineCard symptomKey="breathlessness" label="Breathlessness" entries={last7} max={10} />
            <SliderRow label="Breathlessness" icon="wind"     value={breathlessness} onChange={setBreathlessness} />
            <View style={sc.divider} />
            <SparklineCard symptomKey="nausea" label="Nausea" entries={last7} max={10} />
            <SliderRow label="Nausea"         icon="activity" value={nausea}         onChange={setNausea} />
          </View>

          {/* Agitation */}
          <SparklineCard symptomKey="agitation" label="Agitation" entries={last7} max={3} />
          <View style={sc.optSection}>
            <Text style={sc.optLabel}>Agitation level</Text>
            <View style={sc.optRow}>
              {AGITATION_OPTS.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAgitation(o.value); }}
                  style={({ pressed }) => [
                    sc.optBtn,
                    agitation === o.value && { borderColor: o.color, backgroundColor: o.color + "18" },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={[sc.optBtnText, agitation === o.value && { color: o.color, fontFamily: "Inter_700Bold" }]}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Appetite */}
          <SparklineCard symptomKey="appetite" label="Appetite" entries={last7} max={3} inverted />
          <View style={sc.optSection}>
            <Text style={sc.optLabel}>Appetite</Text>
            <View style={sc.optRow}>
              {APPETITE_OPTS.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAppetite(o.value); }}
                  style={({ pressed }) => [
                    sc.optBtn,
                    appetite === o.value && { borderColor: o.color, backgroundColor: o.color + "18" },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={[sc.optBtnText, appetite === o.value && { color: o.color, fontFamily: "Inter_700Bold" }]}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Restlessness */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRestlessness((v) => !v); }}
            style={({ pressed }) => [sc.toggleRow, restlessness && sc.toggleActive, pressed && { opacity: 0.85 }]}
          >
            <View style={[sc.toggleDot, restlessness && { backgroundColor: Colors.amber }]} />
            <Text style={[sc.toggleLabel, restlessness && { color: Colors.amber, fontFamily: "Inter_600SemiBold" }]}>
              Restlessness or unable to settle
            </Text>
            <Feather name={restlessness ? "check-square" : "square"} size={18}
              color={restlessness ? Colors.amber : Colors.textSubtle} />
          </Pressable>

          {/* Notes */}
          <View style={sc.notesWrap}>
            <Text style={sc.optLabel}>Notes for hospice team</Text>
            <TextInput
              style={sc.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any observations, changes, or questions to report…"
              placeholderTextColor={Colors.textSubtle}
              multiline
              textAlignVertical="top"
              maxLength={600}
            />
          </View>

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [sc.saveBtn, isSaving && { opacity: 0.6 }, pressed && { opacity: 0.85 }]}
          >
            <Feather name="save" size={17} color="#fff" />
            <Text style={sc.saveBtnText}>
              {isSaving ? "Saving…" : isEditing ? "Update Check-in" : "Save & Send to Ragna"}
            </Text>
          </Pressable>
        </View>

        {/* ── Combined 7-Day Overview (above history) ── */}
        <CombinedTrendChart entries={last7} />

        {/* ── Check-in History ── */}
        <View style={sc.historySection}>
          <View style={sc.historyHeader}>
            <Text style={sc.historyTitle}>Check-in History</Text>
            <Text style={sc.historyCount}>{allRecent.length} entries</Text>
          </View>
          {allRecent.length === 0 ? (
            <View style={sc.emptyHistory}>
              <Feather name="clipboard" size={26} color={Colors.textSubtle} />
              <Text style={sc.emptyHistoryText}>No check-ins yet</Text>
              <Text style={sc.emptyHistoryHint}>Your entries will appear here after you save your first one.</Text>
            </View>
          ) : (
            <View style={sc.historyList}>
              {allRecent.map((entry) => (
                <HistoryCard key={entry.id} entry={entry} onDelete={() => handleDelete(entry)} />
              ))}
              <Text style={sc.historyHint}>Long-press any entry to delete</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
    </PremiumGate>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sc = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030A18" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(40, 65, 140, 0.40)",
    backgroundColor: "rgba(3, 10, 24, 0.97)",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(14, 22, 55, 0.90)",
    borderWidth: 1, borderColor: "rgba(60, 90, 170, 0.25)",
    alignItems: "center", justifyContent: "center",
  },
  shareBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(14, 22, 55, 0.90)",
    borderWidth: 1, borderColor: "rgba(60, 90, 170, 0.25)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#EEF4FF", letterSpacing: -0.4 },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#4A6090", marginTop: 1 },

  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },

  alertBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "rgba(90, 60, 5, 0.60)", borderRadius: 13, padding: 13,
    borderWidth: 1, borderColor: "rgba(200, 140, 30, 0.40)",
    borderLeftWidth: 3, borderLeftColor: Colors.amber,
  },
  alertText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.amber, lineHeight: 19 },

  calDetail: {
    backgroundColor: "rgba(12, 20, 55, 0.90)", borderRadius: 16,
    borderWidth: 1, borderColor: Colors.primary + "40",
    padding: 15, gap: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20, shadowRadius: 8, elevation: 3,
  },
  calDetailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  calDetailTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#DDE8FF" },
  calDetailTime: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#3A5080" },
  calDetailScores: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  calDetailScore: { alignItems: "center", gap: 2 },
  calDetailNum: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#DDE8FF" },
  calDetailLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: "#3A5080", textTransform: "uppercase", letterSpacing: 0.5 },
  calDetailNotes: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#5A78A8", fontStyle: "italic", lineHeight: 17 },
  calDetailRagna: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 4 },
  calDetailRagnaText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.primary },

  formCard: {
    backgroundColor: "rgba(12, 20, 55, 0.90)", borderRadius: 17,
    borderWidth: 1, borderColor: "rgba(55, 85, 170, 0.22)", padding: 17, gap: 17,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  formTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#DDE8FF", letterSpacing: -0.35 },
  formSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4A6090", marginTop: -8 },
  sliders: { gap: 18 },
  divider: { height: 1, backgroundColor: "rgba(40, 60, 130, 0.40)" },

  optSection: { gap: 9 },
  optLabel: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#5A78A8", textTransform: "uppercase", letterSpacing: 0.8 },
  optRow: { flexDirection: "row", gap: 7 },
  optBtn: {
    flex: 1, paddingVertical: 9, alignItems: "center",
    borderRadius: 11, borderWidth: 1.5, borderColor: "rgba(55, 85, 170, 0.28)",
    backgroundColor: "rgba(14, 22, 55, 0.90)",
  },
  optBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#5A78A8" },

  toggleRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 13, borderRadius: 12, borderWidth: 1.5,
    borderColor: "rgba(55, 85, 170, 0.28)", backgroundColor: "rgba(14, 22, 55, 0.90)",
  },
  toggleActive: { borderColor: Colors.amber, backgroundColor: "rgba(90, 60, 5, 0.30)" },
  toggleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(60, 90, 170, 0.40)" },
  toggleLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: "#7A90B8" },

  notesWrap: { gap: 7 },
  notesInput: {
    backgroundColor: "rgba(8, 14, 40, 0.90)", borderRadius: 12,
    padding: 13, fontSize: 13, fontFamily: "Inter_400Regular",
    color: "#DDE8FF", minHeight: 76, lineHeight: 20,
    borderWidth: 1, borderColor: "rgba(55, 85, 170, 0.28)",
  },

  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 9, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.42, shadowRadius: 10, elevation: 5,
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.1 },

  historySection: { gap: 11 },
  historyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  historyTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#DDE8FF", letterSpacing: -0.25 },
  historyCount: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#3A5080" },
  historyList: { gap: 10 },
  historyHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#2A3A60", textAlign: "center", paddingTop: 4 },

  emptyHistory: {
    backgroundColor: "rgba(12, 20, 55, 0.90)", borderRadius: 15,
    borderWidth: 1, borderColor: "rgba(55, 85, 170, 0.22)",
    alignItems: "center", padding: 34, gap: 9,
  },
  emptyHistoryText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#5A78A8" },
  emptyHistoryHint: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#3A5080", textAlign: "center" },
});
