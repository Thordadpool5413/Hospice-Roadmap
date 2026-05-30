import { HOSPICE_KNOWLEDGE_CATALOG } from "./catalog.js";
import { detectCareGaps } from "./careGapModel.js";
import { findAllMatchingSymptoms } from "./symptomModel.js";
import { findDiseaseTrajectory } from "./diseaseModel.js";
import { findMatchingScenarios } from "./scenarioMap.js";
import { detectRedFlags } from "./redFlags.js";
import type { ConcernDomain, HospiceKnowledgeBlock, JourneyStage, UrgencyLevel } from "./types.js";

export interface RetrievalResult {
  blocks: HospiceKnowledgeBlock[];
  matchedDomains: ConcernDomain[];
  hasRedFlag: boolean;
  hasCall911: boolean;
}

const DOMAIN_PRIORITY_ORDER: ConcernDomain[] = [
  "urgent_red_flag",
  "time_of_death",
  "dying_process",
  "symptom_management",
  "after_death",
  "grief_bereavement",
  "middle_of_night",
  "care_gap",
  "communication_coaching",
  "caregiver_support",
  "disease_progression",
  "medication",
  "documentation_advocacy",
  "equipment_practical",
  "spiritual_existential",
  "pediatric_family",
];

export function retrieveKnowledgeBlocks(
  messageText: string,
  patientContext: string,
  urgency: UrgencyLevel,
  journeyStage: JourneyStage,
): RetrievalResult {
  const combinedText = `${messageText} ${patientContext}`.toLowerCase();

  // 1. Red flag check — highest priority
  const redFlags = detectRedFlags(combinedText);
  const hasCall911 = redFlags.some((rf) => rf.urgency === "call_911");
  const hasRedFlag = redFlags.length > 0;

  // 2. Scenario matching — find domain clusters
  const scenarios = findMatchingScenarios(combinedText);
  const scenarioDomains = new Set<ConcernDomain>();
  for (const s of scenarios) {
    s.domains.forEach((d) => scenarioDomains.add(d));
  }

  // 3. Symptom matching
  const symptoms = findAllMatchingSymptoms(combinedText);
  if (symptoms.length > 0) {
    scenarioDomains.add("symptom_management");
  }

  // 4. Disease trajectory — add disease_progression domain if recognized
  const disease = findDiseaseTrajectory(combinedText);
  if (disease) {
    scenarioDomains.add("disease_progression");
  }

  // 5. Care gap detection
  const careGaps = detectCareGaps(combinedText);
  if (careGaps.length > 0) {
    scenarioDomains.add("care_gap");
    scenarioDomains.add("documentation_advocacy");
  }

  // 6. Journey stage domain additions
  if (journeyStage === "at_death" || journeyStage === "hours") {
    scenarioDomains.add("time_of_death");
    scenarioDomains.add("dying_process");
  }
  if (journeyStage === "after_death" || journeyStage === "bereavement") {
    scenarioDomains.add("after_death");
    scenarioDomains.add("grief_bereavement");
  }
  if (journeyStage === "days") {
    scenarioDomains.add("dying_process");
  }

  // 7. Always include urgent_red_flag if urgency is high
  if (urgency === "critical" || urgency === "urgent") {
    scenarioDomains.add("urgent_red_flag");
  }

  // 8. Keyword-based domain detection for coverage
  addKeywordDomains(combinedText, scenarioDomains);

  // Build sorted domain list
  const matchedDomains = DOMAIN_PRIORITY_ORDER.filter((d) => scenarioDomains.has(d));

  // 9. Retrieve blocks for matched domains
  const selectedBlocks: HospiceKnowledgeBlock[] = [];
  const usedIds = new Set<string>();

  // Force-include CL001 (Crisis Care Levels) when SCN-CRISIS-CARE matches,
  // before the per-domain slice so it is never crowded out by other care_gap blocks.
  const hasCrisisScenario = scenarios.some((s) => s.scenarioId === "SCN-CRISIS-CARE");
  if (hasCrisisScenario) {
    const cl001 = HOSPICE_KNOWLEDGE_CATALOG.find((b) => b.id === "CL001");
    if (cl001) {
      selectedBlocks.push(cl001);
      usedIds.add(cl001.id);
    }
  }

  // Force-include AV002 (Revocation and Re-Enrollment) when SCN-REVOCATION matches,
  // because AV002 sits late in care_gap catalog order and is crowded out by the
  // per-domain slice before it can be selected.
  const hasRevocationScenario = scenarios.some((s) => s.scenarioId === "SCN-REVOCATION");
  if (hasRevocationScenario) {
    const av002 = HOSPICE_KNOWLEDGE_CATALOG.find((b) => b.id === "AV002");
    if (av002) {
      selectedBlocks.push(av002);
      usedIds.add(av002.id);
    }
  }

  // First: add any blocks that match by urgency + journey stage
  for (const domain of matchedDomains) {
    const domainBlocks = HOSPICE_KNOWLEDGE_CATALOG.filter((b) => {
      if (b.domain !== domain) return false;
      if (usedIds.has(b.id)) return false;
      // Journey stage filter
      if (journeyStage !== "unknown" && b.journeyStages.length > 0) {
        if (!b.journeyStages.includes(journeyStage)) return false;
      }
      return true;
    });

    for (const block of domainBlocks.slice(0, 2)) {
      if (!usedIds.has(block.id)) {
        selectedBlocks.push(block);
        usedIds.add(block.id);
      }
    }

    if (selectedBlocks.length >= 8) break;
  }

  // Second pass: if under 4 blocks, relax journey stage filter
  if (selectedBlocks.length < 4) {
    for (const domain of matchedDomains) {
      const domainBlocks = HOSPICE_KNOWLEDGE_CATALOG.filter(
        (b) => b.domain === domain && !usedIds.has(b.id)
      );
      for (const block of domainBlocks.slice(0, 2)) {
        if (!usedIds.has(block.id) && selectedBlocks.length < 6) {
          selectedBlocks.push(block);
          usedIds.add(block.id);
        }
      }
    }
  }

  return {
    blocks: selectedBlocks,
    matchedDomains,
    hasRedFlag,
    hasCall911,
  };
}

