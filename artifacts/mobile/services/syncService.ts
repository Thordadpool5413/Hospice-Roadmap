/**
 * Cloud sync service — uploads local data to the server and restores it on
 * sign-in / app foreground / reconnect.
 *
 * Eight data stores are synced:
 *   - symptom entries          (@hospice_roadmap_symptoms)
 *   - journal entries          (@hospice_roadmap_journal)
 *   - goals of care            (user.patientProfile.goalsOfCare in @hospice_roadmap_user)
 *   - living profile           (@vera_living_profile_v1)
 *   - reminders                (@hospice_roadmap_reminders)
 *   - caregiver wellness       (@caregiver_wellness_v1)
 *   - user profile             (@hospice_roadmap_user — role/stage/settings, NOT goalsOfCare)
 *   - Ragna AI memory          (@vera_memories_v1 + @vera_tile_history_v1)
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
import { GOC_FIELDS, mergeGoalsOfCare } from "@workspace/goc-merge";
import type { GoalsOfCare, GoalsOfCareField } from "@workspace/goc-merge";
import type { CaregiverWellnessEntry, JournalEntry, Reminder, SymptomEntry, VeraMemory } from "@/types";

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

const MIGRATED_SYMPTOMS      = "@sync_migrated_symptoms";
const MIGRATED_JOURNAL       = "@sync_migrated_journal";
const MIGRATED_GOALS         = "@sync_migrated_goals";
const MIGRATED_PROFILE       = "@sync_migrated_profile";
const MIGRATED_REMINDERS     = "@sync_migrated_reminders";
const MIGRATED_WELLNESS      = "@sync_migrated_wellness";
const MIGRATED_USER_PROFILE  = "@sync_migrated_user_profile";
const MIGRATED_RAGNA_MEMORY  = "@sync_migrated_ragna_memory";

// ─── AsyncStorage source keys (must not be changed) ──────────────────────────

const AS_SYMPTOMS       = "@hospice_roadmap_symptoms";
const AS_JOURNAL        = "@hospice_roadmap_journal";
const AS_USER           = "@hospice_roadmap_user";
const AS_PROFILE        = "@vera_living_profile_v1";
const AS_REMINDERS      = "@hospice_roadmap_reminders";
const AS_WELLNESS       = "@caregiver_wellness_v1";
const AS_RAGNA_MEMORIES = "@vera_memories_v1";
const AS_RAGNA_TILES    = "@vera_tile_history_v1";

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
  /** Caregiver daily wellness check-in entries. Empty array when none exist. */
  caregiverWellness: CaregiverWellnessEntry[];
  /**
   * The full DB row for user profile — includes `updatedAt` (ISO string)
   * alongside `data` (the User object without patientProfile.goalsOfCare).
   */
  userProfile: { data: Record<string, unknown>; updatedAt?: string } | null;
  /**
   * The full DB row for Ragna AI memory — includes `updatedAt` (ISO string)
   * alongside `memories` (VeraMemory[]) and `tiles` (string[]).
   * Null when the user has no synced memory yet.
   */
  ragnaMemory: { memories: unknown[]; tiles: unknown[]; updatedAt?: string } | null;
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

// GOC_FIELDS and mergeGoalsOfCare are imported from @workspace/goc-merge above.
// That shared lib is the single source of truth — edit it there, not here.

export { mergeGoalsOfCare } from "@workspace/goc-merge";

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

export async function uploadCaregiverWellness(
  entries: CaregiverWellnessEntry[],
): Promise<boolean> {
  const payload = entries.map((e) => ({
    ...e,
    clientUpdatedAt: e.updatedAt ?? new Date(e.timestamp).toISOString(),
  }));
  return syncPut("/caregiver-wellness", { entries: payload });
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

export async function deleteServerCaregiverWellness(): Promise<boolean> {
  return syncDelete("/caregiver-wellness");
}

export async function deleteAllServerData(): Promise<boolean> {
  return syncDelete("/all");
}

// ─── Ragna AI memory upload/delete ────────────────────────────────────────────

/**
 * Upload Ragna's full memory state (memories array + tile history) to the server.
 * @param memories      The current VeraMemory[] array (capped at MAX_MEMORIES).
 * @param tiles         The current recent tile/topic labels (capped at MAX_TILES).
 * @param updatedAt     The ISO timestamp of the most recent local write —
 *                      used as the LWW version key so a stale device cannot
 *                      overwrite fresher data from another device.
 */
export async function uploadRagnaMemory(
  memories: VeraMemory[],
  tiles: string[],
  updatedAt: string,
): Promise<boolean> {
  return syncPut("/ragna-memory", { memories, tiles, clientUpdatedAt: updatedAt });
}

export async function deleteServerRagnaMemory(): Promise<boolean> {
  return syncDelete("/ragna-memory");
}

// ─── User profile upload/delete ───────────────────────────────────────────────

/**
 * Upload the user profile to the server.
 *
 * patientProfile.goalsOfCare is stripped before sending — GoC is managed
 * exclusively by the /sync/goals endpoint. Storing it here too would create
 * two competing sources of truth for the same field.
 */
export async function uploadProfile(user: import("@/types").User): Promise<boolean> {
  const profileData: Record<string, unknown> = { ...user };
  if (user.patientProfile) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { goalsOfCare: _goc, ...rest } = user.patientProfile;
    profileData["patientProfile"] = Object.keys(rest).length > 0 ? rest : undefined;
  }
  // When updatedAt is absent the profile predates the sync migration and we
  // don't know its true modification time. Use the Unix epoch as a safe
  // sentinel so LWW can never let this upload overwrite any properly-stamped
  // server record. The upload still runs so the server gets initial data, but
  // any subsequent write from another device (which WILL have updatedAt) wins.
  return syncPut("/profile", {
    data: profileData,
    clientUpdatedAt: user.updatedAt ?? new Date(0).toISOString(),
  });
}

