import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Polyline, Stop, Text as SvgText } from "react-native-svg";

import { Colors } from "@/constants/colors";
import { SymptomEntry } from "@/types";
import { TrendDirection, calcTrend, getSparkPoints } from "@/utils/symptomTrend";

// ─── Color helpers ────────────────────────────────────────────────────────────

function severityColor(value: number, max: number, inverted = false): string {
  const p = inverted ? 1 - value / max : value / max;
  if (p <= 0)   return Colors.divider;
  if (p <= 0.3) return Colors.primary;
  if (p <= 0.6) return Colors.amber;
  return Colors.error;
}

function trendConfig(dir: TrendDirection, inverted = false): { color: string; icon: string; label: string } {
  if (dir === "improving")  return { color: Colors.primary, icon: "↓", label: "Improving" };
  if (dir === "worsening")  return { color: Colors.error,   icon: "↑", label: "Worsening" };
  return                           { color: Colors.amber,   icon: "→", label: "Stable"    };
}

// ─── Sparkline (SVG) ─────────────────────────────────────────────────────────

interface SparklineProps {
  points: Array<{ date: string; value: number | null }>;
  max: number;
  height?: number;
  inverted?: boolean;
}

export function Sparkline({ points, max, height = 52, inverted = false }: SparklineProps) {
  const [width, setWidth] = useState(0);

  const nonNull = points.filter((p) => p.value !== null);
  if (nonNull.length < 2 || width === 0) {
    return (
      <View
        style={{ height, justifyContent: "center", alignItems: "center" }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        <Text style={spkSt.waitText}>Check in again to see your trend</Text>
      </View>
    );
  }

  const PAD_LEFT  = 4;
  const PAD_RIGHT = 32; // room for the last-value annotation
  const PAD_TOP   = 6;
  const PAD_BOT   = 6;
  const plotW     = width - PAD_LEFT - PAD_RIGHT;
  const plotH     = height - PAD_TOP - PAD_BOT;

  const toX = (idx: number) =>
    PAD_LEFT + (idx / (points.length - 1)) * plotW;

  const toY = (v: number) =>
    PAD_TOP + (1 - v / max) * plotH;

  const plotPoints = points
    .map((p, i) => (p.value !== null ? { x: toX(i), y: toY(p.value), v: p.value } : null))
    .filter(Boolean) as { x: number; y: number; v: number }[];

  const polylineStr = plotPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Area fill path: go down to baseline, trace back along bottom
  const first = plotPoints[0];
  const last  = plotPoints[plotPoints.length - 1];
  const baseY = PAD_TOP + plotH;
  const fillPath = `M ${first.x},${baseY} L ${polylineStr.split(" ").map((pt, i) => {
    const [x, y] = pt.split(",");
    return i === 0 ? `${x},${y}` : `L ${x},${y}`;
  }).join(" ")} L ${last.x},${baseY} Z`;

  const lastV     = last.v;
  const lineColor = severityColor(lastV, max, inverted);
  const gradId    = `grad-${Math.round(Math.random() * 10000)}`;

  const labelX = last.x + 5;
  const labelY = last.y + 4;

  return (
    <View
      style={{ height }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%"   stopColor={lineColor} stopOpacity={0.28} />
              <Stop offset="100%" stopColor={lineColor} stopOpacity={0.03} />
            </LinearGradient>
          </Defs>

          {/* Area fill */}
          <Path d={fillPath} fill={`url(#${gradId})`} />

          {/* Line */}
          <Polyline
            points={polylineStr}
            fill="none"
            stroke={lineColor}
            strokeWidth={2.2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Dot at last value */}
          <Circle cx={last.x} cy={last.y} r={4} fill={lineColor} />
          <Circle cx={last.x} cy={last.y} r={7} fill={lineColor} fillOpacity={0.22} />

          {/* Last-value annotation */}
          <SvgText
            x={labelX}
            y={labelY}
            fontSize={11}
            fontWeight="700"
            fill={lineColor}
            textAnchor="start"
          >
            {lastV}
          </SvgText>
        </Svg>
      )}
    </View>
  );
}

const spkSt = StyleSheet.create({
  waitText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#3A5080",
    fontStyle: "italic",
  },
});

// ─── TrendChip ────────────────────────────────────────────────────────────────

function TrendChip({ direction, inverted = false }: { direction: TrendDirection; inverted?: boolean }) {
  const { color, icon, label } = trendConfig(direction, inverted);
  return (
    <View style={[chipSt.wrap, { borderColor: color + "55", backgroundColor: color + "12" }]}>
      <Text style={[chipSt.icon, { color }]}>{icon}</Text>
      <Text style={[chipSt.label, { color }]}>{label}</Text>
    </View>
  );
}

const chipSt = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  icon:  { fontSize: 11, fontFamily: "Inter_700Bold" },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});

// ─── SparklineCard ────────────────────────────────────────────────────────────

