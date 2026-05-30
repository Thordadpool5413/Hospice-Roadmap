/**
 * Pure GoalsOfCare merge logic — no React Native or Expo dependencies.
 *
 * This is the single source of truth for field-level conflict resolution.
 * Both the mobile sync service and the server-side test suite import from here
 * so the two never drift apart.
 */

export type DnrStatus = "dnr" | "full-code" | "unknown" | "not-discussed";

/** The eight editable scalar fields on a GoalsOfCare document. */
export type GoalsOfCareField =
  | "whatMattersMost"
  | "goodDayLooksLike"
  | "thingsToAvoid"
  | "dnrStatus"
  | "additionalDirectives"
  | "fearsAndConcerns"
  | "finalDaysWishes"
  | "afterDeathWishes";

export interface GoalsOfCare {
  whatMattersMost?: string;
  goodDayLooksLike?: string;
  thingsToAvoid?: string;
  dnrStatus?: DnrStatus;
  additionalDirectives?: string;
  fearsAndConcerns?: string;
  finalDaysWishes?: string;
  afterDeathWishes?: string;
  /** Document-level ISO timestamp — the last time any field was saved locally. */
  updatedAt?: string;
  /**
   * Per-field ISO timestamps populated by the sync merge step.
   * When present, these take precedence over the document-level `updatedAt`
   * during field-level conflict resolution.
   */
  fieldUpdatedAt?: Partial<Record<GoalsOfCareField, string>>;
}

/**
 * Ordered list of the eight editable GoC fields.
 * Used by `mergeGoalsOfCare` to iterate fields deterministically.
 */
export const GOC_FIELDS: GoalsOfCareField[] = [
  "whatMattersMost",
  "goodDayLooksLike",
  "thingsToAvoid",
  "dnrStatus",
  "additionalDirectives",
  "fearsAndConcerns",
  "finalDaysWishes",
  "afterDeathWishes",
];

/**
 * Merge local and server GoalsOfCare at field granularity.
 *
 * For each of the eight GoC fields the effective timestamp is
 * `fieldUpdatedAt[field] ?? documentUpdatedAt`. Whichever side has the newer
 * effective timestamp for a given field wins that field's value. The merged
 * result is a new GoalsOfCare with a `fieldUpdatedAt` map recording the
 * winning timestamp for each field so that future syncs remain field-precise.
 *
 * Falls back to document-level LWW when neither side has `fieldUpdatedAt`
 * (preserved for backward compatibility).
 *
 * Returns `null` when both sides are empty/undefined.
 */
export function mergeGoalsOfCare(
  local: GoalsOfCare | undefined,
  serverContent: GoalsOfCare | undefined,
  serverDocUpdatedAt: string | undefined,
): GoalsOfCare | null {
  const hasLocal = !!(
    local?.whatMattersMost?.trim() ||
    local?.goodDayLooksLike?.trim() ||
    local?.thingsToAvoid?.trim() ||
    local?.dnrStatus ||
    local?.additionalDirectives?.trim() ||
    local?.fearsAndConcerns?.trim() ||
    local?.finalDaysWishes?.trim() ||
    local?.afterDeathWishes?.trim()
  );
  const hasServer = !!(
    serverContent?.whatMattersMost?.trim() ||
    serverContent?.goodDayLooksLike?.trim() ||
    serverContent?.thingsToAvoid?.trim() ||
    serverContent?.dnrStatus ||
    serverContent?.additionalDirectives?.trim() ||
    serverContent?.fearsAndConcerns?.trim() ||
    serverContent?.finalDaysWishes?.trim() ||
    serverContent?.afterDeathWishes?.trim()
  );

  if (!hasServer && !hasLocal) return null;
  if (!hasServer) return local!;
  if (!hasLocal) return serverContent!;

  const localDocTs = local!.updatedAt;
  const merged: GoalsOfCare = {};
  const mergedFieldTs: Partial<Record<GoalsOfCareField, string>> = {};

  for (const field of GOC_FIELDS) {
    const localFieldTs = local!.fieldUpdatedAt?.[field] ?? localDocTs;
    const serverFieldTs = serverContent!.fieldUpdatedAt?.[field] ?? serverDocUpdatedAt;

    let useServer: boolean;
    if (localFieldTs && serverFieldTs) {
      // Both sides have a timestamp — server wins on tie (authoritative source)
      useServer = new Date(serverFieldTs) >= new Date(localFieldTs);
    } else if (serverFieldTs && !localFieldTs) {
      // Server has an explicit version; local predates per-field tracking
      useServer = true;
    } else {
      // Local has a timestamp but server doesn't, or neither does — keep local
      useServer = false;
    }

    const winningValue = useServer
      ? (serverContent as Record<string, unknown>)[field]
      : (local as Record<string, unknown>)[field];
    const winningTs = useServer ? serverFieldTs : localFieldTs;

    if (winningValue !== undefined) {
      (merged as Record<string, unknown>)[field] = winningValue;
    }
    if (winningTs) {
      mergedFieldTs[field] = winningTs;
    }
  }

  // Document-level updatedAt = the most recent winning field timestamp
  const allTs = Object.values(mergedFieldTs).filter((t): t is string => !!t);
  const docTs =
    allTs.length > 0
      ? allTs.reduce((a, b) => (new Date(a) > new Date(b) ? a : b))
      : (localDocTs ?? serverDocUpdatedAt);

  if (docTs) merged.updatedAt = docTs;
  if (Object.keys(mergedFieldTs).length > 0) merged.fieldUpdatedAt = mergedFieldTs;

  return merged;
}