function addKeywordDomains(text: string, domains: Set<ConcernDomain>): void {
  const keywordMap: Array<[string[], ConcernDomain]> = [
    [["grief", "grieving", "bereavement", "mourning", "loss", "missing them"], "grief_bereavement"],
    [["caregiver", "exhausted", "burned out", "respite", "overwhelmed"], "caregiver_support"],
    [["pain", "hurting", "aching", "breathless", "breathing", "agitated", "restless", "nausea", "vomiting", "confused", "delirium", "fever", "wound", "bleed"], "symptom_management"],
    [["call hospice", "report", "SBAR", "what to say", "how to explain", "talk to family", "explain to", "children", "kids"], "communication_coaching"],
    [["complaint", "escalate", "file complaint", "document", "advocate", "rights", "what should hospice"], "documentation_advocacy"],
    [["medication", "morphine", "opioid", "comfort kit", "drug", "dose", "lorazepam", "haloperidol"], "medication"],
    [["dying", "death", "end of life", "final stage", "last days", "last hours"], "dying_process"],
    [["middle of the night", "3am", "2am", "night", "can't sleep", "alone at night"], "middle_of_night"],
    [["after death", "what happens after", "funeral", "body", "bereavement support"], "after_death"],
    [["cancer", "CHF", "COPD", "dementia", "Alzheimer", "ALS", "heart failure", "lung disease"], "disease_progression"],
    [["not responding", "vague answer", "dismissed", "ignored", "no callback", "no visit", "alone", "abandoned"], "care_gap"],
  ];

  for (const [keywords, domain] of keywordMap) {
    if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      domains.add(domain);
    }
  }
}

export function formatBlocksForPrompt(blocks: HospiceKnowledgeBlock[]): string {
  if (blocks.length === 0) return "";

  const sections = blocks.map((b) => {
    const lines: string[] = [
      `[${b.id}] ${b.title.toUpperCase()}`,
      `Summary: ${b.summary}`,
      `What may be happening: ${b.whatMayBeHappening}`,
      `What to do now: ${b.whatToDoNow}`,
      `What to say: ${b.whatToSay}`,
      `What to watch for: ${b.whatToWatchFor}`,
      `When to escalate: ${b.whenToEscalate}`,
    ];
    if (b.hardStops.length > 0) {
      lines.push(`HARD STOPS (Call 911 or urgent): ${b.hardStops.join(" | ")}`);
    }
    return lines.join("\n");
  });

  return sections.join("\n\n---\n\n");
}
