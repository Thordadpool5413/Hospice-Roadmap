import AsyncStorage from "@react-native-async-storage/async-storage";

import { DrugInteractionPair, DrugInteractionResult } from "@/types";
import { fetchFdaLabel } from "./fdaService";

// ─── Pair-result cache ────────────────────────────────────────────────────────

const INTERACTION_CACHE_KEY_PREFIX = "@drug_interactions_v1:";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function buildCacheKey(sortedNames: string[]): string {
  return INTERACTION_CACHE_KEY_PREFIX + sortedNames.map((n) => n.toLowerCase().trim()).sort().join("|");
}

export async function getCachedInteractionResult(
  medicationNames: string[]
): Promise<DrugInteractionResult | null> {
  try {
    const key = buildCacheKey(medicationNames);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const result = JSON.parse(raw) as DrugInteractionResult;
    const age = Date.now() - new Date(result.checkedAt).getTime();
    if (age > CACHE_TTL_MS) return null;
    return result;
  } catch {
    return null;
  }
}

async function setCachedInteractionResult(result: DrugInteractionResult): Promise<void> {
  try {
    const key = buildCacheKey(result.medications);
    await AsyncStorage.setItem(key, JSON.stringify(result));
  } catch {
    // ignore storage errors
  }
}

// ─── Severity classification ──────────────────────────────────────────────────

const SERIOUS_PATTERNS = [
  /\bfatal\b/i,
  /\blife[\s-]threatening\b/i,
  /\bcontraindicated\b/i,
  /\bsevere\b/i,
  /\bdo not use\b/i,
  /\bavoid concomitant\b/i,
  /\brespiratory depression\b/i,
  /\brespiratory arrest\b/i,
  /\bcardiac arrest\b/i,
  /\bserotonin syndrome\b/i,
  /\bQT prolongation\b/i,
];

const MONITOR_PATTERNS = [
  /\bcaution\b/i,
  /\bmonitor\b/i,
  /\bmay increase\b/i,
  /\bpotential\b/i,
  /\badditive\b/i,
  /\benhanced effect\b/i,
  /\breduces\b/i,
  /\binteract/i,
  /\bCNS depression\b/i,
  /\bsedation\b/i,
  /\bprolongs\b/i,
];

function classifySeverity(text: string): DrugInteractionPair["severity"] {
  if (SERIOUS_PATTERNS.some((p) => p.test(text))) return "serious";
  if (MONITOR_PATTERNS.some((p) => p.test(text))) return "monitor";
  return "none";
}

// ─── Plain-language summarizer ────────────────────────────────────────────────

/**
 * Condenses raw FDA label interaction text about a specific drug into
 * 1–2 plain sentences suitable for a caregiver. Uses local heuristics.
 */
function summarizeInteraction(rawText: string, targetDrug: string): string {
  const lower = rawText.toLowerCase();
  const target = targetDrug.toLowerCase();

  // Find the sentence(s) most relevant to the target drug
  const sentences = rawText
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 10);

  const relevant = sentences.filter((s) => s.toLowerCase().includes(target));

  if (relevant.length > 0) {
    // Take the most relevant sentence and the one after it if present
    const firstIdx = sentences.indexOf(relevant[0]);
    const summary = [sentences[firstIdx], sentences[firstIdx + 1]]
      .filter(Boolean)
      .join(" ")
      .trim();
    return truncateSummary(summary);
  }

  // Fallback: try to find key interaction info in the text
  const keyPhrases = [
    /CNS depression[^.]*\./i,
    /respiratory depression[^.]*\./i,
    /additive[^.]*\./i,
    /caution[^.]*\./i,
    /monitor[^.]*\./i,
  ];

  for (const phrase of keyPhrases) {
    const match = rawText.match(phrase);
    if (match) return truncateSummary(match[0].trim());
  }

  // Last resort: return first 200 chars of the raw text
  return truncateSummary(rawText.trim());
}

function truncateSummary(text: string, maxLen = 220): string {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

// ─── Core checker ─────────────────────────────────────────────────────────────

/**
 * Check for interactions between all pairs of the given medication names.
 * Results are cached in AsyncStorage for 24 hours.
 *
 * @param medicationNames Array of drug names (e.g. ["Morphine", "Lorazepam"])
 * @param options.bypassCache Force fresh fetch even if cache is valid
 */
export async function checkInteractions(
  medicationNames: string[],
  options?: { bypassCache?: boolean }
): Promise<DrugInteractionResult> {
  if (medicationNames.length < 2) {
    return {
      checkedAt: new Date().toISOString(),
      medications: medicationNames,
      pairs: [],
    };
  }

  if (!options?.bypassCache) {
    const cached = await getCachedInteractionResult(medicationNames);
    if (cached) return cached;
  }

  // Fetch all FDA labels in parallel
  const labels = await Promise.all(
    medicationNames.map((name) => fetchFdaLabel(name, { bypassCache: options?.bypassCache }))
  );

  const pairs: DrugInteractionPair[] = [];

  // Check each pair: for drugA, look at its interactions text for mentions of drugB
  for (let i = 0; i < medicationNames.length; i++) {
    for (let j = i + 1; j < medicationNames.length; j++) {
      const nameA = medicationNames[i];
      const nameB = medicationNames[j];
      const labelA = labels[i];
      const labelB = labels[j];

      let severity: DrugInteractionPair["severity"] = "none";
      let summary = "";
      let rawText = "";

      // Check drug A's label for mentions of drug B
      if (labelA?.drugInteractions) {
        const textA = labelA.drugInteractions;
        const mentionsBInA = textA.toLowerCase().includes(nameB.toLowerCase()) ||
          (labelB?.genericName && textA.toLowerCase().includes(labelB.genericName.toLowerCase()));
        if (mentionsBInA) {
          const sev = classifySeverity(textA);
          const summ = summarizeInteraction(textA, nameB);
          if (sev !== "none" || summ) {
            severity = sev;
            summary = summ;
            rawText = textA.slice(0, 500);
          }
        }
      }

      // Check drug B's label for mentions of drug A (take worse severity)
      if (labelB?.drugInteractions) {
        const textB = labelB.drugInteractions;
        const mentionsAInB = textB.toLowerCase().includes(nameA.toLowerCase()) ||
          (labelA?.genericName && textB.toLowerCase().includes(labelA.genericName.toLowerCase()));
        if (mentionsAInB) {
          const sevB = classifySeverity(textB);
          const summB = summarizeInteraction(textB, nameA);
          const sevOrder: Record<DrugInteractionPair["severity"], number> = { none: 0, monitor: 1, serious: 2 };
          if (sevOrder[sevB] > sevOrder[severity]) {
            severity = sevB;
            summary = summB;
            rawText = textB.slice(0, 500);
          } else if (severity === "none" && summB) {
            summary = summB;
            rawText = textB.slice(0, 500);
          }
        }
      }

      // If we found any interaction data, include the pair
      // Also include pairs where both have labels but interaction not mentioned — classify as no-interaction-found
      if (severity !== "none" || summary) {
        pairs.push({ drugA: nameA, drugB: nameB, severity, summary, rawText: rawText || undefined });
      } else if (labelA?.drugInteractions || labelB?.drugInteractions) {
        // Labels exist but no cross-mention — no significant interaction found for this pair
        pairs.push({
          drugA: nameA,
          drugB: nameB,
          severity: "none",
          summary: "",
        });
      }
    }
  }

  const result: DrugInteractionResult = {
    checkedAt: new Date().toISOString(),
    medications: medicationNames,
    pairs,
  };

  await setCachedInteractionResult(result);
  return result;
}
