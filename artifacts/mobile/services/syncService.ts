/**
 * Cloud sync service — uploads local data to the server and restores it on
 * sign-in / app foreground / reconnect.
 *
 * Five data stores are synced:
 *   - symptom entries     (@hospice_roadmap_symptoms)
 *   - journal entries     (@hospice_roadmap_journal)
 *   - goals of care       (user.patientProfile.goalsOfCare in @hospice_roadmap_user)
 *   - living profile      (@vera_living_profile_v1)
 *   - reminders           (@hospice_roadmap_reminders)
 *
 * Per-record conflict resolution (last-write-wins):
 *   Each record now carries an `updatedAt` field stamped at create/update time
 *   in the mobile context (SymptomContext, JournalContext, RemindersContext).
 *   For records created before this field was introduced, we fall back to a
 *   deterministic logical version derived from the record's own immutable data:
 *     - Symptoms: check-in date + time (the event time is the natural version)
 *     - Journal: entry.timestamp (creation epoch)
 *     - Reminders: scheduled datetime as proxy
 *   This `clientUpdatedAt` is sent with every push; the server stores it as
 *   updated_at and only overwrites an existing row when
 *   incoming.updated_at >= stored.updated_at (true LWW per record).
 *
 * Migration (one-time per store, flag set ONLY on confirmed success):
 *   @sync_migrated_symptoms, @sync_migrated_journal, @sync_migrated_goals,
 *   @sync_migrated_profile, @sync_migrated_reminders
 *   If the flag is not set and the upload fails, the flag is NOT written, so
 *   the next sync will retry rather than silently losing legacy local data.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuthToken } from "@workspace/api-client-react";

import { apiBase, makeRequestTimeoutSignal, mergeJsonHeaders } from "./apiClient";
import type { GoalsOfCare, GoalsOfCareField, JournalEntry, Reminder, SymptomEntry } from "@/types";

// ─── Last-success timestamp key ───────────────────────────────────────────────

export const SYNC_LAST_SUCCESS_KEY = "@sync_last_success";

/**
 * Persist the current wall-clock time as the most recent successful sync.
 * Called by CloudSyncManager after every full push phase completes.
 */
export async function recordSyncSuccess(): Promise<void> {
  await AsyncStorage.setItem(SYNC_LAST_SUCCESS_KEY, new Date().toISOString());
}

/**
 * Read the ISO timestamp of the last successful sync, or null if none has
 * ever been recorded on this device.
 */
export async function readSyncLastSuccess(): Promise<string | null> {
  return AsyncStorage.getItem(SYNC_LAST_SUCCESS_KEY);
}

// ─── Migration flag keys ──────────────────────────────────────────────────────

const MIGRATED_SYMPTOMS  = "@sync_migrated_symptoms";
const MIGRATED_JOURNAL   = "@sync_migrated_journal";
const MIGRATED_GOALS     = "@sync_migrated_goals";
const MIGRATED_PROFILE   = "@sync_migrated_profile";
const MIGRATED_REMINDERS = "@sync_migrated_reminders";

// ─── AsyncStorage source keys (must not be changed) ──────────────────────────

const AS_SYMPTOMS  = "@hospice_roadmap_symptoms";
const AS_JOURNAL   = "@hospice_roadmap_journal";
const AS_USER      = "@hospice_roadmap_user";
const AS_PROFILE   = "@vera_living_profile_v1";
const AS_REMINDERS = "@hospice_roadmap_reminders";

// ─── Auth header helper ───────────────────────────────────────────────────────

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return mergeJsonHeaders(token ? { Authorization: `Bearer ${token}` } : undefined);
}

// ─── Internal fetch helpers ───────────────────────────────────────────────────

