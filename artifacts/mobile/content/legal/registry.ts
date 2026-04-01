// ─────────────────────────────────────────────────────────────────────────────
// Legal Feature Registry
//
// How this works:
// 1. All 51 entries (50 states + DC) are scaffolded using createEmptyStateRegistry.
// 2. Reviewed state overrides replace the scaffolded records cleanly using
//    stateCode as the key.
// 3. All future reviewed states should follow the same override pattern:
//    a. Create content in content/legal/reviewed/<state>.ts
//    b. Import it here
//    c. Add it to REVIEWED_OVERRIDES
//
// LEGAL REVIEW NOTES:
// - Reviewed states require verified official source URLs.
// - Pending states are scaffolded educational content — never silently upgrade.
// - State laws and forms change. Reviewed dates must be checked periodically.
// ─────────────────────────────────────────────────────────────────────────────

import { createEmptyStateRegistry } from "./helpers";
import { CALIFORNIA } from "./reviewed/california";
import { FLORIDA } from "./reviewed/florida";
import { MASSACHUSETTS } from "./reviewed/massachusetts";
import { STATE_DIRECTORY } from "./stateDirectory";
import { StateCode, StateLegalRegistry } from "./types";

// ─── Scaffold all 51 states ───────────────────────────────────────────────────
const SCAFFOLDED: StateLegalRegistry[] = STATE_DIRECTORY.map((s) =>
  createEmptyStateRegistry(s.code, s.name),
);

// ─── Reviewed overrides (replace scaffolded records for reviewed states) ──────
// Add new reviewed states here as they are completed.
const REVIEWED_OVERRIDES: StateLegalRegistry[] = [
  FLORIDA,
  MASSACHUSETTS,
  CALIFORNIA,
];

const OVERRIDE_MAP = new Map<StateCode, StateLegalRegistry>(
  REVIEWED_OVERRIDES.map((r) => [r.stateCode, r]),
);

// ─── Merge: override scaffold with reviewed content where available ────────────
export const LEGAL_REGISTRIES: StateLegalRegistry[] = SCAFFOLDED.map(
  (scaffold) => OVERRIDE_MAP.get(scaffold.stateCode) ?? scaffold,
);

export const LEGAL_REGISTRY_MAP = new Map<StateCode, StateLegalRegistry>(
  LEGAL_REGISTRIES.map((r) => [r.stateCode, r]),
);

export const REVIEWED_STATE_CODES: StateCode[] = REVIEWED_OVERRIDES.map((r) => r.stateCode);

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

export const PENDING_STATE_CODES: StateCode[] = SCAFFOLDED
  .map((s) => s.stateCode)
  .filter((code) => !OVERRIDE_MAP.has(code));

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
