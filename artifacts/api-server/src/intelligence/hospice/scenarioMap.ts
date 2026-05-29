import type { ConcernDomain, JourneyStage, UrgencyLevel } from "./types.js";

export interface ScenarioMatch {
  scenarioId: string;
  label: string;
  domains: ConcernDomain[];
  journeyStages: JourneyStage[];
  urgency: UrgencyLevel;
  keywords: string[];
  negativeKeywords?: string[];  // Must NOT be present for match
}

export const SCENARIO_MAP: ScenarioMatch[] = [

  // ─── DEATH AND DYING ────────────────────────────────────────────────────────

  {
    scenarioId: "SCN-DIED",
    label: "Patient has just died",
    domains: ["time_of_death", "after_death"],
    journeyStages: ["at_death"],
    urgency: "urgent",
    keywords: ["i think they died", "just died", "stopped breathing", "i think she died", "i think he died", "passed away", "just passed", "no longer breathing", "died"],
    negativeKeywords: ["afraid", "worried", "going to die", "might die", "may die"],
  },
  {
    scenarioId: "SCN-DYING-NOW",
    label: "Patient appears to be actively dying now",
    domains: ["dying_process", "symptom_management"],
    journeyStages: ["hours", "days"],
    urgency: "urgent",
    keywords: ["not responding", "won't wake", "hard to wake", "unresponsive", "unconscious", "mottling", "death rattle", "not breathing right", "Cheyne-Stokes", "gurgling", "cold feet", "cold hands", "very dark legs", "spotted legs"],
  },
  {
    scenarioId: "SCN-DYING-DAYS",
    label: "Signs of active dying — days timeline",
    domains: ["dying_process"],
    journeyStages: ["days", "weeks_to_days"],
    urgency: "moderate",
    keywords: ["sleeping all day", "won't eat", "won't drink", "withdrawing", "not eating", "not drinking", "stopped eating", "seeing people", "talking to dead", "visions", "mottled feet", "feet spotted", "mottling feet", "how long does she have", "how long does he have", "how much time", "is this the end"],
  },
  {
    scenarioId: "SCN-AFTER-DEATH",
    label: "Period after death — practical and grief support",
    domains: ["after_death", "grief_bereavement"],
    journeyStages: ["after_death", "bereavement"],
    urgency: "moderate",
    keywords: ["she died", "he died", "they died", "died yesterday", "died today", "just died", "after the death", "funeral home", "what happens now", "they're gone", "passed this morning", "passed last night"],
  },

  // ─── URGENT SYMPTOMS ─────────────────────────────────────────────────────────

  {
    scenarioId: "SCN-SEVERE-PAIN",
    label: "Uncontrolled severe pain",
    domains: ["symptom_management", "urgent_red_flag"],
    journeyStages: ["stable", "weeks_to_days", "days"],
    urgency: "urgent",
    keywords: ["severe pain", "pain is 8", "pain is 9", "pain is 10", "pain 8/10", "pain 9/10", "pain 10/10", "excruciating", "in agony", "screaming in pain", "pain isn't controlled", "pain not controlled", "breakthrough not working"],
  },
  {
    scenarioId: "SCN-BREATHING-DISTRESS",
    label: "Acute breathing distress",
    domains: ["symptom_management", "urgent_red_flag"],
    journeyStages: ["stable", "weeks_to_days", "days", "hours"],
    urgency: "urgent",
    keywords: ["can't breathe", "trouble breathing", "difficulty breathing", "severe breathlessness", "gasping", "breathing very fast", "labored breathing", "suffocating", "respiratory distress", "fighting to breathe"],
  },
  {
    scenarioId: "SCN-AGITATION",
    label: "Terminal agitation or restlessness",
    domains: ["symptom_management"],
    journeyStages: ["days", "weeks_to_days"],
    urgency: "urgent",
    keywords: ["very agitated", "terminal restlessness", "trying to get out", "picking at", "calling out", "moaning loudly", "extremely restless", "extremely agitated", "won't stay in bed", "thrashing"],
  },
  {
    scenarioId: "SCN-BLEED",
    label: "Bleeding event",
    domains: ["symptom_management", "urgent_red_flag"],
    journeyStages: ["stable", "weeks_to_days", "days"],
    urgency: "critical",
    keywords: ["bleeding", "blood everywhere", "hemorrhage", "coughing blood", "blood in vomit", "rectal blood", "massive bleed"],
  },

  // ─── MIDDLE OF NIGHT ─────────────────────────────────────────────────────────

  {
    scenarioId: "SCN-NIGHT-FEAR",
    label: "Middle of night fear and uncertainty",
    domains: ["middle_of_night", "caregiver_support"],
    journeyStages: ["stable", "weeks_to_days", "days"],
    urgency: "moderate",
    keywords: ["middle of the night", "3 am", "2 am", "4 am", "can't sleep", "up at night", "night fear", "scared tonight", "alone tonight", "no one to call", "afraid tonight"],
  },

  // ─── GRIEF ───────────────────────────────────────────────────────────────────

  {
    scenarioId: "SCN-GRIEF-CAREGIVER",
    label: "Caregiver grief or overwhelm",
    domains: ["grief_bereavement", "caregiver_support"],
    journeyStages: ["stable", "weeks_to_days", "bereavement", "after_death"],
    urgency: "moderate",
    keywords: ["I'm overwhelmed", "can't do this", "breaking down", "I feel guilty", "feel so guilty", "anticipatory grief", "grieving while alive", "crying all the time", "exhausted from grief", "I feel relief", "relieved they died", "caregiver grief"],
  },
  {
    scenarioId: "SCN-GRIEF-CHILD",
    label: "Child grief support",
    domains: ["grief_bereavement", "communication_coaching"],
    journeyStages: ["weeks_to_days", "after_death", "bereavement"],
    urgency: "routine",
    keywords: ["explain to children", "tell my kids", "explaining to grandchildren", "how to tell a child", "children asking", "kids asking", "what to tell my child", "child doesn't understand", "my kids are struggling"],
  },

  // ─── COMMUNICATION ────────────────────────────────────────────────────────────

  {
    scenarioId: "SCN-CALL-HOSPICE",
    label: "Preparing to call hospice",
    domains: ["communication_coaching"],
    journeyStages: ["stable", "weeks_to_days", "days"],
    urgency: "moderate",
    keywords: ["call hospice", "prepare to call", "what to say to nurse", "how to call", "SBAR", "call the nurse", "what do I tell them"],
  },
  {
    scenarioId: "SCN-FAMILY-MEETING",
    label: "Talking to family about dying",
    domains: ["communication_coaching"],
    journeyStages: ["stable", "weeks_to_days", "days"],
    urgency: "moderate",
    keywords: ["family meeting", "tell the family", "family doesn't know", "talking to my family", "my family won't accept", "family conflict", "family disagrees", "family in denial"],
  },
  {
    scenarioId: "SCN-TALK-PHYSICIAN",
    label: "Communicating with the physician",
    domains: ["communication_coaching"],
    journeyStages: ["stable", "weeks_to_days"],
    urgency: "routine",
    keywords: ["what to say to the doctor", "talk to the doctor", "physician", "what to tell the doctor", "doctor isn't listening", "doctor not helping"],
  },

  // ─── CARE GAPS ────────────────────────────────────────────────────────────────

  {
    scenarioId: "SCN-NO-RESPONSE",
    label: "Hospice not responding",
    domains: ["care_gap", "documentation_advocacy"],
    journeyStages: ["stable", "weeks_to_days", "days"],
    urgency: "urgent",
    keywords: ["no callback", "not calling back", "can't reach hospice", "no response", "waiting for hours", "hospice not responding", "no one answering"],
  },
  {
    scenarioId: "SCN-NOT-PREPARED",
    label: "Family not prepared for what is happening",
    domains: ["care_gap", "dying_process"],
    journeyStages: ["newly_enrolled", "stable", "weeks_to_days"],
    urgency: "moderate",
    keywords: ["no one explained", "wasn't prepared", "nobody told me", "we weren't taught", "no one said", "I didn't know this would happen", "why is this happening", "what is happening to them"],
  },
  {
    scenarioId: "SCN-UNDERTREATED",
    label: "Symptoms undertreated — advocacy needed",
    domains: ["care_gap", "documentation_advocacy"],
    journeyStages: ["stable", "weeks_to_days", "days"],
    urgency: "urgent",
    keywords: ["pain not treated", "hospice not helping", "medications not working", "nurse said just wait", "told to just watch", "hospice isn't doing anything", "being dismissed"],
  },

  // ─── DISEASE AND TRAJECTORY ───────────────────────────────────────────────────

  {
    scenarioId: "SCN-DISEASE-EDUCATION",
    label: "Questions about disease progression",
    domains: ["disease_progression", "dying_process"],
    journeyStages: ["newly_enrolled", "stable", "weeks_to_days"],
    urgency: "routine",
    keywords: ["what happens with", "what does cancer do", "how does dementia progress", "what is the trajectory", "how long does CHF", "how does COPD end", "what will happen to them", "what to expect with"],
  },

  // ─── DOCUMENTATION ────────────────────────────────────────────────────────────

  {
    scenarioId: "SCN-DOCUMENTATION",
    label: "Documentation and advocacy guidance",
    domains: ["documentation_advocacy"],
    journeyStages: ["stable", "weeks_to_days", "days"],
    urgency: "routine",
    keywords: ["how to document", "what to write down", "how to file complaint", "document this", "keep track of", "write down", "document care"],
  },

  // ─── CRISIS CARE LEVELS ──────────────────────────────────────────────────────

  {
    scenarioId: "SCN-CRISIS-CARE",
    label: "Caregiver needs crisis-level care — CHC or GIP",
    domains: ["care_gap", "symptom_management"],
    journeyStages: ["stable", "weeks_to_days", "days", "hours"],
    urgency: "urgent",
    keywords: [
      "can't manage at home", "cannot manage", "need a nurse here", "need someone here",
      "can I get a nurse to stay", "nurse to stay overnight", "nurse stay all night",
      "request continuous care", "continuous home care", "crisis care level",
      "general inpatient", "GIP care", "inpatient hospice", "hospital level hospice",
      "should I call 911", "thinking about calling 911", "considering 911",
      "symptoms out of control", "nothing is working", "medications aren't helping",
      "comfort kit not working", "breakthrough not working and", "pain is uncontrollable",
      "can't control the pain", "breathing is uncontrollable", "can't control the breathing",
      "agitation is uncontrollable", "can't control the agitation",
      "nausea is uncontrollable", "vomiting everything", "can't keep anything down",
      "unsafe at home", "I'm scared to be alone with", "need more help than phone",
    ],
  },

  // ─── CAREGIVER ────────────────────────────────────────────────────────────────

  {
    scenarioId: "SCN-CAREGIVER-BURNOUT",
    label: "Caregiver overwhelm and burnout",
    domains: ["caregiver_support"],
    journeyStages: ["stable", "weeks_to_days"],
    urgency: "moderate",
    keywords: ["I'm burned out", "caregiver burnout", "can't keep doing this", "I need a break", "respite", "so exhausted", "I have nothing left", "can't cope"],
  },
];

export function findMatchingScenarios(messageText: string): ScenarioMatch[] {
  const lower = messageText.toLowerCase();
  return SCENARIO_MAP.filter((scenario) => {
    const hasKeyword = scenario.keywords.some((kw) => lower.includes(kw.toLowerCase()));
    if (!hasKeyword) return false;
    const hasNegative = scenario.negativeKeywords?.some((kw) => lower.includes(kw.toLowerCase()));
    return !hasNegative;
  });
}

export function findBestScenario(messageText: string): ScenarioMatch | null {
  const matches = findMatchingScenarios(messageText);
  if (matches.length === 0) return null;
  // Prefer higher urgency matches
  const urgencyOrder: UrgencyLevel[] = ["critical", "urgent", "moderate", "routine"];
  matches.sort((a, b) => urgencyOrder.indexOf(a.urgency) - urgencyOrder.indexOf(b.urgency));
  return matches[0] ?? null;
}
