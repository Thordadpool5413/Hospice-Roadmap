import { SymptomEntry } from "@/types";

export interface SymptomActionSuggestion {
  id: string;
  message: string;
  guidanceId?: string;
  guidanceLabel?: string;
  ragnaPrompt: string;
  severity: "info" | "watch" | "urgent";
}

const AGITATION_LABELS = ["None", "Mild", "Moderate", "Severe"];

function previousEntry(entries: SymptomEntry[], currentDate: string): SymptomEntry | undefined {
  const sorted = [...entries]
    .filter((e) => e.date !== currentDate)
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
  return sorted[0];
}

export function getSymptomActionSuggestions(
  entry: Pick<SymptomEntry, "pain" | "breathlessness" | "nausea" | "agitation" | "date">,
  allEntries: SymptomEntry[],
): SymptomActionSuggestion[] {
  const suggestions: SymptomActionSuggestion[] = [];
  const prev = previousEntry(allEntries, entry.date);

  if (entry.pain >= 7) {
    const delta = prev ? entry.pain - prev.pain : 0;
    suggestions.push({
      id: "pain-high",
      message: delta >= 2
        ? `Pain up to ${entry.pain}/10 — see guidance`
        : `Pain is ${entry.pain}/10 — see guidance`,
      guidanceId: "pain-worsening",
      guidanceLabel: "Worsening pain guide",
      ragnaPrompt: `Pain is ${entry.pain}/10 today${delta >= 2 ? ` — up from ${prev!.pain}/10` : ""}. What should I do right now and should I call hospice?`,
      severity: entry.pain >= 8 ? "urgent" : "watch",
    });
  } else if (prev && entry.pain - prev.pain >= 2) {
    suggestions.push({
      id: "pain-up",
      message: `Pain up ${entry.pain - prev.pain} points — see guidance`,
      guidanceId: "pain-worsening",
      guidanceLabel: "Worsening pain guide",
      ragnaPrompt: `Pain went from ${prev.pain}/10 to ${entry.pain}/10. What does this trend mean?`,
      severity: "watch",
    });
  }

  if (entry.breathlessness >= 7) {
    const delta = prev ? entry.breathlessness - prev.breathlessness : 0;
    suggestions.push({
      id: "breath-high",
      message: delta >= 2
        ? `Breathlessness up to ${entry.breathlessness}/10`
        : `Breathlessness is ${entry.breathlessness}/10`,
      guidanceId: "breathing-changes",
      guidanceLabel: "Breathing changes guide",
      ragnaPrompt: `Breathlessness is ${entry.breathlessness}/10${delta >= 2 ? ` — up from ${prev!.breathlessness}/10` : ""}. Help me know what to try and when to call.`,
      severity: "urgent",
    });
  } else if (prev && entry.breathlessness - prev.breathlessness >= 2) {
    suggestions.push({
      id: "breath-up",
      message: `Breathlessness up ${entry.breathlessness - prev.breathlessness} points`,
      guidanceId: "breathing-changes",
      guidanceLabel: "Breathing changes guide",
      ragnaPrompt: `Breathlessness increased from ${prev.breathlessness}/10 to ${entry.breathlessness}/10.`,
      severity: "watch",
    });
  }

  if (entry.agitation >= 2) {
    suggestions.push({
      id: "agitation",
      message: `Agitation: ${AGITATION_LABELS[entry.agitation]} — get help`,
      guidanceId: "agitation-restlessness",
      guidanceLabel: "Agitation guide",
      ragnaPrompt: `Agitation is ${AGITATION_LABELS[entry.agitation].toLowerCase()} today. What comfort steps and medications should I consider with hospice?`,
      severity: entry.agitation >= 3 ? "urgent" : "watch",
    });
  }

  if (entry.nausea >= 6) {
    suggestions.push({
      id: "nausea",
      message: `Nausea ${entry.nausea}/10 — see guidance`,
      guidanceId: "nausea-vomiting",
      guidanceLabel: "Nausea guide",
      ragnaPrompt: `Nausea is ${entry.nausea}/10. What can I do at home and when should I call hospice?`,
      severity: "watch",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: "steady",
      message: "Levels look steady — Ask Ragna if anything feels off",
      ragnaPrompt:
        "I just logged today's symptoms and things seem steady, but I want to make sure I'm not missing anything important.",
      severity: "info",
    });
  }

  return suggestions;
}

export function getProactiveRagnaPrompt(
  entries: SymptomEntry[],
  patientName?: string,
): { message: string; reason: string } | null {
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) =>
    `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`),
  );
  const latest = sorted[0];
  const previous = sorted[1];
  const name = patientName?.trim()?.split(" ")[0] ?? "your loved one";

  if (latest.pain >= 7 && previous.pain >= 7) {
    return {
      reason: `${name}'s pain has been high — want to talk to Ragna?`,
      message: `${name}'s pain has been ${latest.pain}/10 or higher recently. What should we be doing differently, and when should I call the nurse?`,
    };
  }

  if (latest.pain - previous.pain >= 2 && latest.pain >= 5) {
    return {
      reason: `Pain rose since last check-in — talk to Ragna?`,
      message: `Pain went from ${previous.pain}/10 to ${latest.pain}/10 since the last check-in. Help me understand what that means.`,
    };
  }

  if (latest.breathlessness >= 6 && previous.breathlessness >= 6) {
    return {
      reason: `Breathlessness has been elevated — talk to Ragna?`,
      message: `Breathlessness has been ${latest.breathlessness}/10 or higher. What comfort measures should we try tonight?`,
    };
  }

  return null;
}