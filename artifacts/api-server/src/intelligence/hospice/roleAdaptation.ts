import type { AudienceStyle, JourneyStage, RoleType, UrgencyLevel } from "./types.js";

// ─── Role Detection ────────────────────────────────────────────────────────────

const ROLE_PATTERNS: Array<[RoleType, string[]]> = [
  ["patient", [
    "i am the patient", "i'm the patient", "i have", "my diagnosis", "my cancer",
    "my heart failure", "my dementia", "my hospice", "i'm in hospice", "i am in hospice",
    "my pain", "my breathing", "i feel", "can i take", "my medication",
  ]],
  ["caregiver", [
    "my mom", "my dad", "my mother", "my father", "my husband", "my wife", "my spouse",
    "my partner", "my patient", "i'm caring for", "i am caring for", "i take care of",
    "caregiver", "caring for", "my loved one", "she is", "he is", "they are in hospice",
    "my grandma", "my grandpa", "my grandmother", "my grandfather",
  ]],
  ["nurse", [
    "i'm a nurse", "i am a nurse", "as a nurse", "nursing", "my patient has",
    "hospice nurse", "palliative nurse", "rn", "lpn",
  ]],
  ["physician", [
    "i'm a physician", "i am a physician", "i'm a doctor", "as a physician",
    "my patient", "medical director", "hospice physician", "attending physician",
  ]],
  ["social_worker", [
    "social worker", "i'm a social worker", "as a social worker", "case manager",
  ]],
  ["chaplain", [
    "chaplain", "i'm a chaplain", "as a chaplain", "spiritual care",
  ]],
  ["family", [
    "my brother", "my sister", "my sibling", "my aunt", "my uncle", "my son",
    "my daughter", "my child", "our family", "family member",
  ]],
  ["friend", [
    "my friend", "my best friend", "i'm the friend", "close friend",
  ]],
];

export function detectRole(messageText: string): RoleType {
  const lower = messageText.toLowerCase();
  for (const [role, patterns] of ROLE_PATTERNS) {
    if (patterns.some((p) => lower.includes(p))) {
      return role;
    }
  }
  return "unknown";
}

// ─── Journey Stage Detection ───────────────────────────────────────────────────

const STAGE_PATTERNS: Array<[JourneyStage, string[]]> = [
  ["at_death", [
    "just died", "i think they died", "stopped breathing", "passed away", "she died", "he died",
    "no longer breathing", "died this morning", "died tonight",
  ]],
  ["hours", [
    "not responding", "won't wake", "hard to wake", "unresponsive", "completely unconscious",
    "jaw dropped", "hands very dark", "mottling everywhere", "hours left",
  ]],
  ["days", [
    "actively dying", "active dying", "mottling", "death rattle", "gurgling breathing",
    "cheyne-stokes", "not waking", "days left", "last few days",
  ]],
  ["weeks_to_days", [
    "sleeping more", "eating nothing", "withdrawing", "visions", "seeing dead relatives",
    "weeks to days", "weeks to live", "close to the end", "how long left",
  ]],
  ["after_death", [
    "after the death", "after they died", "funeral home", "death certificate", "bereavement",
    "since the death", "since she passed", "since he passed",
  ]],
  ["bereavement", [
    "grief", "grieving", "missing them", "it's been months", "it's been weeks since",
  ]],
  ["newly_enrolled", [
    "just enrolled", "just started hospice", "new to hospice", "recently started",
    "just signed up", "first week",
  ]],
];

export function detectJourneyStage(messageText: string): JourneyStage {
  const lower = messageText.toLowerCase();
  for (const [stage, patterns] of STAGE_PATTERNS) {
    if (patterns.some((p) => lower.includes(p))) {
      return stage;
    }
  }
  return "unknown";
}

// ─── Urgency Detection ─────────────────────────────────────────────────────────

