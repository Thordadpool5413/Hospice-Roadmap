// ─────────────────────────────────────────────────────────────────────────────
// Legal Feature Registry
//
// How this works:
// 1. Only legally-reviewed states are published. Each reviewed state lives in
//    content/legal/reviewed/<state>.ts and is added to REVIEWED_REGISTRIES below.
// 2. Unreviewed states are intentionally NOT scaffolded with placeholder content.
//    Showing auto-generated legal guidance would be misleading, so those states
//    are surfaced to users as "coming soon" instead.
//
// To publish a new state:
//    a. Create content in content/legal/reviewed/<state>.ts
//    b. Import it here
//    c. Add it to REVIEWED_REGISTRIES
//
// LEGAL REVIEW NOTES:
// - Reviewed states require verified official source URLs.
// - State laws and forms change. Reviewed dates must be checked periodically.
// ─────────────────────────────────────────────────────────────────────────────

import { CALIFORNIA } from "./reviewed/california";
import { FLORIDA } from "./reviewed/florida";
import { MASSACHUSETTS } from "./reviewed/massachusetts";
import { STATE_DIRECTORY } from "./stateDirectory";
import { StateCode, StateLegalRegistry } from "./types";

// ─── Reviewed states (the only published legal content) ───────────────────────
// Add new reviewed states here as they are completed.
const REVIEWED_REGISTRIES: StateLegalRegistry[] = [
  FLORIDA,
  MASSACHUSETTS,
  CALIFORNIA,
];

export const LEGAL_REGISTRIES: StateLegalRegistry[] = REVIEWED_REGISTRIES;

export const LEGAL_REGISTRY_MAP = new Map<StateCode, StateLegalRegistry>(
  LEGAL_REGISTRIES.map((r) => [r.stateCode, r]),
);

export const REVIEWED_STATE_CODES: StateCode[] = REVIEWED_REGISTRIES.map((r) => r.stateCode);

// ─── Convenience: lookup by code ──────────────────────────────────────────────
export function getStateRegistry(code: StateCode): StateLegalRegistry | undefined {
  return LEGAL_REGISTRY_MAP.get(code);
}

export function getDocumentById(id: string): { doc: import("./types").LegalDocumentEntry; state: StateLegalRegistry } | undefined {
  for (const state of LEGAL_REGISTRIES) {
    const doc = state.documents.find((d) => d.id === id);
    if (doc) return { doc, state };
  }
  return undefined;
}

// ─── Recognized states that do not yet have published (reviewed) content ──────
export const PENDING_STATE_CODES: StateCode[] = STATE_DIRECTORY
  .map((s) => s.code)
  .filter((code) => !LEGAL_REGISTRY_MAP.has(code));

/** True when the state code is a recognized US state/DC but has no published content yet. */
export function isStateComingSoon(code: StateCode): boolean {
  return !LEGAL_REGISTRY_MAP.has(code) && STATE_DIRECTORY.some((s) => s.code === code);
}

// ─── Aliases required by legal feature screens ────────────────────────────────
export const FULL_STATE_LEGAL_REGISTRY: StateLegalRegistry[] = LEGAL_REGISTRIES;

// ─── Full-text search across states and document names ───────────────────────
export function searchStatesAndDocuments(query: string): StateLegalRegistry[] {
  const q = query.toLowerCase().trim();
  if (!q) return LEGAL_REGISTRIES;
  return LEGAL_REGISTRIES.filter((r) =>
    r.stateName.toLowerCase().includes(q) ||
    r.stateCode.toLowerCase().includes(q) ||
    r.overview.summary.toLowerCase().includes(q) ||
    r.documents.some(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.commonNames.some((n) => n.toLowerCase().includes(q)) ||
        d.summary.toLowerCase().includes(q),
    ) ||
    r.overview.commonlyUsedDocuments.some((d) => d.toLowerCase().includes(q)),
  );
}

// ─── Look up a single document by stateCode + documentId ─────────────────────
export function getLegalDocument(
  stateCode: StateCode,
  documentId: string,
): import("./types").LegalDocumentEntry | undefined {
  const registry = LEGAL_REGISTRY_MAP.get(stateCode);
  if (!registry) return undefined;
  return registry.documents.find((d) => d.id === documentId);
}

// ─── Source banner helper (state detail screen) ───────────────────────────────
export function getStateSourceBanner(status: string): string {
  switch (status) {
    case "reviewed":
      return "Reviewed state sources available";
    case "source_only":
      return "Mixed official and reference sources";
    case "pending_review":
      return "Reference links only while review is in progress";
    case "needs_update":
      return "This state content needs review updates";
    default:
      return "";
  }
}
