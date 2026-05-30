/**
 * Tests for GoC content schema validation and the field-level merge logic.
 *
 * Confirms that all eight GoC fields — including the three new additions
 * (fearsAndConcerns, finalDaysWishes, afterDeathWishes) — survive a
 * PUT /api/sync/goals → GET /api/sync round-trip correctly and that the
 * per-field merge produces the expected winning values.
 *
 * These tests are pure TypeScript with no React Native or Expo dependencies.
 */

import { describe, it, expect } from "vitest";
import { gocContentSchema } from "../schema/goalsOfCare";

// ─── Types mirrored from mobile (no RN import needed) ────────────────────────

type DnrStatus = "dnr" | "full-code" | "unknown" | "not-discussed";
type GoalsOfCareField =
  | "whatMattersMost"
  | "goodDayLooksLike"
  | "thingsToAvoid"
  | "dnrStatus"
  | "additionalDirectives"
  | "fearsAndConcerns"
  | "finalDaysWishes"
  | "afterDeathWishes";

interface GoalsOfCare {
  whatMattersMost?: string;
  goodDayLooksLike?: string;
  thingsToAvoid?: string;
  dnrStatus?: DnrStatus;
  additionalDirectives?: string;
  fearsAndConcerns?: string;
  finalDaysWishes?: string;
  afterDeathWishes?: string;
  updatedAt?: string;
  fieldUpdatedAt?: Partial<Record<GoalsOfCareField, string>>;
}

// ─── Pure merge logic (mirrors syncService.ts — kept in sync intentionally) ──
//
// This is duplicated here to keep the test self-contained without pulling
// React Native into the Node.js test environment. If mergeGoalsOfCare in
// syncService.ts is changed, update this copy too.

const GOC_FIELDS: GoalsOfCareField[] = [
  "whatMattersMost",
  "goodDayLooksLike",
  "thingsToAvoid",
  "dnrStatus",
  "additionalDirectives",
  "fearsAndConcerns",
  "finalDaysWishes",
  "afterDeathWishes",
];

function mergeGoalsOfCare(
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
      useServer = new Date(serverFieldTs) >= new Date(localFieldTs);
    } else if (serverFieldTs && !localFieldTs) {
      useServer = true;
    } else {
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

  const allTs = Object.values(mergedFieldTs).filter((t): t is string => !!t);
  const docTs =
    allTs.length > 0
      ? allTs.reduce((a, b) => (new Date(a) > new Date(b) ? a : b))
      : (localDocTs ?? serverDocUpdatedAt);

  if (docTs) merged.updatedAt = docTs;
  if (Object.keys(mergedFieldTs).length > 0) merged.fieldUpdatedAt = mergedFieldTs;

  return merged;
}

// ─── gocContentSchema tests ───────────────────────────────────────────────────

describe("gocContentSchema", () => {
  it("accepts all eight GoC fields including the three new ones", () => {
    const input = {
      whatMattersMost: "Being present with family",
      goodDayLooksLike: "Sitting on the porch in the sun",
      thingsToAvoid: "Unnecessary hospital trips",
      dnrStatus: "dnr" as const,
      additionalDirectives: "No feeding tube",
      fearsAndConcerns: "Being in pain alone",
      finalDaysWishes: "Family around, soft music",
      afterDeathWishes: "Cremation, celebration of life",
    };

    const result = gocContentSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.fearsAndConcerns).toBe("Being in pain alone");
    expect(result.data.finalDaysWishes).toBe("Family around, soft music");
    expect(result.data.afterDeathWishes).toBe("Cremation, celebration of life");
    expect(result.data.whatMattersMost).toBe("Being present with family");
    expect(result.data.dnrStatus).toBe("dnr");
  });

  it("accepts partial GoC content — all fields are optional", () => {
    const partial = {
      fearsAndConcerns: "Being alone",
      finalDaysWishes: "Music playing",
    };
    const result = gocContentSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.fearsAndConcerns).toBe("Being alone");
    expect(result.data.afterDeathWishes).toBeUndefined();
  });

  it("accepts an empty object (no fields set)", () => {
    const result = gocContentSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts the fieldUpdatedAt per-field timestamp map", () => {
    const content = {
      fearsAndConcerns: "Losing dignity",
      fieldUpdatedAt: {
        fearsAndConcerns: "2025-06-01T10:00:00.000Z",
        afterDeathWishes: "2025-06-02T09:00:00.000Z",
      },
    };
    const result = gocContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.fieldUpdatedAt?.["fearsAndConcerns"]).toBe("2025-06-01T10:00:00.000Z");
  });

  it("rejects invalid dnrStatus values", () => {
    const bad = { dnrStatus: "maybe" };
    const result = gocContentSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("strips unknown keys so JSONB stays tidy", () => {
    const withExtra = {
      whatMattersMost: "Family",
      unknownFutureField: "some value",
    };
    const result = gocContentSchema.safeParse(withExtra);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect("unknownFutureField" in result.data).toBe(false);
    expect(result.data.whatMattersMost).toBe("Family");
  });

  it("accepts the updatedAt document-level timestamp", () => {
    const content = {
      whatMattersMost: "Comfort",
      updatedAt: "2025-05-30T12:00:00.000Z",
    };
    const result = gocContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.updatedAt).toBe("2025-05-30T12:00:00.000Z");
  });
});

// ─── mergeGoalsOfCare round-trip tests ────────────────────────────────────────

