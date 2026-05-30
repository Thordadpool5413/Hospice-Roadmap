/**
 * CloudSyncProvider — wraps the app tree and provides CloudSyncContext.
 *
 * Triggers on:
 *   - Initial sign-in (after ALL contexts finish loading from AsyncStorage —
 *     uses isLoading flags from AppContext, SymptomContext, JournalContext,
 *     RemindersContext, and VeraMemoryContext)
 *   - App foreground (AppState "active")
 *   - Network reconnect (isOnline transitions false → true via useAppNetwork)
 *   - Manual user tap via triggerSync() from CloudSyncContext
 *
 * Conflict resolution strategy:
 *   - Symptom entries and journal entries: per-record merge (union by ID).
 *     For matching IDs, the record with the newer `updatedAt` wins; the server
 *     is the tie-break authority. This prevents last-write-wins at the store
 *     level when two devices edit while one is offline.
 *   - Goals of care: field-level merge — each of the five GoC fields is
 *     resolved independently using `fieldUpdatedAt[field] ?? documentUpdatedAt`
 *     as the effective timestamp. Two devices that each edited a different
 *     field while offline both keep their change. Falls back to document-level
 *     LWW when neither side has per-field timestamps (backward compatibility).
 *   - Living profile: true LWW — compare stored `livingProfileUpdatedAt`
 *     against the server row's `updatedAt` and keep whichever is newer.
 *   - Reminders: per-record merge (union by ID, same LWW strategy as
 *     symptoms and journal). Falls back to scheduled datetime as the logical
 *     version for pre-updatedAt records.
 *
 * Merge note:
 *   The merged arrays are used for BOTH the hydrate call (writing to local
 *   storage / context state) and the push call (uploading to the server).
 *   This is intentional: because React state updates are batched and won't
 *   be reflected in the `symptoms`/`journal`/`reminders` closure until the
 *   next render, reading from the closure after hydration would push stale
 *   pre-merge data. Using the captured merged array guarantees the server
 *   receives the full union even within a single sync run.
 */

import { useAuth } from "@clerk/expo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";

import { useApp } from "@/context/AppContext";
import { useCaregiverWellness } from "@/context/CaregiverWellnessContext";
import { useJournal } from "@/context/JournalContext";
import { useReminders } from "@/context/RemindersContext";
import { useSymptoms } from "@/context/SymptomContext";
import { useVeraMemory } from "@/context/VeraMemoryContext";
import { useAppNetwork } from "@/hooks/useAppNetwork";
import { clearRetryQueue, drainRetryQueue } from "@/services/retryQueue";
import {
  clearAllPendingDeletes,
  getPendingDeletes,
} from "@/services/pendingDeletes";
import {
  fetchServerData,
  mergeGoalsOfCare,
  mergeJournalEntries,
  mergeReminderEntries,
  mergeSymptomEntries,
  mergeWellnessEntries,
  readSyncLastSuccess,
  recordSyncSuccess,
  runOnceLocalMigration,
  uploadCaregiverWellness,
  uploadGoals,
  uploadJournal,
  uploadLivingProfile,
  uploadReminders,
  uploadSymptoms,
} from "@/services/syncService";
import type { GoalsOfCare } from "@/types";

// ─── Toast threshold ───────────────────────────────────────────────────────────
// Show the "Synced" toast only when the previous successful sync was at least
// this many milliseconds ago. Keeps frequent background syncs quiet.
const SYNC_TOAST_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// ─── Context ──────────────────────────────────────────────────────────────────

interface CloudSyncContextValue {
  /** Manually trigger a full sync. Resolves when the sync attempt finishes. */
  triggerSync: () => Promise<void>;
  /** True while a sync is in progress. */
  isSyncing: boolean;
  /**
   * Updated to a new Date() each time a qualifying sync completes while the
   * app is in the foreground and the previous sync was more than
   * SYNC_TOAST_THRESHOLD_MS ago. Consumers (e.g. SyncSuccessToast) watch
   * this value to decide when to show a confirmation.
   */
  syncSucceededAt: Date | null;
}

const CloudSyncContext = createContext<CloudSyncContextValue>({
  triggerSync: async () => {},
  isSyncing: false,
  syncSucceededAt: null,
});

