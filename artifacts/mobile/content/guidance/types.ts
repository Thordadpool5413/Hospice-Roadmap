// ─── Existing types (canonical home) ────────────────────────────────────────
// These were previously in data/guidanceContent.ts and are re-exported from
// there for backward compatibility.

export type UrgencyLevel = "immediate" | "soon" | "routine";

export type GuidanceCategoryId =
  | "symptoms"
  | "caregiving"
  | "medications"
  | "equipment"
  | "emotional"
  | "hospice-services"
  | "end-of-life"
  | "unsure";

export interface GuidanceStep {
  text: string;
  tip?: string;
  caution?: string;
}

export interface GuidanceScenario {
  id: string;
  categoryId: GuidanceCategoryId;
  title: string;
  subtitle: string;
  urgencyLevel: UrgencyLevel;
  icon: string;
  tags: string[];
  whatYouMayNotice: string[];
  whatItMeans: string;
  whatToDoNow: GuidanceStep[];
  whatToAvoid: string[];
  whenToCallHospice: string[];
  whatHappensNext: string;
  callHospiceNow?: boolean;
}

export interface GuidanceCategory {
  id: GuidanceCategoryId;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bgColor: string;
  scenarios: GuidanceScenario[];
}

// ─── New governance + structured content types ────────────────────────────────

/** Journey stage the item is most relevant to. Mirrors app-level JourneyStage. */
export type GuidanceStage = "before" | "during" | "after";

/** Urgency classification (superset of UrgencyLevel; adds "planning"). */
export type GuidanceUrgency = "immediate" | "soon" | "routine" | "planning";

/** Content governance metadata — readiness for clinical review workflows. */
export interface GuidanceGovernance {
  owner: string;
  reviewDate: string | null;
  approved: boolean;
  version: string;
  sourceType: "clinical_editorial" | "operational" | "product";
  notes?: string;
}

/**
 * Structured content item — extends GuidanceScenario with governance metadata,
 * journey stage targeting, related-item links, and normalized keyword fields.
 * The body/structured fields from GuidanceScenario are preserved (whatYouMayNotice,
 * whatItMeans, whatToDoNow, etc.) rather than flattened.
 */
export interface GuidanceContentItem extends GuidanceScenario {
  /** Journey stages this item is most relevant for. */
  stages: GuidanceStage[];
  /** Normalized keyword list — mirrors tags for searchability. */
  keywords: string[];
  /** Optional clinical symptom keywords separate from general tags. */
  symptoms?: string[];
  /** IDs of related guidance items for cross-linking. */
  relatedIds?: string[];
  /** Content governance metadata for review and ownership tracking. */
  governance: GuidanceGovernance;
}
