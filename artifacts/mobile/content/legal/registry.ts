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
