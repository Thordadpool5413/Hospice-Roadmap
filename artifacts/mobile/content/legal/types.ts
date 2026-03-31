// ─────────────────────────────────────────────────────────────────────────────
// Legal Documents Feature — Type Definitions
//
// LEGAL REVIEW NOTES:
// - This feature requires ongoing legal review as state laws change.
// - "reviewed" status requires verified official source URLs.
// - "pending_review" content is educational scaffolding — never auto-promote.
// - All summaries are educational only, not legal advice.
// - Do not assume one state's rules apply to another.
// ─────────────────────────────────────────────────────────────────────────────

export type StateCode =
  | "AL" | "AK" | "AZ" | "AR" | "CA" | "CO" | "CT" | "DE" | "DC"
  | "FL" | "GA" | "HI" | "ID" | "IL" | "IN" | "IA" | "KS" | "KY"
  | "LA" | "ME" | "MD" | "MA" | "MI" | "MN" | "MS" | "MO" | "MT"
  | "NE" | "NV" | "NH" | "NJ" | "NM" | "NY" | "NC" | "ND" | "OH"
  | "OK" | "OR" | "PA" | "RI" | "SC" | "SD" | "TN" | "TX" | "UT"
  | "VT" | "VA" | "WA" | "WV" | "WI" | "WY";

export type LegalDocumentCategory =
  | "medical_order"
  | "advance_directive"
  | "healthcare_proxy"
  | "medical_power_of_attorney"
  | "decision_maker"
  | "living_will"
  | "dnr"
  | "dni"
  | "polst_family"
  | "guardianship"
  | "conservatorship"
  | "registry"
  | "other";

export type StateSectionKey =
  | "medical_orders"
  | "decision_makers"
  | "planning_documents"
  | "court_based_authority"
  | "registries"
  | "other";

export type ReviewStatus =
  | "reviewed"
  | "pending_review"
  | "source_only"
  | "needs_update";

export type SourceType =
  | "official_state_source"
  | "official_health_source"
  | "official_court_source"
  | "official_attorney_general_source"
  | "official_legislative_source"
  | "national_reference"
  | "internal_editorial";

export interface LegalRequirement {
  required: boolean | "varies" | "unknown";
  details: string;
}

export interface LegalSourceLink {
  label: string;
  url: string;
  sourceType: SourceType;
  isOfficial: boolean;
}

export interface LegalReviewMeta {
  reviewOwner: string;
  reviewStatus: ReviewStatus;
  lastLegalReviewed: string | null;
  sourceType: SourceType;
  sourceNotes: string[];
}

export interface LegalDocumentEntry {
  id: string;
  stateCode: StateCode;
  title: string;
  commonNames: string[];
  category: LegalDocumentCategory;
  section: StateSectionKey;
  summary: string;
  whatItDoes: string;
  whoItsFor: string;
  whoSigns: string[];
  witnessRequirement: LegalRequirement;
  notaryRequirement: LegalRequirement;
  specialRequirements: string[];
  honoredBy: string[];
  honoredBySummary: string;
  outOfStateRecognition: string;
  howToCompleteSteps: string[];
  storageGuidance: string[];
  officialFormUrl: string | null;
  officialInfoUrl: string | null;
  additionalOfficialUrls: LegalSourceLink[];
  educationContent: {
    whyItMatters: string;
    whenToUseIt: string;
    commonMistakes: string[];
    questionsToAsk: string[];
  };
  review: LegalReviewMeta;
}

export interface StateOverview {
  summary: string;
  commonlyUsedDocuments: string[];
  namingNotes: string[];
  planningNotes: string[];
  importantWarnings: string[];
}

export interface StateRegistryInfo {
  hasKnownRegistry: boolean | "unknown";
  registryName: string | null;
  registrySummary: string;
  registryLinks: LegalSourceLink[];
}

export interface StateLegalRegistry {
  stateCode: StateCode;
  stateName: string;
  overview: StateOverview;
  documents: LegalDocumentEntry[];
  registryInfo: StateRegistryInfo;
  officialResources: LegalSourceLink[];
  review: LegalReviewMeta;
}
