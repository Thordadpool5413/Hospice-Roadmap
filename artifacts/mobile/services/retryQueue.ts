/**
 * Sync retry queue — persists failed per-entry upload payloads and replays
 * them when connectivity is restored.
 *
 * Design notes:
 *   - AsyncStorage key: @sync_retry_queue_v1
 *   - Each entry stores the store type and the data snapshot at failure time.
 *   - Deduplication by store type: only the most recent failed payload per
 *     store is kept. If symptoms fail twice in a row, only the second (newer)
 *     snapshot is retained — the newer snapshot is a superset.
 *   - Maximum queue depth: MAX_QUEUE_DEPTH total entries (safety cap).
 *     Oldest entries are evicted when the cap is exceeded.
 *   - Drain: iterates the queue, calls the appropriate upload function, and
 *     removes entries that succeed. Entries that fail again remain in the
 *     queue for the next drain attempt.
 *
 * Triggers (handled by CloudSyncManager):
 *   - Network reconnect (isOnline transitions false → true)
 *   - App foreground (AppState "active")
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import type { JournalEntry, Reminder, SymptomEntry } from "@/types";
import { uploadJournal, uploadReminders, uploadSymptoms } from "./syncService";

// ─── Constants ─────────────────────────────────────────────────────────────

const RETRY_QUEUE_KEY = "@sync_retry_queue_v1";
const MAX_QUEUE_DEPTH = 50;

// ─── Types ──────────────────────────────────────────────────────────────────

export type SyncStoreType = "symptoms" | "journal" | "reminders";

export interface RetryQueueEntry {
  /** Unique entry ID — used to track and remove entries after a successful replay. */
  id: string;
  /** Which data store this payload belongs to. */
  storeType: SyncStoreType;
  /**
   * The data snapshot captured at the time of the failed upload.
   * Typed as `unknown` in storage; cast to the appropriate array type in `drain`.
   */
  data: unknown;
  /** ISO timestamp when this entry was added. */
  queuedAt: string;
}

// ─── Internal helpers ───────────────────────────────────────────────────────

async function readQueue(): Promise<RetryQueueEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(RETRY_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RetryQueueEntry[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: RetryQueueEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Non-fatal — worst case the retry is not persisted.
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Add a failed upload to the retry queue.
 *
 * - Deduplicates by `storeType`: if an entry for the same store already
 *   exists, it is replaced with the newer snapshot (newer = more complete).
 * - Enforces MAX_QUEUE_DEPTH by evicting the oldest entries.
 */
export async function enqueueRetry(
  storeType: SyncStoreType,
  data: SymptomEntry[] | JournalEntry[] | Reminder[],
): Promise<void> {
  const queue = await readQueue();

  const newEntry: RetryQueueEntry = {
    id: `${storeType}-${Date.now()}`,
    storeType,
    data,
    queuedAt: new Date().toISOString(),
  };

  // Replace existing entry for this store type (newest payload wins).
  const withoutExisting = queue.filter((e) => e.storeType !== storeType);
  const updated = [...withoutExisting, newEntry];

  // Enforce maximum depth: evict oldest entries first.
  const trimmed =
    updated.length > MAX_QUEUE_DEPTH
      ? updated.slice(updated.length - MAX_QUEUE_DEPTH)
      : updated;

  await writeQueue(trimmed);
}

/**
 * Attempt to re-upload all queued payloads.
 *
 * Entries that succeed are removed. Entries that fail again remain in the
 * queue and will be retried on the next drain call.
 *
 * Returns the number of entries that were successfully replayed.
 */
export async function drainRetryQueue(): Promise<number> {
  const queue = await readQueue();
  if (queue.length === 0) return 0;

  const failed: RetryQueueEntry[] = [];
  let successCount = 0;

  for (const entry of queue) {
    let ok = false;

    try {
      if (entry.storeType === "symptoms") {
        ok = await uploadSymptoms(entry.data as SymptomEntry[]);
      } else if (entry.storeType === "journal") {
        ok = await uploadJournal(entry.data as JournalEntry[]);
      } else if (entry.storeType === "reminders") {
        ok = await uploadReminders(entry.data as Reminder[]);
      }
    } catch {
      ok = false;
    }

    if (ok) {
      successCount++;
    } else {
      failed.push(entry);
    }
  }

  await writeQueue(failed);
  return successCount;
}

/**
 * Remove all entries from the retry queue.
 * Called after a full cloud sync succeeds, since the full sync already
 * pushes the current state of every store.
 */
export async function clearRetryQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RETRY_QUEUE_KEY);
  } catch {
    // Non-fatal.
  }
}

/**
 * Return the current number of entries in the retry queue.
 * Useful for telemetry or UI badges.
 */
export async function getRetryQueueDepth(): Promise<number> {
  const queue = await readQueue();
  return queue.length;
}