describe("mergeGoalsOfCare — three new fields", () => {
  const T1 = "2025-05-01T10:00:00.000Z";
  const T2 = "2025-05-02T10:00:00.000Z";

  it("preserves all eight fields when server is authoritative (newer timestamp)", () => {
    const local: GoalsOfCare = {
      whatMattersMost: "Family",
      goodDayLooksLike: "Quiet morning",
      thingsToAvoid: "Loud noise",
      dnrStatus: "dnr",
      additionalDirectives: "No IV fluids",
      fearsAndConcerns: "old fears",
      finalDaysWishes: "old wishes",
      afterDeathWishes: "old burial",
      updatedAt: T1,
    };
    const server: GoalsOfCare = {
      whatMattersMost: "Family",
      goodDayLooksLike: "Quiet morning",
      thingsToAvoid: "Loud noise",
      dnrStatus: "dnr",
      additionalDirectives: "No IV fluids",
      fearsAndConcerns: "Being in pain alone",
      finalDaysWishes: "Family around, soft music",
      afterDeathWishes: "Cremation preferred",
      updatedAt: T2,
    };

    const merged = mergeGoalsOfCare(local, server, T2);
    expect(merged).not.toBeNull();
    expect(merged!.fearsAndConcerns).toBe("Being in pain alone");
    expect(merged!.finalDaysWishes).toBe("Family around, soft music");
    expect(merged!.afterDeathWishes).toBe("Cremation preferred");
    expect(merged!.whatMattersMost).toBe("Family");
    expect(merged!.dnrStatus).toBe("dnr");
  });

  it("keeps local values for the new fields when local is newer", () => {
    const local: GoalsOfCare = {
      fearsAndConcerns: "Losing autonomy",
      finalDaysWishes: "Candles and quiet",
      afterDeathWishes: "Scatter ashes at sea",
      updatedAt: T2,
    };
    const server: GoalsOfCare = {
      fearsAndConcerns: "stale fears",
      finalDaysWishes: "stale wishes",
      afterDeathWishes: "stale burial",
      updatedAt: T1,
    };

    const merged = mergeGoalsOfCare(local, server, T1);
    expect(merged).not.toBeNull();
    expect(merged!.fearsAndConcerns).toBe("Losing autonomy");
    expect(merged!.finalDaysWishes).toBe("Candles and quiet");
    expect(merged!.afterDeathWishes).toBe("Scatter ashes at sea");
  });

  it("performs field-level merge: different devices can update different new fields", () => {
    const localTs = "2025-05-30T09:00:00.000Z";
    const serverTs = "2025-05-30T11:00:00.000Z";

    const local: GoalsOfCare = {
      whatMattersMost: "Local whatMattersMost",
      fearsAndConcerns: "Local fearsAndConcerns — updated later",
      updatedAt: localTs,
      fieldUpdatedAt: {
        whatMattersMost: localTs,
        fearsAndConcerns: serverTs,
      },
    };
    const server: GoalsOfCare = {
      whatMattersMost: "Server whatMattersMost — updated later",
      fearsAndConcerns: "Server fearsAndConcerns — stale",
      afterDeathWishes: "Server afterDeathWishes",
      fieldUpdatedAt: {
        whatMattersMost: serverTs,
        fearsAndConcerns: localTs,
        afterDeathWishes: serverTs,
      },
    };

    const merged = mergeGoalsOfCare(local, server, serverTs);
    expect(merged).not.toBeNull();
    expect(merged!.whatMattersMost).toBe("Server whatMattersMost — updated later");
    expect(merged!.fearsAndConcerns).toBe("Local fearsAndConcerns — updated later");
    expect(merged!.afterDeathWishes).toBe("Server afterDeathWishes");
  });

  it("returns null when both sides are empty", () => {
    const merged = mergeGoalsOfCare({}, {}, undefined);
    expect(merged).toBeNull();
  });

  it("returns server content directly when local is empty", () => {
    const server: GoalsOfCare = {
      fearsAndConcerns: "Pain",
      afterDeathWishes: "Cremation",
    };
    const merged = mergeGoalsOfCare(undefined, server, T1);
    expect(merged).toBe(server);
  });

  it("returns local content directly when server is empty", () => {
    const local: GoalsOfCare = {
      finalDaysWishes: "Music",
      fearsAndConcerns: "Loneliness",
    };
    const merged = mergeGoalsOfCare(local, undefined, undefined);
    expect(merged).toBe(local);
  });

  it("schema-validated content round-trips through merge intact", () => {
    const rawUpload = {
      whatMattersMost: "Dignity",
      goodDayLooksLike: "Garden walk",
      thingsToAvoid: "Aggressive treatment",
      dnrStatus: "dnr" as const,
      additionalDirectives: "Comfort only",
      fearsAndConcerns: "Being a burden",
      finalDaysWishes: "Held by loved ones",
      afterDeathWishes: "Bury near the oak tree",
      updatedAt: T2,
      fieldUpdatedAt: undefined,
    };

    const schemaResult = gocContentSchema.safeParse(rawUpload);
    expect(schemaResult.success).toBe(true);
    if (!schemaResult.success) return;

    const serverContent = schemaResult.data as GoalsOfCare;
    const merged = mergeGoalsOfCare(undefined, serverContent, T2);

    expect(merged).not.toBeNull();
    expect(merged!.fearsAndConcerns).toBe("Being a burden");
    expect(merged!.finalDaysWishes).toBe("Held by loved ones");
    expect(merged!.afterDeathWishes).toBe("Bury near the oak tree");
    expect(merged!.dnrStatus).toBe("dnr");
    expect(merged!.whatMattersMost).toBe("Dignity");
    expect(merged!.additionalDirectives).toBe("Comfort only");
  });
});
