// ─────────────────────────────────────────────────────────────────────────────
// Legal Feature Scaffold Helpers
//
// createEmptyStateRegistry ensures every state has complete structure
// immediately, so the UI never breaks for unreviewed states.
// All scaffold content is clearly labeled "pending_review".
// ─────────────────────────────────────────────────────────────────────────────

import {
  LegalDocumentCategory,
  LegalDocumentEntry,
  LegalRequirement,
  LegalReviewMeta,
  ReviewStatus,
  SourceType,
  StateCode,
  StateLegalRegistry,
  StateSectionKey,
} from "./types";

export function createReviewMeta(
  status: ReviewStatus = "pending_review",
  owner = "Pending Legal Review",
  sourceType: SourceType = "internal_editorial",
  notes: string[] = [],
): LegalReviewMeta {
  return {
    reviewOwner: owner,
    reviewStatus: status,
    lastLegalReviewed: null,
    sourceType,
    sourceNotes: notes,
  };
}

export function createDocumentId(stateCode: StateCode, slug: string): string {
  return `${stateCode.toLowerCase()}_${slug}`;
}

const UNKNOWN_REQ: LegalRequirement = {
  required: "unknown",
  details: "Requirements are being reviewed. Check official state sources for current requirements.",
};

export function createPendingDocument(
  stateCode: StateCode,
  stateName: string,
  title: string,
  slug: string,
  category: LegalDocumentCategory,
  section: StateSectionKey,
  commonNames: string[] = [],
): LegalDocumentEntry {
  return {
    id: createDocumentId(stateCode, slug),
    stateCode,
    title,
    commonNames,
    category,
    section,
    summary: `${stateName} ${title} — state-specific guidance is being reviewed. This entry is a placeholder to ensure the feature is complete. Use official state sources for current, accurate information.`,
    whatItDoes: "Details for this document are pending review from official state sources.",
    whoItsFor: "Review official state guidance to understand who this document applies to.",
    whoSigns: ["See official state guidance"],
    witnessRequirement: UNKNOWN_REQ,
    notaryRequirement: UNKNOWN_REQ,
    specialRequirements: ["Verify current requirements with official state sources or an attorney."],
    honoredBy: [],
    honoredBySummary: "Check with your hospice team and EMS regarding recognition in your state.",
    outOfStateRecognition: "Out-of-state recognition varies. Consult with legal counsel if traveling or relocating.",
    howToCompleteSteps: [
      "Locate the official state form from the state health or attorney general website.",
      "Review the form instructions carefully.",
      "Complete the form per official instructions.",
      "Sign in front of required witnesses or notary if required.",
      "Provide copies to your healthcare team, proxy, and family.",
    ],
    storageGuidance: [
      "Keep the original in a known, accessible location.",
      "Give copies to your healthcare proxy, primary physician, and hospice team.",
      "Consider registering with your state's advance directive registry if one exists.",
    ],
    officialFormUrl: null,
    officialInfoUrl: null,
    additionalOfficialUrls: [],
    educationContent: {
      whyItMatters: "Medical and legal planning documents help ensure your wishes are known and honored, especially when you cannot speak for yourself.",
      whenToUseIt: "Complete these documents while you are able to make decisions. Do not wait for a crisis.",
      commonMistakes: [
        "Waiting too long to complete planning documents.",
        "Not telling family members where documents are stored.",
        "Using outdated forms.",
        "Not providing copies to your medical team.",
      ],
      questionsToAsk: [
        "Does this state have an official form?",
        "What are the witness and notary requirements?",
        "Does my state have a registry?",
        "Will EMS honor this document?",
      ],
    },
    review: createReviewMeta("pending_review"),
  };
}

export function createEmptyStateRegistry(
  stateCode: StateCode,
  stateName: string,
): StateLegalRegistry {
  return {
    stateCode,
    stateName,
    overview: {
      summary: `${stateName} legal and medical planning documents — content is being reviewed. Document categories and scaffolded entries are shown below. Use official state sources for current requirements.`,
      commonlyUsedDocuments: [
        "Advance Directive",
        "Health Care Decision Maker / Proxy",
        "POLST or Similar Medical Order",
        "DNR or EMS DNR",
      ],
      namingNotes: [
        "Document names vary by state. Always use official state terminology.",
        "A POLST in one state may be called MOLST, MOST, POLST, or another name in this state.",
      ],
      planningNotes: [
        "Review documents with your physician and legal counsel.",
        "Ensure your healthcare team has current copies of all completed documents.",
      ],
      importantWarnings: [
        "This content is pending review. Verify all requirements with official state sources.",
        "State laws and forms can change. Always use the most current official form.",
      ],
    },
    documents: [
      createPendingDocument(stateCode, stateName, "Advance Directive", "advance_directive", "advance_directive", "planning_documents", ["Living Will", "Healthcare Directive"]),
      createPendingDocument(stateCode, stateName, "Health Care Decision Maker", "decision_maker", "decision_maker", "decision_makers", ["Health Care Proxy", "Healthcare Agent", "Healthcare Power of Attorney"]),
      createPendingDocument(stateCode, stateName, "POLST or Similar Medical Order", "polst", "medical_order", "medical_orders", ["POLST", "MOLST", "MOST", "Portable Medical Order"]),
      createPendingDocument(stateCode, stateName, "DNR / EMS DNR", "dnr", "dnr", "medical_orders", ["Do Not Resuscitate", "Out-of-Hospital DNR", "EMS DNR"]),
      createPendingDocument(stateCode, stateName, "Guardianship Information", "guardianship", "guardianship", "court_based_authority", ["Legal Guardian", "Court-Appointed Guardian"]),
    ],
    registryInfo: {
      hasKnownRegistry: "unknown",
      registryName: null,
      registrySummary: "Registry information for this state is being reviewed. Check with your state health department.",
      registryLinks: [],
    },
    officialResources: [],
    review: createReviewMeta("pending_review"),
  };
}