async function syncGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${apiBase()}/sync${path}`, {
      method: "GET",
      headers: await authHeaders(),
      signal: makeRequestTimeoutSignal(15_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function syncPut(path: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}/sync${path}`, {
      method: "PUT",
      headers: await authHeaders(),
      body: JSON.stringify(body),
      signal: makeRequestTimeoutSignal(20_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function syncDelete(path: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}/sync${path}`, {
      method: "DELETE",
      headers: await authHeaders(),
      signal: makeRequestTimeoutSignal(15_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Fallback logical timestamp helpers (for pre-updatedAt records) ───────────
//
// Records created before `updatedAt` was added to mobile types will not have
// this field set. These helpers derive a reasonable deterministic version from
// immutable data in the record so they participate correctly in LWW.

function symptomFallbackUpdatedAt(entry: SymptomEntry): string {
  try {
    const d = new Date(`${entry.date}T${entry.time}`);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch { /* fall through */ }
  return new Date().toISOString();
}

function journalFallbackUpdatedAt(entry: JournalEntry): string {
  try {
    if (entry.timestamp > 0) return new Date(entry.timestamp).toISOString();
  } catch { /* fall through */ }
  return new Date().toISOString();
}

function reminderFallbackUpdatedAt(reminder: Reminder): string {
  try {
    const d = new Date(reminder.datetime);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch { /* fall through */ }
  return new Date().toISOString();
}

// ─── Server data shape ────────────────────────────────────────────────────────

export interface ServerSyncData {
  symptoms: SymptomEntry[];
  journal: JournalEntry[];
  /**
   * The full DB row for goals — includes `updatedAt` (ISO string) alongside
   * `content` so CloudSyncManager can do proper LWW timestamp comparison.
   */
  goals: { content: GoalsOfCare; updatedAt?: string } | null;
  /**
   * The full DB row for living profile — includes `updatedAt` (ISO string)
   * alongside `profile`.
   */
  livingProfile: { profile: string; updatedAt?: string } | null;
  reminders: Reminder[];
}

// ─── Per-record merge helpers ─────────────────────────────────────────────────
//
// These produce the union of local and server entry sets, resolving conflicts
// on matching IDs by keeping whichever record has the newer `updatedAt`.
// Records without an explicit `updatedAt` fall back to the same deterministic
// logical timestamp used by the upload helpers (check-in time / creation epoch)
// so they participate correctly in LWW even before the field was introduced.

/**
 * Merge local and server symptom entries.
 *
 * - Records present on only one side are included as-is.
 * - Records with matching IDs are resolved by `updatedAt` (server wins when
 *   equal — the server is the source of truth for tie-breaks).
 */
export function mergeSymptomEntries(
  local: SymptomEntry[],
  server: SymptomEntry[],
): SymptomEntry[] {
  const merged = new Map<string, SymptomEntry>(local.map((e) => [e.id, e]));

  for (const serverEntry of server) {
    const localEntry = merged.get(serverEntry.id);
    if (!localEntry) {
      merged.set(serverEntry.id, serverEntry);
    } else {
      const localTs = localEntry.updatedAt ?? symptomFallbackUpdatedAt(localEntry);
      const serverTs = serverEntry.updatedAt ?? symptomFallbackUpdatedAt(serverEntry);
      if (new Date(serverTs) >= new Date(localTs)) {
        merged.set(serverEntry.id, serverEntry);
      }
    }
  }

  return Array.from(merged.values());
}

/**
 * Merge local and server journal entries.
 *
 * - Records present on only one side are included as-is.
 * - Records with matching IDs are resolved by `updatedAt` (server wins on tie).
 */
export function mergeJournalEntries(
  local: JournalEntry[],
  server: JournalEntry[],
): JournalEntry[] {
  const merged = new Map<string, JournalEntry>(local.map((e) => [e.id, e]));

  for (const serverEntry of server) {
    const localEntry = merged.get(serverEntry.id);
    if (!localEntry) {
      merged.set(serverEntry.id, serverEntry);
    } else {
      const localTs = localEntry.updatedAt ?? journalFallbackUpdatedAt(localEntry);
      const serverTs = serverEntry.updatedAt ?? journalFallbackUpdatedAt(serverEntry);
      if (new Date(serverTs) >= new Date(localTs)) {
        merged.set(serverEntry.id, serverEntry);
      }
    }
  }

  return Array.from(merged.values());
}

/**
 * Merge local and server reminder entries.
 *
 * - Records present on only one side are included as-is.
 * - Records with matching IDs are resolved by `updatedAt` (server wins on tie).
 * - For pre-updatedAt records the scheduled datetime is used as the logical
 *   version (consistent with the upload helper's clientUpdatedAt fallback).
 */
export function mergeReminderEntries(
  local: Reminder[],
  server: Reminder[],
): Reminder[] {
  const merged = new Map<string, Reminder>(local.map((r) => [r.id, r]));

  for (const serverEntry of server) {
    const localEntry = merged.get(serverEntry.id);
    if (!localEntry) {
      merged.set(serverEntry.id, serverEntry);
    } else {
      const localTs = localEntry.updatedAt ?? reminderFallbackUpdatedAt(localEntry);
      const serverTs = serverEntry.updatedAt ?? reminderFallbackUpdatedAt(serverEntry);
      if (new Date(serverTs) >= new Date(localTs)) {
        merged.set(serverEntry.id, serverEntry);
      }
    }
  }

  return Array.from(merged.values());
}

// ─── Goals of care field-level merge ─────────────────────────────────────────
//
// The five editable GoC fields are resolved independently. For each field the
// effective timestamp is: fieldUpdatedAt[field] ?? documentUpdatedAt. This
// lets two devices that each edited a different field while offline both keep
// their edits rather than one clobbering the other.
//
// Falls back gracefully to document-level LWW when neither side carries
// per-field timestamps (the state before this feature was introduced).
//
// The merged result carries a fresh `fieldUpdatedAt` map so that subsequent
// syncs can continue to resolve at field level rather than falling back to
// document-level comparison.

const GOC_FIELDS: GoalsOfCareField[] = [
  "whatMattersMost",
  "goodDayLooksLike",
  "thingsToAvoid",
  "dnrStatus",
  "additionalDirectives",
];

/**
 * Merge local and server GoalsOfCare at field granularity.
 *
 * For each of the five GoC fields the effective timestamp is
 * `fieldUpdatedAt[field] ?? documentUpdatedAt`. Whichever side has the newer
 * effective timestamp for a given field wins that field's value. The merged
 * result is a new GoalsOfCare with a `fieldUpdatedAt` map recording the
 * winning timestamp for each field so that future syncs remain field-precise.
 *
 * Falls back to document-level LWW when neither side has `fieldUpdatedAt`
 * (current behaviour, preserved for backward compatibility).
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
    local?.additionalDirectives?.trim()
  );
  const hasServer = !!(
    serverContent?.whatMattersMost?.trim() ||
    serverContent?.goodDayLooksLike?.trim() ||
    serverContent?.thingsToAvoid?.trim() ||
    serverContent?.dnrStatus ||
    serverContent?.additionalDirectives?.trim()
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

// ─── Full fetch from server ───────────────────────────────────────────────────

export async function fetchServerData(): Promise<ServerSyncData | null> {
  return syncGet<ServerSyncData>("/");
}

// ─── Upload helpers ───────────────────────────────────────────────────────────

export async function uploadSymptoms(entries: SymptomEntry[]): Promise<boolean> {
  const payload = entries.map((e) => ({
    ...e,
    // Prefer the mutable updatedAt stamped on create/update; fall back to
    // the deterministic check-in time for records without it.
    clientUpdatedAt: e.updatedAt ?? symptomFallbackUpdatedAt(e),
  }));
  return syncPut("/symptoms", { entries: payload });
}

export async function uploadJournal(entries: JournalEntry[]): Promise<boolean> {
  const payload = entries.map((e) => ({
    ...e,
    // Prefer the mutable updatedAt stamped on create/update; fall back to
    // entry creation epoch for records without it.
    clientUpdatedAt: e.updatedAt ?? journalFallbackUpdatedAt(e),
  }));
  return syncPut("/journal", { entries: payload });
}

export async function uploadGoals(goals: GoalsOfCare): Promise<boolean> {
  return syncPut("/goals", {
    content: goals,
    clientUpdatedAt: goals.updatedAt ?? new Date().toISOString(),
  });
}

/**
 * Upload the living profile to the server.
 * @param updatedAt The ISO timestamp that was persisted locally when the
 *   profile was last written. This is the true LWW version key; passing
 *   the stored value (not the current time) ensures that a device with a
 *   stale copy cannot win over a fresher server value.
 */
export async function uploadLivingProfile(profile: string, updatedAt: string): Promise<boolean> {
  return syncPut("/living-profile", {
    profile,
    clientUpdatedAt: updatedAt,
  });
}

export async function uploadReminders(reminders: Reminder[]): Promise<boolean> {
  const payload = reminders.map(({ notificationId: _n, ...r }) => ({
    ...r,
    // Prefer the mutable updatedAt stamped on create/update; fall back to
    // scheduled datetime for records without it.
    clientUpdatedAt: r.updatedAt ?? reminderFallbackUpdatedAt(r as Reminder),
  }));
  return syncPut("/reminders", { reminders: payload });
}

// ─── Delete helpers (called from data-controls) ───────────────────────────────

export async function deleteServerSymptoms(): Promise<boolean> {
  return syncDelete("/symptoms");
}

export async function deleteServerJournal(): Promise<boolean> {
  return syncDelete("/journal");
}

export async function deleteServerGoals(): Promise<boolean> {
  return syncDelete("/goals");
}

export async function deleteServerLivingProfile(): Promise<boolean> {
  return syncDelete("/living-profile");
}

export async function deleteServerReminders(): Promise<boolean> {
  return syncDelete("/reminders");
}

export async function deleteAllServerData(): Promise<boolean> {
  return syncDelete("/all");
}

// ─── One-time local-to-server migration ───────────────────────────────────────
//
// For each store:
//   - If server already has data → mark migrated (nothing to do).
//   - If server is empty AND local has data → upload; mark migrated ONLY if
//     the upload succeeded. If it fails, the flag stays unset so the next
//     sync retries rather than permanently losing legacy local data.
//   - If both empty → mark migrated (nothing to migrate).

export async function runOnceLocalMigration(serverData: ServerSyncData): Promise<void> {
  const flags = await AsyncStorage.multiGet([
    MIGRATED_SYMPTOMS,
    MIGRATED_JOURNAL,
    MIGRATED_GOALS,
    MIGRATED_PROFILE,
    MIGRATED_REMINDERS,
  ]);
  const flagMap: Record<string, boolean> = {};
  for (const [key, val] of flags) {
    flagMap[key] = val === "1";
  }

  const migrations: Promise<void>[] = [];

  if (!flagMap[MIGRATED_SYMPTOMS]) {
    migrations.push((async () => {
      if (serverData.symptoms.length > 0) {
        // Server already has data — mark done without uploading
        await AsyncStorage.setItem(MIGRATED_SYMPTOMS, "1");
      } else {
        const raw = await AsyncStorage.getItem(AS_SYMPTOMS);
        const local: SymptomEntry[] = raw ? JSON.parse(raw) : [];
        if (local.length === 0) {
          // Nothing to migrate
          await AsyncStorage.setItem(MIGRATED_SYMPTOMS, "1");
        } else {
          const ok = await uploadSymptoms(local);
          if (ok) await AsyncStorage.setItem(MIGRATED_SYMPTOMS, "1");
          // If upload failed: flag NOT set, will retry next sync
        }
      }
    })());
  }

  if (!flagMap[MIGRATED_JOURNAL]) {
    migrations.push((async () => {
      if (serverData.journal.length > 0) {
        await AsyncStorage.setItem(MIGRATED_JOURNAL, "1");
      } else {
        const raw = await AsyncStorage.getItem(AS_JOURNAL);
        const local: JournalEntry[] = raw ? JSON.parse(raw) : [];
        if (local.length === 0) {
          await AsyncStorage.setItem(MIGRATED_JOURNAL, "1");
        } else {
          const ok = await uploadJournal(local);
          if (ok) await AsyncStorage.setItem(MIGRATED_JOURNAL, "1");
        }
      }
    })());
  }

  if (!flagMap[MIGRATED_GOALS]) {
    migrations.push((async () => {
      if (serverData.goals) {
        await AsyncStorage.setItem(MIGRATED_GOALS, "1");
      } else {
        const raw = await AsyncStorage.getItem(AS_USER);
        const goals = raw
          ? (JSON.parse(raw) as { patientProfile?: { goalsOfCare?: GoalsOfCare } })
              .patientProfile?.goalsOfCare
          : undefined;
        const hasGoals = !!(
          goals?.whatMattersMost ||
          goals?.goodDayLooksLike ||
          goals?.thingsToAvoid ||
          goals?.dnrStatus ||
          goals?.additionalDirectives
        );
        if (!hasGoals) {
          await AsyncStorage.setItem(MIGRATED_GOALS, "1");
        } else {
          const ok = await uploadGoals(goals!);
          if (ok) await AsyncStorage.setItem(MIGRATED_GOALS, "1");
        }
      }
    })());
  }

  if (!flagMap[MIGRATED_PROFILE]) {
    migrations.push((async () => {
      if (serverData.livingProfile) {
        await AsyncStorage.setItem(MIGRATED_PROFILE, "1");
      } else {
        const profile = await AsyncStorage.getItem(AS_PROFILE);
        if (!profile?.trim()) {
          await AsyncStorage.setItem(MIGRATED_PROFILE, "1");
        } else {
          // On initial migration the server is empty so any timestamp wins;
          // use now so the server record reflects when the data was migrated.
          const ok = await uploadLivingProfile(profile, new Date().toISOString());
          if (ok) await AsyncStorage.setItem(MIGRATED_PROFILE, "1");
        }
      }
    })());
  }

  if (!flagMap[MIGRATED_REMINDERS]) {
    migrations.push((async () => {
      if (serverData.reminders.length > 0) {
        await AsyncStorage.setItem(MIGRATED_REMINDERS, "1");
      } else {
        const raw = await AsyncStorage.getItem(AS_REMINDERS);
        const local: Reminder[] = raw ? JSON.parse(raw) : [];
        if (local.length === 0) {
          await AsyncStorage.setItem(MIGRATED_REMINDERS, "1");
        } else {
          const ok = await uploadReminders(local);
          if (ok) await AsyncStorage.setItem(MIGRATED_REMINDERS, "1");
        }
      }
    })());
  }

  await Promise.all(migrations);
}