export async function deleteServerProfile(): Promise<boolean> {
  return syncDelete("/profile");
}

// ─── Caregiver wellness merge ─────────────────────────────────────────────────

/**
 * Merge local and server caregiver wellness entries.
 *
 * Two-pass strategy:
 *
 * Pass 1 — ID-level LWW: union all entries by ID. When both sides have the
 * same ID, the record with the newer `updatedAt` wins (server wins on tie).
 * This handles edits to an existing check-in from two different devices.
 *
 * Pass 2 — Date-level deduplication: if two devices each recorded a check-in
 * on the same calendar day they will have different IDs and both survive
 * Pass 1. Keep only the most recent entry per date (by `updatedAt`, falling
 * back to `timestamp`) so the Wellness screen always shows one row per day.
 */
export function mergeWellnessEntries(
  local: CaregiverWellnessEntry[],
  server: CaregiverWellnessEntry[],
): CaregiverWellnessEntry[] {
  // Pass 1: ID-level merge (LWW by updatedAt)
  const byId = new Map<string, CaregiverWellnessEntry>(local.map((e) => [e.id, e]));

  for (const serverEntry of server) {
    const localEntry = byId.get(serverEntry.id);
    if (!localEntry) {
      byId.set(serverEntry.id, serverEntry);
    } else {
      const localTs = localEntry.updatedAt ?? new Date(localEntry.timestamp).toISOString();
      const serverTs = serverEntry.updatedAt ?? new Date(serverEntry.timestamp).toISOString();
      if (new Date(serverTs) >= new Date(localTs)) {
        byId.set(serverEntry.id, serverEntry);
      }
    }
  }

  // Pass 2: Date-level deduplication — keep the most-recent entry per date
  // (by updatedAt, falling back to timestamp). This resolves the case where
  // two devices check in on the same day and produce entries with different IDs.
  const byDate = new Map<string, CaregiverWellnessEntry>();
  for (const entry of byId.values()) {
    const existing = byDate.get(entry.date);
    if (!existing) {
      byDate.set(entry.date, entry);
    } else {
      const existingTs = existing.updatedAt ?? new Date(existing.timestamp).toISOString();
      const entryTs = entry.updatedAt ?? new Date(entry.timestamp).toISOString();
      if (new Date(entryTs) > new Date(existingTs)) {
        byDate.set(entry.date, entry);
      }
    }
  }

  return Array.from(byDate.values());
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
    MIGRATED_WELLNESS,
    MIGRATED_USER_PROFILE,
    MIGRATED_RAGNA_MEMORY,
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

  if (!flagMap[MIGRATED_WELLNESS]) {
    migrations.push((async () => {
      const serverWellness = serverData.caregiverWellness ?? [];
      if (serverWellness.length > 0) {
        await AsyncStorage.setItem(MIGRATED_WELLNESS, "1");
      } else {
        const raw = await AsyncStorage.getItem(AS_WELLNESS);
        const local: CaregiverWellnessEntry[] = raw ? JSON.parse(raw) : [];
        if (local.length === 0) {
          await AsyncStorage.setItem(MIGRATED_WELLNESS, "1");
        } else {
          const ok = await uploadCaregiverWellness(local);
          if (ok) await AsyncStorage.setItem(MIGRATED_WELLNESS, "1");
        }
      }
    })());
  }

  if (!flagMap[MIGRATED_USER_PROFILE]) {
    migrations.push((async () => {
      if (serverData.userProfile) {
        // Server already has a profile row — mark done without re-uploading.
        await AsyncStorage.setItem(MIGRATED_USER_PROFILE, "1");
      } else {
        const raw = await AsyncStorage.getItem(AS_USER);
        if (!raw) {
          // No local profile — nothing to migrate.
          await AsyncStorage.setItem(MIGRATED_USER_PROFILE, "1");
        } else {
          const localUser = JSON.parse(raw) as import("@/types").User;
          // Only migrate if onboarding is complete (user has a meaningful profile).
          if (!localUser.onboardingComplete) {
            await AsyncStorage.setItem(MIGRATED_USER_PROFILE, "1");
          } else {
            const ok = await uploadProfile(localUser);
            if (ok) await AsyncStorage.setItem(MIGRATED_USER_PROFILE, "1");
          }
        }
      }
    })());
  }

  if (!flagMap[MIGRATED_RAGNA_MEMORY]) {
    migrations.push((async () => {
      if (serverData.ragnaMemory) {
        // Server already has Ragna memory — mark done without re-uploading.
        await AsyncStorage.setItem(MIGRATED_RAGNA_MEMORY, "1");
      } else {
        const [memoriesRaw, tilesRaw] = await Promise.all([
          AsyncStorage.getItem(AS_RAGNA_MEMORIES),
          AsyncStorage.getItem(AS_RAGNA_TILES),
        ]);
        const localMemories: VeraMemory[] = memoriesRaw ? JSON.parse(memoriesRaw) : [];
        const localTiles: string[] = tilesRaw ? JSON.parse(tilesRaw) : [];
        if (localMemories.length === 0 && localTiles.length === 0) {
          // Nothing to migrate
          await AsyncStorage.setItem(MIGRATED_RAGNA_MEMORY, "1");
        } else {
          // Use now as the migration timestamp — server is empty so any value wins.
          const ok = await uploadRagnaMemory(localMemories, localTiles, new Date().toISOString());
          if (ok) await AsyncStorage.setItem(MIGRATED_RAGNA_MEMORY, "1");
          // If upload failed: flag NOT set, will retry next sync
        }
      }
    })());
  }

  await Promise.all(migrations);
}