const CRITICAL_PHRASES = [
  "call 911", "bleeding heavily", "hemorrhage", "stopped breathing",
  "just died", "she died", "he died", "no dnr", "emergency",
  "thoughts of suicide", "want to hurt myself", "want to die",
  "fire", "collapsed",
];

const URGENT_PHRASES = [
  "severe pain", "pain 8", "pain 9", "pain 10", "can't breathe",
  "breathing very bad", "very agitated", "not responding", "unresponsive",
  "mottling", "death rattle", "not waking", "won't wake",
  "seizing", "seizure", "no callback", "hospice not responding",
  "can't reach hospice", "icd fired", "shocked",
];

const MODERATE_PHRASES = [
  "middle of the night", "confused", "not eating", "not drinking",
  "feel alone", "overwhelmed", "scared", "agitated", "pain is",
  "breathless", "breathing difficulty", "can't sleep", "afraid",
];

export function detectUrgency(messageText: string): UrgencyLevel {
  const lower = messageText.toLowerCase();
  if (CRITICAL_PHRASES.some((p) => lower.includes(p))) return "critical";
  if (URGENT_PHRASES.some((p) => lower.includes(p))) return "urgent";
  if (MODERATE_PHRASES.some((p) => lower.includes(p))) return "moderate";
  return "routine";
}

// ─── Audience Style Detection ──────────────────────────────────────────────────

export function detectAudienceStyle(
  messageText: string,
  urgency: UrgencyLevel,
): AudienceStyle {
  const lower = messageText.toLowerCase();
  const hour = new Date().getHours();

  if (urgency === "critical" || urgency === "urgent") return "distressed";
  if (hour >= 22 || hour < 6) return "middle_of_night";

  const grievingWords = ["grief", "crying", "sobbing", "devastated", "heartbroken", "I miss", "lost them", "they're gone"];
  if (grievingWords.some((w) => lower.includes(w))) return "grieving";

  const exhaustionWords = ["exhausted", "burned out", "can't do this", "breaking down", "so tired", "no energy"];
  if (exhaustionWords.some((w) => lower.includes(w))) return "exhausted";

  const professionalWords = ["my patient", "as a nurse", "as a physician", "clinical", "assessment", "protocol"];
  if (professionalWords.some((w) => lower.includes(w))) return "professional";

  const infoWords = ["explain", "what is", "how does", "tell me about", "understand", "learn about", "what happens when"];
  if (infoWords.some((w) => lower.includes(w))) return "information_seeking";

  return "information_seeking";
}

// ─── Time of Night Check ──────────────────────────────────────────────────────

export function isMiddleOfNight(): boolean {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 6;
}

// ─── Response Length Guidance ────────────────────────────────────────────────

export function getResponseLengthGuidance(style: AudienceStyle, urgency: UrgencyLevel): string {
  if (urgency === "critical") {
    return "CRISIS MODE: Very short. Lead with what to do RIGHT NOW in numbered steps. Max 3 sentences of acknowledgment. No lengthy explanations.";
  }
  if (urgency === "urgent") {
    return "URGENT MODE: Short-medium. Acknowledge briefly (1-2 sentences), then give specific action steps. Keep moving toward the practical.";
  }
  if (style === "grieving") {
    return "GRIEF MODE: Slow and present. Acknowledge first and at length. Resist the urge to fix or explain. Clinical information can wait.";
  }
  if (style === "exhausted") {
    return "EXHAUSTION MODE: Acknowledge their exhaustion directly. Then give only the most practical, essential thing. Do not overwhelm.";
  }
  if (style === "middle_of_night") {
    return "NIGHT MODE: Grounding first. Safety check. Then clear practical steps. Be extra steady.";
  }
  if (style === "professional") {
    return "PROFESSIONAL MODE: Clinical language appropriate. Can go deeper on pharmacology, protocols, and assessment. Still warm but more direct.";
  }
  return "EDUCATIONAL MODE: Full depth appropriate. Clinical specificity welcome. Tables and structure if helpful.";
}
