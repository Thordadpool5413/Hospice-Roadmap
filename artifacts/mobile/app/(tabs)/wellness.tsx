/**
 * WellnessScreen — Caregiver wellness trend dashboard.
 *
 * Sections:
 *   1. Ragna CTA banner  — shown when 3+ recent days are sad/overwhelmed
 *   2. 30-day mood heatmap — tap a day to see its note
 *   3. Weekly average line chart — mood trend over the past 5 weeks
 */

import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Polyline, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import {
  MOOD_LABELS,
  MOOD_SCORES,
  useCaregiverWellness,
} from "@/context/CaregiverWellnessContext";
import { useApp } from "@/context/AppContext";
import { CaregiverMood, CaregiverWellnessEntry } from "@/types";

// ─── Mood visual config ────────────────────────────────────────────────────────

type MoodConfig = { emoji: string; color: string };

const MOOD_CONFIG: Record<CaregiverMood, MoodConfig> = {
  doing_okay:  { emoji: "😌", color: Colors.success },
  holding_up:  { emoji: "🙂", color: Colors.primary },
  tired:       { emoji: "😔", color: Colors.amber },
  sad:         { emoji: "😢", color: "#9B7FD4" },
  overwhelmed: { emoji: "😰", color: Colors.error },
};

const MOOD_ORDER: CaregiverMood[] = [
  "doing_okay",
  "holding_up",
  "tired",
  "sad",
  "overwhelmed",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(base: Date, delta: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function shortDay(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return String(d.getDate());
}

function weekLabel(startISO: string): string {
  const d = new Date(startISO + "T12:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ─── Ragna CTA Banner ─────────────────────────────────────────────────────────

function RagnaCTABanner({ count }: { count: number }) {
  const handlePress = useCallback(() => {
    const message =
      "Ragna, I've been feeling quite overwhelmed lately. I could use some support and guidance.";
    router.push({
      pathname: "/(tabs)/help",
      params: { initialMessage: message },
    } as any);
  }, []);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [ws.ragnaBanner, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
    >
      <LinearGradient
        colors={[Colors.error + "18", Colors.primary + "12"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={ws.ragnaBannerIcon}>
        <Text style={{ fontSize: 22 }}>💙</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={ws.ragnaBannerTitle}>It looks like you've been struggling</Text>
        <Text style={ws.ragnaBannerSub}>
          {count} of your recent check-ins were sad or overwhelmed. Ragna is here if you'd like to talk.
        </Text>
      </View>
      <Feather name="arrow-right" size={16} color={Colors.primary + "90"} />
    </Pressable>
  );
}

// ─── Day Detail Modal ─────────────────────────────────────────────────────────

interface DayDetailModalProps {
  entry: CaregiverWellnessEntry | null;
  onClose: () => void;
}

function DayDetailModal({ entry, onClose }: DayDetailModalProps) {
  if (!entry) return null;
  const cfg = MOOD_CONFIG[entry.mood];

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={ws.modalBackdrop} onPress={onClose}>
        <View style={ws.modalCard}>
          <View style={[ws.modalIconRow, { backgroundColor: cfg.color + "22" }]}>
            <Text style={ws.modalEmoji}>{cfg.emoji}</Text>
          </View>
          <Text style={ws.modalDate}>{formatDisplayDate(entry.date)}</Text>
          <Text style={[ws.modalMood, { color: cfg.color }]}>
            {MOOD_LABELS[entry.mood]}
          </Text>
          {entry.note ? (
            <View style={ws.modalNoteWrap}>
              <Text style={ws.modalNote}>"{entry.note}"</Text>
            </View>
          ) : (
            <Text style={ws.modalNoNote}>No note added</Text>
          )}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [ws.modalClose, pressed && { opacity: 0.65 }]}
          >
            <Text style={ws.modalCloseText}>Close</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── 30-Day Heatmap ───────────────────────────────────────────────────────────

interface HeatmapProps {
  entries: CaregiverWellnessEntry[];
  onDayPress: (entry: CaregiverWellnessEntry) => void;
}

const DOW_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function MoodHeatmap({ entries, onDayPress }: HeatmapProps) {
  const today = useMemo(() => new Date(), []);

  const entryMap = useMemo(() => {
    const m: Record<string, CaregiverWellnessEntry> = {};
    for (const e of entries) m[e.date] = e;
    return m;
  }, [entries]);

  const days = useMemo(() => {
    const result: { iso: string; entry: CaregiverWellnessEntry | null; isFuture: boolean; isToday: boolean }[] = [];
    const todayISO = dateStr(today);
    const startDate = addDays(today, -29);
    const startDow = startDate.getDay();
    for (let i = 0; i < startDow; i++) {
      result.push({ iso: "", entry: null, isFuture: true, isToday: false });
    }
    for (let i = 0; i < 30; i++) {
      const d = addDays(startDate, i);
      const iso = dateStr(d);
      result.push({
        iso,
        entry: entryMap[iso] ?? null,
        isFuture: false,
        isToday: iso === todayISO,
      });
    }
    return result;
  }, [today, entryMap]);

  const rows: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }

  return (
    <View style={ws.sectionCard}>
      <View style={ws.sectionHeader}>
        <Feather name="calendar" size={15} color={Colors.primary} />
        <Text style={ws.sectionTitle}>30-Day Mood History</Text>
      </View>

      <View style={ws.dowRow}>
        {DOW_LABELS.map((d) => (
          <View key={d} style={ws.dowCell}>
            <Text style={ws.dowLabel}>{d}</Text>
          </View>
        ))}
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={ws.heatRow}>
          {row.map((cell, ci) => {
            if (!cell.iso) {
              return <View key={`gap-${ri}-${ci}`} style={ws.heatCell} />;
            }
            const cfg = cell.entry ? MOOD_CONFIG[cell.entry.mood] : null;
            const day = shortDay(cell.iso);

            return (
              <Pressable
                key={cell.iso}
                style={({ pressed }) => [
                  ws.heatCell,
                  pressed && cell.entry ? { opacity: 0.7 } : null,
                ]}
                onPress={() => cell.entry && onDayPress(cell.entry)}
                disabled={!cell.entry}
              >
                <View style={[
                  ws.heatDot,
                  cfg ? { backgroundColor: cfg.color } : ws.heatDotEmpty,
                  cell.isToday && ws.heatDotToday,
                ]}>
                  <Text style={[
                    ws.heatDayNum,
                    cfg ? { color: "#fff" } : { color: Colors.textSubtle },
                    cell.isToday && { fontFamily: "Inter_700Bold" },
                  ]}>
                    {day}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          {row.length < 7 && Array.from({ length: 7 - row.length }).map((_, fi) => (
            <View key={`fill-${ri}-${fi}`} style={ws.heatCell} />
          ))}
        </View>
      ))}

      <View style={ws.legendRow}>
        {MOOD_ORDER.map((mood) => (
          <View key={mood} style={ws.legendItem}>
            <View style={[ws.legendDot, { backgroundColor: MOOD_CONFIG[mood].color }]} />
            <Text style={ws.legendLabel}>{MOOD_CONFIG[mood].emoji}</Text>
          </View>
        ))}
        <View style={ws.legendItem}>
          <View style={[ws.legendDot, ws.heatDotEmpty]} />
          <Text style={ws.legendLabel}>–</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Weekly Average Line Chart ─────────────────────────────────────────────────

interface WeeklyChartProps {
  entries: CaregiverWellnessEntry[];
}

const CHART_H = 110;
const CHART_PAD_V = 12;
const CHART_PAD_H = 24;
const PLOT_H = CHART_H - CHART_PAD_V * 2;

function WeeklyTrendChart({ entries }: WeeklyChartProps) {
  const [chartWidth, setChartWidth] = useState(0);

  const weeks = useMemo(() => {
    const today = new Date();
    const result: { label: string; avg: number | null; startISO: string }[] = [];
    for (let w = 4; w >= 0; w--) {
      const weekStart = addDays(today, -(w * 7 + 6));
      const weekEnd = addDays(today, -(w * 7));
      const weekStartISO = dateStr(weekStart);
      const weekEndISO = dateStr(weekEnd);
      const weekEntries = entries.filter((e) => e.date >= weekStartISO && e.date <= weekEndISO);
      if (weekEntries.length === 0) {
        result.push({ label: weekLabel(weekStartISO), avg: null, startISO: weekStartISO });
      } else {
        const avg = weekEntries.reduce((s, e) => s + MOOD_SCORES[e.mood], 0) / weekEntries.length;
        result.push({ label: weekLabel(weekStartISO), avg, startISO: weekStartISO });
      }
    }
    return result;
  }, [entries]);

  const hasData = weeks.some((w) => w.avg !== null);

  const toX = useCallback((i: number) => {
    const innerW = chartWidth - CHART_PAD_H * 2;
    return CHART_PAD_H + (i / (weeks.length - 1)) * innerW;
  }, [chartWidth, weeks.length]);

  const toY = useCallback((score: number) => {
    return CHART_PAD_V + (1 - (score - 1) / 4) * PLOT_H;
  }, []);

  const plotPoints = useMemo(() => {
    if (chartWidth === 0) return [];
    return weeks
      .map((w, i) => w.avg !== null ? { x: toX(i), y: toY(w.avg), avg: w.avg } : null);
  }, [chartWidth, weeks, toX, toY]);

  const polylinePoints = useMemo(() => {
    return plotPoints
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .map((p) => `${p.x},${p.y}`)
      .join(" ");
  }, [plotPoints]);

  const gridLines = [1, 2, 3, 4, 5].map((score) => toY(score));

  return (
    <View style={ws.sectionCard}>
      <View style={ws.sectionHeader}>
        <Feather name="trending-up" size={15} color={Colors.primary} />
        <Text style={ws.sectionTitle}>Weekly Average Mood</Text>
      </View>

      {!hasData ? (
        <Text style={ws.emptyText}>Check in a few days to see your trend.</Text>
      ) : (
        <View onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
          {chartWidth > 0 && (
            <Svg width={chartWidth} height={CHART_H}>
              <Defs>
                <SvgGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={Colors.primary} stopOpacity={0.9} />
                  <Stop offset="100%" stopColor={Colors.primary} stopOpacity={0.3} />
                </SvgGradient>
              </Defs>

              {gridLines.map((y, i) => (
                <Line
                  key={i}
                  x1={CHART_PAD_H} y1={y}
                  x2={chartWidth - CHART_PAD_H} y2={y}
                  stroke="rgba(60,90,160,0.18)"
                  strokeWidth={1}
                  strokeDasharray="3,4"
                />
              ))}

              {polylinePoints.length > 0 && (
                <Polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {plotPoints.map((pt, i) => {
                if (!pt) return null;
                const clampedAvg = Math.round(pt.avg);
                const nearestMood = MOOD_ORDER.find(
                  (m) => MOOD_SCORES[m] === clampedAvg,
                ) ?? "holding_up";
                const color = MOOD_CONFIG[nearestMood].color;
                return (
                  <React.Fragment key={i}>
                    <Circle cx={pt.x} cy={pt.y} r={8} fill={color} fillOpacity={0.18} />
                    <Circle cx={pt.x} cy={pt.y} r={4} fill={color} />
                  </React.Fragment>
                );
              })}
            </Svg>
          )}

          <View style={ws.chartAxisRow}>
            {weeks.map((w, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <Text style={ws.chartAxisLabel} numberOfLines={1}>{w.label}</Text>
              </View>
            ))}
          </View>

          <View style={ws.chartYLabels}>
            {[
              { score: 5, label: "Great" },
              { score: 3, label: "Okay" },
              { score: 1, label: "Hard" },
            ].map(({ score, label }) => (
              <View
                key={score}
                style={[ws.chartYLabel, { top: toY(score) - 8 }]}
              >
                <Text style={ws.chartYLabelText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Summary Stats ─────────────────────────────────────────────────────────────

function SummaryStats({ entries }: { entries: CaregiverWellnessEntry[] }) {
  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const scores = entries.map((e) => MOOD_SCORES[e.mood]);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const avgMood = MOOD_ORDER.reduce((best, m) =>
      Math.abs(MOOD_SCORES[m] - avg) < Math.abs(MOOD_SCORES[best] - avg) ? m : best,
    );

    const moodCounts: Partial<Record<CaregiverMood, number>> = {};
    for (const e of entries) moodCounts[e.mood] = (moodCounts[e.mood] ?? 0) + 1;
    const topMood = (Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as CaregiverMood) ?? avgMood;

    const streak = (() => {
      const today = new Date();
      let count = 0;
      const entryDates = new Set(entries.map((e) => e.date));
      for (let i = 0; i < 30; i++) {
        const d = addDays(today, -i);
        if (entryDates.has(dateStr(d))) count++;
        else break;
      }
      return count;
    })();

    return { avg: avg.toFixed(1), topMood, streak, total: entries.length };
  }, [entries]);

  if (!stats) return null;

  const statItems = [
    {
      label: "Avg mood",
      value: MOOD_CONFIG[stats.topMood].emoji,
      sub: MOOD_LABELS[stats.topMood],
    },
    {
      label: "Day streak",
      value: `${stats.streak}`,
      sub: stats.streak === 1 ? "day" : "days",
    },
    {
      label: "Total",
      value: `${stats.total}`,
      sub: "check-ins",
    },
  ];

  return (
    <View style={ws.statsRow}>
      {statItems.map((item) => (
        <View key={item.label} style={ws.statCard}>
          <Text style={ws.statValue}>{item.value}</Text>
          <Text style={ws.statSub}>{item.sub}</Text>
          <Text style={ws.statLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WellnessScreen() {
  const { user } = useApp();
  const { entries, getRecentEntries, isLoading } = useCaregiverWellness();
  const insets = useSafeAreaInsets();

  const [selectedEntry, setSelectedEntry] = useState<CaregiverWellnessEntry | null>(null);

  const last30 = useMemo(() => getRecentEntries(30), [getRecentEntries, entries]);
  const last7  = useMemo(() => getRecentEntries(7),  [getRecentEntries, entries]);

  const distressCount = useMemo(
    () => last7.filter((e) => e.mood === "overwhelmed" || e.mood === "sad").length,
    [last7],
  );

  const showRagnaBanner = distressCount >= 3;

  const isCaregiver = user?.role === "caregiver" || user?.role === "other";

  if (!isCaregiver) {
    return (
      <View style={[ws.root, { paddingTop: insets.top + 16 }]}>
        <View style={ws.notAvailWrap}>
          <Text style={ws.notAvailIcon}>🏠</Text>
          <Text style={ws.notAvailTitle}>Wellness Tracking</Text>
          <Text style={ws.notAvailSub}>
            This screen is designed for caregivers and family members.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[ws.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[ws.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={ws.pageHeader}>
          <View style={ws.pageHeaderLeft}>
            <Text style={ws.pageTitle}>Your Wellness</Text>
            <Text style={ws.pageSub}>How you've been feeling</Text>
          </View>
          <View style={[ws.pageHeaderIcon, { backgroundColor: Colors.primary + "18" }]}>
            <Feather name="heart" size={20} color={Colors.primary} />
          </View>
        </View>

        {/* ── Ragna CTA ── */}
        {showRagnaBanner && <RagnaCTABanner count={distressCount} />}

        {/* ── Empty state ── */}
        {!isLoading && last30.length === 0 && (
          <View style={ws.emptyCard}>
            <Text style={ws.emptyIcon}>📋</Text>
            <Text style={ws.emptyTitle}>No check-ins yet</Text>
            <Text style={ws.emptySub}>
              Use the daily check-in card on the Home screen to log how you're feeling. Your history will appear here.
            </Text>
          </View>
        )}

        {/* ── Summary stats ── */}
        {last30.length > 0 && <SummaryStats entries={last30} />}

        {/* ── 30-day heatmap ── */}
        {last30.length > 0 && (
          <MoodHeatmap entries={last30} onDayPress={setSelectedEntry} />
        )}

        {/* ── Weekly trend chart ── */}
        {last30.length >= 3 && (
          <WeeklyTrendChart entries={last30} />
        )}

        {/* ── Mood legend ── */}
        {last30.length > 0 && (
          <View style={ws.sectionCard}>
            <View style={ws.sectionHeader}>
              <Feather name="info" size={14} color={Colors.textMuted} />
              <Text style={[ws.sectionTitle, { color: Colors.textMuted }]}>Mood Scale</Text>
            </View>
            <View style={ws.moodScaleRow}>
              {MOOD_ORDER.map((mood) => (
                <View key={mood} style={ws.moodScaleItem}>
                  <View style={[ws.moodScaleDot, { backgroundColor: MOOD_CONFIG[mood].color }]} />
                  <Text style={ws.moodScaleEmoji}>{MOOD_CONFIG[mood].emoji}</Text>
                  <Text style={ws.moodScaleLabel}>{MOOD_LABELS[mood]}</Text>
                  <Text style={ws.moodScaleScore}>{MOOD_SCORES[mood]}/5</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Day detail modal ── */}
      {selectedEntry && (
        <DayDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ws = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 12,
  },

  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 4,
  },
  pageHeaderLeft: {
    gap: 2,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  pageSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  pageHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  ragnaBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.error + "35",
    padding: 14,
    overflow: "hidden",
  },
  ragnaBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.error + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  ragnaBannerTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  ragnaBannerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceMid,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder + "60",
    padding: 12,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  statSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 2,
  },

  sectionCard: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder + "60",
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },

  dowRow: {
    flexDirection: "row",
    marginBottom: -4,
  },
  dowCell: {
    flex: 1,
    alignItems: "center",
  },
  dowLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  heatRow: {
    flexDirection: "row",
  },
  heatCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 3,
  },
  heatDot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  heatDotEmpty: {
    backgroundColor: "rgba(60,90,160,0.12)",
    borderWidth: 1,
    borderColor: "rgba(60,90,160,0.18)",
  },
  heatDotToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  heatDayNum: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },

  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  chartAxisRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  chartAxisLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
  },
  chartYLabels: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  chartYLabel: {
    position: "absolute",
    left: 0,
  },
  chartYLabelText: {
    fontSize: 8,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
  },

  moodScaleRow: {
    gap: 6,
  },
  moodScaleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moodScaleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  moodScaleEmoji: {
    fontSize: 14,
    width: 20,
    textAlign: "center",
  },
  moodScaleLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  moodScaleScore: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },

  emptyCard: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder + "60",
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: 8,
  },

  notAvailWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 10,
  },
  notAvailIcon: {
    fontSize: 40,
    marginBottom: 6,
  },
  notAvailTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  notAvailSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(4,10,28,0.80)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  modalIconRow: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  modalEmoji: {
    fontSize: 28,
  },
  modalDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  modalMood: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  modalNoteWrap: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(80,120,200,0.20)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: "100%",
    marginTop: 4,
  },
  modalNote: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
  modalNoNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    marginTop: 4,
  },
  modalClose: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  modalCloseText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
});
