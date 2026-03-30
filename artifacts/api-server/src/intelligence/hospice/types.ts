// ─── Core Enumerations ────────────────────────────────────────────────────────

export type RoleType =
  | "caregiver"
  | "patient"
  | "family"
  | "friend"
  | "physician"
  | "nurse"
  | "social_worker"
  | "chaplain"
  | "other"
  | "unknown";

export type JourneyStage =
  | "newly_enrolled"     // Just starting hospice
  | "stable"             // Weeks to months expected
  | "weeks_to_days"      // Active decline, weeks remaining
  | "days"               // Active dying, 1-3 days
  | "hours"              // Imminent death, hours remaining
  | "at_death"           // Death has just occurred
  | "after_death"        // Immediate post-death period
  | "bereavement"        // Grief after death
  | "unknown";

export type ConcernDomain =
  | "symptom_management"
  | "dying_process"
  | "disease_progression"
  | "medication"
  | "time_of_death"
  | "after_death"
  | "grief_bereavement"
  | "caregiver_support"
  | "communication_coaching"
  | "care_gap"
  | "documentation_advocacy"
  | "spiritual_existential"
  | "pediatric_family"
  | "equipment_practical"
  | "middle_of_night"
  | "urgent_red_flag";

export type UrgencyLevel = "critical" | "urgent" | "moderate" | "routine";

export type AudienceStyle =
  | "distressed"         // Short sentences, anchor first
  | "grieving"           // Slow down, acknowledge, resist fixing
  | "information_seeking"// Full depth, clinical specificity
  | "exhausted"          // Acknowledge first, then most practical thing
  | "middle_of_night"    // Extra grounding and safety awareness
  | "professional";      // Clinical language appropriate

export type CareGapType =
  | "poor_education"
  | "no_preparation"
  | "delayed_callback"
  | "vague_after_hours"
  | "symptom_gap"
  | "equipment_delay"
  | "comfort_kit_confusion"
  | "family_feels_abandoned"
  | "time_of_death_unprepared"
  | "after_death_unprepared"
  | "inadequate_pain_control"
  | "inadequate_dyspnea_control";

export type ResponseQualityLevel = "crisis" | "urgent" | "educational" | "supportive";

// ─── Knowledge Block ──────────────────────────────────────────────────────────

export interface HospiceKnowledgeBlock {
  id: string;
  domain: ConcernDomain;
  title: string;
  tags: string[];                  // Keywords for retrieval matching
  urgency: UrgencyLevel;
  journeyStages: JourneyStage[];   // Which stages this applies to
  summary: string;                 // 1-2 sentence summary
  explanation: string;             // Clinical explanation
  whatMayBeHappening: string;      // Interpretation for caregiver
  whatToDoNow: string;             // Immediate action steps
  whatToSay: string;               // Exact language to use
  whatToWatchFor: string;          // Monitoring guidance
  whatNotToAssume: string;         // Common misinterpretations
  whenToEscalate: string;          // When to call hospice
  hardStops: string[];             // When to call 911
  relatedIds: string[];            // Links to other blocks
  sources: string[];               // Clinical references
}

// ─── Communication Playbook ───────────────────────────────────────────────────

export interface CommunicationPlaybook {
  id: string;
  targetAudience: RoleType;
  tone: string;
  goal: string;
  examplePhrases: string[];
  reportingStructure: string;
  commonMistakes: string[];
}

// ─── Care Gap Signal ──────────────────────────────────────────────────────────

export interface CareGapSignal {
  type: CareGapType;
  description: string;
  whatShouldHaveHappened: string;
  whatToAskFor: string;
  whatToSay: string;
  whatToDocument: string;
  whenToEscalateFurther: string;
}

// ─── Response Plan ────────────────────────────────────────────────────────────

export interface ResponsePlan {
  role: RoleType;
  journeyStage: JourneyStage;
  urgency: UrgencyLevel;
  audienceStyle: AudienceStyle;
  domains: ConcernDomain[];
  matchedScenario: string | null;
  retrievedBlockIds: string[];
  careGapSignals: CareGapType[];
  communicationMode: string;
  requiredSections: string[];
  mustSay: string[];
  mustAvoid: string[];
  suggestedFollowUps: string[];
  escalateNow: boolean;
  call911Now: boolean;
  injectedKnowledge: string;       // Formatted text injected into system prompt
}
