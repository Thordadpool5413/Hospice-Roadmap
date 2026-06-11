// ─────────────────────────────────────────────────────────────────────────────
// Legal Feature Helpers
//
// Only legally-reviewed states are published in this app. Unreviewed states are
// intentionally excluded rather than scaffolded with placeholder content, so the
// app never displays auto-generated or misleading legal guidance.
// ─────────────────────────────────────────────────────────────────────────────

import {
  LegalReviewMeta,
  ReviewStatus,
  SourceType,
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
