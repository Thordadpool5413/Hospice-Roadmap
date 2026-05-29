import { SymptomEntry } from "@/types";

export type EscalationPattern =
  | "consecutive_high_pain"
  | "rapid_increase"
  | "new_high_severity";

export interface EscalationAlert {
  symptomKey: "pain" | "breathlessness" | "nausea";
  symptomName: string;
  severityLevel: number;
  pattern: EscalationPattern;
  description: string;
  daysAffected?: number;
}

const SYMPTOM_LABELS: Record<"pain" | "breathlessness" | "nausea", string> = {
  pain: "pain",
  breathlessness: "breathlessness",
  nausea: "nausea",
};
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function getScore(entry: SymptomEntry, key: "pain" | "breathlessness" | "nausea"): number {
  return entry[key];
}

function entryTimestamp(entry: SymptomEntry): number {
  try {
    return new Date(`${entry.date}T${entry.time}`).getTime();
  } catch {
    return new Date(entry.date).getTime();
  }
}

/**
 * Evaluates the last 7 days of symptom entries and returns a list of
 * clinically significant escalation alerts.
 *
 * Rules:
 * 1. Pain ≥ 7 for 2+ consecutive days (date-based, not time-based)
 * 2. Any tracked symptom increases by ≥ 3 points AND the two check-ins are
 *    within 24 hours of each other
 * 3. A new high-severity symptom (≥ 7) that was 0 or absent in the prior check-in
 */
export function evaluateEscalation(entries: SymptomEntry[]): EscalationAlert[] {
  if (entries.length < 2) return [];

  const sorted = [...entries].sort((a, b) => {
    const ta = `${a.date}T${a.time}`;
    const tb = `${b.date}T${b.time}`;
    return tb.localeCompare(ta);
  });

  const latest = sorted[0];
  const previous = sorted[1];

  const alerts: EscalationAlert[] = [];
  const seen = new Set<string>();

  const addAlert = (alert: EscalationAlert) => {
    const key = `${alert.symptomKey}:${alert.pattern}`;
    if (!seen.has(key)) {
      seen.add(key);
      alerts.push(alert);
    }
  };

  const keys: ("pain" | "breathlessness" | "nausea")[] = ["pain", "breathlessness", "nausea"];

  // Rule 1 — Pain ≥ 7 for 2 consecutive days (date-based: different calendar dates)
  const latestDate = latest.date;
  const previousDate = previous.date;
  const dateDiffMs = new Date(latestDate + "T12:00:00").getTime() - new Date(previousDate + "T12:00:00").getTime();
  const onConsecutiveDays = dateDiffMs > 0 && dateDiffMs <= TWENTY_FOUR_HOURS_MS * 1.5;

  if (onConsecutiveDays && getScore(latest, "pain") >= 7 && getScore(previous, "pain") >= 7) {
    let daysAffected = 2;
    for (let i = 2; i < sorted.length; i++) {
      const prevEntry = sorted[i - 1];
      const curEntry = sorted[i];
      const dayDiff = new Date(prevEntry.date + "T12:00:00").getTime() - new Date(curEntry.date + "T12:00:00").getTime();
      if (dayDiff <= TWENTY_FOUR_HOURS_MS * 1.5 && getScore(curEntry, "pain") >= 7) {
        daysAffected++;
      } else {
        break;
      }
    }
    addAlert({
      symptomKey: "pain",
      symptomName: "Pain",
      severityLevel: getScore(latest, "pain"),
      pattern: "consecutive_high_pain",
      description: `Pain has been ${getScore(latest, "pain")}/10 or higher for ${daysAffected} consecutive days`,
      daysAffected,
    });
  }

  // Rule 2 — Rapid increase (≥ 3 points) only if within 24 hours of each other
  const timeDeltaMs = entryTimestamp(latest) - entryTimestamp(previous);
  const withinOneDay = timeDeltaMs >= 0 && timeDeltaMs <= TWENTY_FOUR_HOURS_MS;

  if (withinOneDay) {
    for (const key of keys) {
      const latestScore = getScore(latest, key);
      const prevScore = getScore(previous, key);
      const delta = latestScore - prevScore;
      if (delta >= 3) {
        addAlert({
          symptomKey: key,
          symptomName: SYMPTOM_LABELS[key].charAt(0).toUpperCase() + SYMPTOM_LABELS[key].slice(1),
          severityLevel: latestScore,
          pattern: "rapid_increase",
          description: `${SYMPTOM_LABELS[key].charAt(0).toUpperCase() + SYMPTOM_LABELS[key].slice(1)} jumped from ${prevScore} to ${latestScore}/10 within 24 hours`,
        });
      }
    }
  }

  // Rule 3 — New high-severity symptom (≥ 7) that was absent (≤ 1) before
  for (const key of keys) {
    const latestScore = getScore(latest, key);
    const prevScore = getScore(previous, key);
    if (latestScore >= 7 && prevScore <= 1) {
      addAlert({
        symptomKey: key,
        symptomName: SYMPTOM_LABELS[key].charAt(0).toUpperCase() + SYMPTOM_LABELS[key].slice(1),
        severityLevel: latestScore,
        pattern: "new_high_severity",
        description: `${SYMPTOM_LABELS[key].charAt(0).toUpperCase() + SYMPTOM_LABELS[key].slice(1)} is now ${latestScore}/10 — this is a new high-severity symptom`,
      });
    }
  }

  return alerts;
}