interface SparklineCardProps {
  symptomKey: keyof Pick<SymptomEntry, "pain" | "breathlessness" | "nausea" | "agitation" | "appetite">;
  label: string;
  entries: SymptomEntry[];
  max?: number;
  inverted?: boolean;
}

export function SparklineCard({ symptomKey, label, entries, max = 10, inverted = false }: SparklineCardProps) {
  const points  = getSparkPoints(entries, symptomKey, 7);
  const nonNull = points.filter((p) => p.value !== null);

  if (nonNull.length < 2) {
    if (nonNull.length === 1) {
      return (
        <View style={cardSt.wrap}>
          <Text style={cardSt.oneDay}>
            {label}: Check in tomorrow to see your first trend
          </Text>
        </View>
      );
    }
    return null;
  }

  const { direction } = calcTrend(entries, symptomKey, max, inverted);

  return (
    <View style={cardSt.wrap}>
      <View style={cardSt.header}>
        <Text style={cardSt.label}>{label} — 7-day trend</Text>
        <TrendChip direction={direction} inverted={inverted} />
      </View>
      <Sparkline points={points} max={max} height={52} inverted={inverted} />
      <View style={cardSt.axisRow}>
        <Text style={cardSt.axisLabel}>7 days ago</Text>
        <Text style={cardSt.axisLabel}>Today</Text>
      </View>
    </View>
  );
}

const cardSt = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(8, 14, 40, 0.75)",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(40, 65, 140, 0.32)",
    padding: 12,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#5A78A8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  axisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 1,
  },
  axisLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: "#2A3A60",
  },
  oneDay: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#3A5080",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
});

// ─── CombinedTrendChart ───────────────────────────────────────────────────────

interface CombinedTrendChartProps {
  entries: SymptomEntry[];
}

const SYMPTOM_COLS = [
  { key: "pain"          as const, label: "Pain",    color: Colors.error },
  { key: "breathlessness"as const, label: "Breath",  color: Colors.amber },
  { key: "nausea"        as const, label: "Nausea",  color: Colors.primary },
  { key: "agitation"    as const, label: "Agit.",   color: "#E07030", max: 3 },
  { key: "appetite"     as const, label: "App.",    color: Colors.success, max: 3, inverted: true },
] as const;

export function CombinedTrendChart({ entries }: CombinedTrendChartProps) {
  const BAR_H = 56;
  const today = new Date();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    const entry = entries.find((e) => e.date === ds);
    return { ds, entry, isToday: i === 6 };
  });

  const hasData = entries.length > 0;

  if (!hasData) return null;

  const daysWithData = days.filter((d) => d.entry).length;
  if (daysWithData < 2) return null;

  return (
    <View style={comSt.wrap}>
      <View style={comSt.header}>
        <Text style={comSt.title}>7-Day Overview</Text>
        <Text style={comSt.sub}>All symptoms combined</Text>
      </View>

      <View style={comSt.legend}>
        {SYMPTOM_COLS.map((s) => (
          <View key={s.key} style={comSt.legendItem}>
            <View style={[comSt.legendDot, { backgroundColor: s.color }]} />
            <Text style={comSt.legendLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={comSt.chartArea}>
        {days.map(({ ds, entry, isToday }) => {
          const dayLabel = new Date(ds + "T12:00:00").toLocaleDateString("en-US", { weekday: "narrow" });
          return (
            <View key={ds} style={comSt.dayCol}>
              <View style={[comSt.barGroup, { height: BAR_H }]}>
                {entry ? (
                  <>
                    {SYMPTOM_COLS.map((s) => {
                      const rawMax = "max" in s ? s.max : 10;
                      const val    = entry[s.key] as number;
                      const barH   = Math.max(3, (val / rawMax) * BAR_H);
                      return (
                        <View
                          key={s.key}
                          style={[comSt.bar, { height: barH, backgroundColor: s.color }]}
                        />
                      );
                    })}
                  </>
                ) : (
                  <View style={comSt.barMissing} />
                )}
              </View>
              <Text style={[comSt.dayLabel, isToday && comSt.todayLabel]}>{dayLabel}</Text>
              {isToday && <View style={comSt.todayTick} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const comSt = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(12, 20, 55, 0.90)",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(55, 85, 170, 0.22)",
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  title: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#DDE8FF" },
  sub:   { fontSize: 11, fontFamily: "Inter_400Regular", color: "#4A6090" },
  legend: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot:  { width: 7, height: 7, borderRadius: 4 },
  legendLabel:{ fontSize: 10, fontFamily: "Inter_400Regular", color: "#4A6090" },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  dayCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 1,
    justifyContent: "center",
  },
  bar:        { width: 4, borderRadius: 2 },
  barMissing: { width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(40, 60, 130, 0.35)" },
  dayLabel:   { fontSize: 9, fontFamily: "Inter_400Regular", color: "#3A5080" },
  todayLabel: { color: Colors.primary, fontFamily: "Inter_600SemiBold" },
  todayTick:  { width: 2, height: 4, borderRadius: 1, backgroundColor: Colors.primary },
});
