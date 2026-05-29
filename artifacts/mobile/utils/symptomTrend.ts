import { SymptomEntry } from "@/types";

export type TrendDirection = "improving" | "stable" | "worsening";

export interface TrendResult {
  direction: TrendDirection;
  delta: number;
  recentAvg: number;
  priorAvg: number;
}

export interface SparkPoint {
  date: string;
  value: number | null;
}

/**
 * Returns the last `windowDays` calendar days as SparkPoints,
 * with `null` for days that have no entry.
 */
export function getSparkPoints(
  entries: SymptomEntry[],
  key: keyof Pick<SymptomEntry, "pain" | "breathlessness" | "nausea" | "agitation" | "appetite">,
  windowDays = 7
): SparkPoint[] {
  const today = new Date();
  return Array.from({ length: windowDays }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (windowDays - 1 - i));
    const ds = d.toISOString().slice(0, 10);
    const entry = entries.find((e) => e.date === ds);
    return { date: ds, value: entry != null ? (entry[key] as number) : null };
  });
}

/**
 * Compares the most-recent 3 check-ins against the prior 3 check-ins
 * and returns a trend direction + numeric delta.
 *
 * `inverted` should be true for symptoms where higher is *better* (e.g. appetite).
 */
export function calcTrend(
  entries: SymptomEntry[],
  key: keyof Pick<SymptomEntry, "pain" | "breathlessness" | "nausea" | "agitation" | "appetite">,
  max = 10,
  inverted = false
): TrendResult {
  const sorted = [...entries]
    .filter((e) => e[key] != null)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length < 4) return { direction: "stable", delta: 0, recentAvg: 0, priorAvg: 0 };

  const recent = sorted.slice(0, 3);
  const prior  = sorted.slice(3, 6);
  if (prior.length === 0) return { direction: "stable", delta: 0, recentAvg: 0, priorAvg: 0 };

  const avg = (arr: SymptomEntry[]) =>
    arr.reduce((s, e) => s + (e[key] as number), 0) / arr.length;

  const recentAvg = avg(recent);
  const priorAvg  = avg(prior);
  const rawDelta  = recentAvg - priorAvg;
  const threshold = max * 0.10;

  let direction: TrendDirection;
  if (rawDelta > threshold)       direction = inverted ? "improving"  : "worsening";
  else if (rawDelta < -threshold) direction = inverted ? "worsening"  : "improving";
  else                            direction = "stable";

  return { direction, delta: rawDelta, recentAvg, priorAvg };
}
