/**
 * Pending-deletes queue — persists record IDs that were deleted locally while
 * offline so that the next cloud sync can exclude them from the server-side
 * merge step before they are pushed to (and overwritten on) the server.
 *
 * Problem solved:
 *   mergeSymptomEntries / mergeJournalEntries are union merges: records present
 *   only on the server side are added to the merged result as-is (no local
 *   counterpart means no LWW comparison). When a record is deleted locally
 *   while offline, the server still has it, so the merge restores it — making
 *   the deletion invisible until the next successful upload clears the server.
 *
 * Solution:
 *   1. On a failed delete upload, record the deleted ID here alongside the
 *      existing enqueueRetry call (which queues the full post-delete snapshot).
 *   2. In CloudSyncManager.runSync, read pending deletes BEFORE the merge step
 *      and filter those IDs out of the server response. The merge then sees no
 *      server-side copy of the deleted record, so it does not restore it.
 *   3. After a successful push for a store, clear that store's pending deletes.
 *   4. clearAllPendingDeletes() is called after a full successful sync (same
 *      timing as clearRetryQueue) because the push already delivered the
 *      post-delete snapshot to the server.
 *
 * Storage key: @pending_deletes_v1
 * Structure: { symptoms: string[], journal: string[], reminders: string[], wellness: string[] }
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Constants ────────────────────────────────────────────────────────────────

const PENDING_DELETES_KEY = "@pending_deletes_v1";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeleteStoreType = "symptoms" | "journal" | "reminders" | "wellness";

export interface PendingDeletesStore {
  symptoms: string[];
  journal: string[];
  reminders: string[];
  wellness: string[];
}

const EMPTY_STORE: PendingDeletesStore = {
  symptoms: [],
  journal: [],
  reminders: [],
  wellness: [],
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function readStore(): Promise<PendingDeletesStore> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_DELETES_KEY);
    if (!raw) return { ...EMPTY_STORE };
    const parsed = JSON.parse(raw) as Partial<PendingDeletesStore>;
    return {
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
      journal: Array.isArray(parsed.journal) ? parsed.journal : [],
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
      wellness: Array.isArray(parsed.wellness) ? parsed.wellness : [],
    };
  } catch {
    return { ...EMPTY_STORE };
  }
}

async function writeStore(store: PendingDeletesStore): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(store));
  } catch {
    // Non-fatal — worst case the pending delete is not persisted.
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Record a locally deleted record ID so the next sync filters it out of the
 * server response before the per-record merge.
 *
 * Duplicate IDs within the same store are deduplicated automatically.
 */
export async function enqueuePendingDelete(
  storeType: DeleteStoreType,
  id: string,
): Promise<void> {
  const store = await readStore();
  const existing = store[storeType];
  if (!existing.includes(id)) {
    store[storeType] = [...existing, id];
    await writeStore(store);
  }
}

/**
 * Return the full set of pending delete IDs grouped by store.
 * Returns empty arrays for every store when nothing is queued.
 */
export async function getPendingDeletes(): Promise<PendingDeletesStore> {
  return readStore();
}

/**
 * Clear pending deletes for a single store after a successful push has
 * delivered the post-delete snapshot to the server for that store.
 */
export async function clearPendingDeletesForStore(
  storeType: DeleteStoreType,
): Promise<void> {
  const store = await readStore();
  store[storeType] = [];
  await writeStore(store);
}

/**
 * Clear all pending deletes.
 * Called after a full successful sync — the push already delivered the
 * post-delete snapshots for every store, so the server is consistent.
 */
export async function clearAllPendingDeletes(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_DELETES_KEY);
  } catch {
    // Non-fatal.
  }
}