export function useCloudSync(): CloudSyncContextValue {
  return useContext(CloudSyncContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface CloudSyncProviderProps {
  children: React.ReactNode;
}

export function CloudSyncProvider({ children }: CloudSyncProviderProps) {
  const { isSignedIn } = useAuth();
  const { isOnline } = useAppNetwork();

  // isLoading from AppContext is true until AsyncStorage hydration is done
  const { user, isLoading: appLoading, updatePatientProfile } = useApp();
  const { entries: symptoms, isLoading: sympLoading, hydrateFromServer: hydrateSymptoms } = useSymptoms();
  const { entries: journal, isLoading: jrnLoading, hydrateFromServer: hydrateJournal } = useJournal();
  const { reminders, isLoading: remLoading, hydrateFromServer: hydrateReminders } = useReminders();
  const {
    livingProfile,
    livingProfileUpdatedAt,
    isLoading: veraLoading,
    updateLivingProfile,
  } = useVeraMemory();
  const {
    entries: wellnessEntries,
    isLoading: wellnessLoading,
    hydrateFromServer: hydrateWellness,
  } = useCaregiverWellness();

  const initialized = useRef(false);
  const isSyncingRef = useRef(false);
  const wasOnline = useRef<boolean | null>(null);

  // Reactive isSyncing state for UI consumers
  const [isSyncing, setIsSyncing] = useState(false);

  // Updated to a new Date() when a qualifying foreground sync completes.
  // "Qualifying" = app is active + previous sync was > SYNC_TOAST_THRESHOLD_MS ago.
  const [syncSucceededAt, setSyncSucceededAt] = useState<Date | null>(null);

  // All six local stores must have finished loading from AsyncStorage before
  // we attempt any sync or hydration. This prevents pushing stale empty-state
  // or missing a restore because any context was still null at sync time.
  const contextsReady = !appLoading && !sympLoading && !jrnLoading && !remLoading && !veraLoading && !wellnessLoading;

  const runSync = useCallback(async () => {
    if (!isSignedIn || isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      const serverData = await fetchServerData();
      if (!serverData) return;

      // Step 1: one-time migration — upload local data where server has none
      await runOnceLocalMigration(serverData);

      // Step 1b: filter pending-deleted IDs out of server data before merging.
      //
      // Union merges (symptoms, journal) include any ID present on EITHER side.
      // A record deleted locally while offline has no local counterpart, so the
      // merge would restore it from the server unchanged. Reading the pending-
      // deletes queue here and removing those IDs from the server response
      // prevents the restoration before the merge runs.
      //
      // This is read once and used for both the merge and the push phase to
      // avoid a second AsyncStorage round-trip.
      const pendingDeletes = await getPendingDeletes();

      const filteredServerSymptoms = pendingDeletes.symptoms.length > 0
        ? serverData.symptoms.filter((e) => !pendingDeletes.symptoms.includes(e.id))
        : serverData.symptoms;

      const filteredServerJournal = pendingDeletes.journal.length > 0
        ? serverData.journal.filter((e) => !pendingDeletes.journal.includes(e.id))
        : serverData.journal;

      // Reminders use restore-if-empty rather than per-record merge. If the
      // user deleted all reminders while offline, filter the server list so
      // that restore-if-empty doesn't bring them back when local becomes empty.
      const filteredServerReminders = pendingDeletes.reminders.length > 0
        ? serverData.reminders.filter((r) => !pendingDeletes.reminders.includes(r.id))
        : serverData.reminders;

      // Step 2: merge server data into local state
      //
      // For list stores (symptoms, journal): union of IDs with per-record LWW.
      // This means entries added on another device while this one was offline
      // are restored, and edits to the same record resolve by timestamp.
      //
      // For scalar stores (goals, living profile): LWW by comparing updatedAt
      // timestamps between local and server — the newer version wins.

      // ── Symptoms (per-record merge) ──────────────────────────────────────
      // Use filteredServerSymptoms — pending-deleted IDs have been removed so
      // the union merge cannot restore records the user already removed offline.
      const mergedSymptoms = mergeSymptomEntries(symptoms, filteredServerSymptoms);
      // Always hydrate: if mergedSymptoms === symptoms (no new data), the write
      // is idempotent and inexpensive. This also handles the restore case.
      await hydrateSymptoms(mergedSymptoms);

      // ── Journal (per-record merge) ───────────────────────────────────────
      const mergedJournal = mergeJournalEntries(journal, filteredServerJournal);
      await hydrateJournal(mergedJournal);

      // ── Goals of care (field-level merge) ───────────────────────────────
      //
      // Rather than picking one document wholesale (true LWW), we resolve each
      // of the five GoC fields independently. Each field's effective timestamp
      // is `fieldUpdatedAt[field] ?? documentUpdatedAt`, so two devices that
      // each edited a different field while offline both keep their changes.
      //
      // `resolvedGoals` captures the merged result so Step 3 can upload the
      // correct payload without reading from the stale React closure (React
      // state updates from `updatePatientProfile` are batched and won't be
      // reflected in `user` until the next render).
      const serverGoalsContent = serverData.goals?.content as GoalsOfCare | undefined;
      const serverGoalsTs = serverData.goals?.updatedAt;
      const localGoals = user?.patientProfile?.goalsOfCare;

      // resolvedGoals is the version that will be pushed in Step 3.
      const resolvedGoals: GoalsOfCare | null = mergeGoalsOfCare(
        localGoals,
        serverGoalsContent,
        serverGoalsTs,
      );

      // Apply the merged result to local state only when it differs from what
      // the local closure already holds. This covers three cases:
      //   1. Local was empty → restore from server.
      //   2. Server had fields the local device never set → merge them in.
      //   3. Local already matches → no-op (idempotent).
      if (resolvedGoals && resolvedGoals !== localGoals) {
        const currentProfile = user?.patientProfile ?? {};
        updatePatientProfile({ ...currentProfile, goalsOfCare: resolvedGoals });
      }

      // ── Living profile (true LWW by updatedAt) ───────────────────────────
      // The server row's updatedAt is now typed on ServerSyncData, so we read
      // it directly rather than via a cast.
      if (serverData.livingProfile?.profile) {
        const serverTs = serverData.livingProfile.updatedAt ?? null;
        const serverIsNewer = serverTs && (
          !livingProfileUpdatedAt ||
          new Date(serverTs) > new Date(livingProfileUpdatedAt)
        );
        const profileIsEmpty = !livingProfile;
        if (profileIsEmpty || serverIsNewer) {
          // Pass the server's own updatedAt so the local copy stores the correct
          // LWW version and doesn't immediately re-upload as "newer on next sync"
          await updateLivingProfile(serverData.livingProfile.profile, serverTs ?? undefined);
        }
      }

      // ── Reminders (per-record merge) ─────────────────────────────────────
      // Union of local and server reminder sets, resolving conflicts by
      // `updatedAt` (server wins on tie). Uses filteredServerReminders so that
      // IDs deleted locally while offline (tracked in pendingDeletes) are not
      // restored from the server side of the union.
      // Always hydrate: when mergedReminders === reminders (no new data) the
      // write is idempotent and inexpensive, but it covers the restore case
      // (new device / reinstall) without a separate empty-guard branch.
      const mergedReminders = mergeReminderEntries(reminders, filteredServerReminders);
      await hydrateReminders(mergedReminders as Parameters<typeof hydrateReminders>[0]);

      // ── Caregiver wellness (per-record merge) ─────────────────────────────
      // Union of local and server wellness entries, resolving conflicts by
      // `updatedAt` (server wins on tie). The server returns an empty array
      // when the user has no records, so merging is always safe.
      const serverWellness = serverData.caregiverWellness ?? [];
      const mergedWellness = mergeWellnessEntries(wellnessEntries, serverWellness);
      await hydrateWellness(mergedWellness);

      // Step 3: push current local state to server with stored LWW timestamps.
      //
      // For symptoms and journal we push the *merged* arrays captured above
      // rather than the React closure values (`symptoms`, `journal`). React
      // state updates from the hydrate calls above are batched and won't be
      // visible in the closure until the next render, so using the closure
      // here would upload only the pre-merge local data and miss entries that
      // came from the server side of the merge.
      //
      // For goals of care we use `resolvedGoals` — also captured during
      // Step 2 — for the same reason: the closure's `user.patientProfile`
      // has not yet reflected the `updatePatientProfile` call above.
      const pushOps: Promise<unknown>[] = [];

      if (mergedSymptoms.length > 0) pushOps.push(uploadSymptoms(mergedSymptoms));
      if (mergedJournal.length > 0) pushOps.push(uploadJournal(mergedJournal));

      if (resolvedGoals) {
        const hasAnyGoals = !!(
          resolvedGoals.whatMattersMost?.trim() ||
          resolvedGoals.goodDayLooksLike?.trim() ||
          resolvedGoals.thingsToAvoid?.trim() ||
          resolvedGoals.dnrStatus ||
          resolvedGoals.additionalDirectives?.trim()
        );
        if (hasAnyGoals) {
          pushOps.push(uploadGoals(resolvedGoals));
        }
      }

      if (livingProfile && livingProfileUpdatedAt) {
        // Send the stored timestamp — not new Date() — so LWW is based on
        // when the profile was actually written, not when this sync ran.
        pushOps.push(uploadLivingProfile(livingProfile, livingProfileUpdatedAt));
      }

      if (mergedReminders.length > 0) pushOps.push(uploadReminders(mergedReminders));

      if (mergedWellness.length > 0) pushOps.push(uploadCaregiverWellness(mergedWellness));

      const pushResults = await Promise.allSettled(pushOps);

      // Record the timestamp only when every attempted upload actually succeeded.
      // Each upload helper returns Promise<boolean> and resolves false on network
      // or HTTP failure rather than rejecting, so allSettled alone is not
      // sufficient — we must also check that every fulfilled value is true.
      const allPushesSucceeded =
        pushOps.length === 0 ||
        pushResults.every((r) => r.status === "fulfilled" && r.value === true);

      if (allPushesSucceeded) {
        // Read the previous success timestamp BEFORE overwriting it so we can
        // decide whether the toast threshold has elapsed.
        const prevSuccessRaw = await readSyncLastSuccess();
        await recordSyncSuccess();
        // A successful full sync pushed the current state of every store, so
        // any queued retry payloads and pending-delete entries are redundant.
        await clearRetryQueue();
        await clearAllPendingDeletes();

        // ── Toast eligibility ────────────────────────────────────────────
        // Show the "Synced" confirmation only when:
        //   1. The app is currently in the foreground (user can see it).
        //   2. Enough time has passed since the last sync to avoid spamming.
        const isForegrounded = AppState.currentState === "active";
        const prevTs = prevSuccessRaw ? new Date(prevSuccessRaw).getTime() : 0;
        const thresholdElapsed = Date.now() - prevTs >= SYNC_TOAST_THRESHOLD_MS;

        if (isForegrounded && thresholdElapsed) {
          setSyncSucceededAt(new Date());
        }
      }
    } catch {
      // Sync failures are silent — app continues to work offline
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [
    isSignedIn,
    symptoms,
    journal,
    reminders,
    wellnessEntries,
    user,
    livingProfile,
    livingProfileUpdatedAt,
    hydrateSymptoms,
    hydrateJournal,
    hydrateReminders,
    hydrateWellness,
    updatePatientProfile,
    updateLivingProfile,
  ]);

  // Initial sync — runs once per sign-in, but only after ALL contexts have
  // finished loading from AsyncStorage (including VeraMemoryContext)
  useEffect(() => {
    if (!isSignedIn || !contextsReady || initialized.current) return;
    initialized.current = true;
    runSync();
  }, [isSignedIn, contextsReady]);

  // Reset flag on sign-out so sync runs fresh on the next sign-in
  useEffect(() => {
    if (!isSignedIn) {
      initialized.current = false;
    }
  }, [isSignedIn]);

  // Sync on app foreground (only after initial sync has already fired)
  useEffect(() => {
    if (!isSignedIn) return;

    const handleAppState = (next: AppStateStatus) => {
      if (next === "active") {
        runSync();
      }
    };

    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [isSignedIn, runSync]);

  // Sync on network reconnect (offline → online transition).
  // In addition to a full runSync, drain the retry queue so any per-entry
  // uploads that failed while offline are replayed immediately. The retry
  // drain runs concurrently with runSync; the full sync's clearRetryQueue
  // at the end will clean up any entries that the drain also succeeded on.
  useEffect(() => {
    if (!isSignedIn) return;

    // Skip the initial value — only react to transitions
    if (wasOnline.current === null) {
      wasOnline.current = isOnline;
      return;
    }

    const justReconnected = !wasOnline.current && isOnline;
    wasOnline.current = isOnline;

    if (justReconnected) {
      void drainRetryQueue();
      runSync();
    }
  }, [isSignedIn, isOnline, runSync]);

  return (
    <CloudSyncContext.Provider value={{ triggerSync: runSync, isSyncing, syncSucceededAt }}>
      {children}
    </CloudSyncContext.Provider>
  );
}

/** @deprecated Use CloudSyncProvider instead */
export function CloudSyncManager() {
  return null;
}
