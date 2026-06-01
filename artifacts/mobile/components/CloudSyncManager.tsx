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
  uploadProfile,
  uploadRagnaMemory,
  uploadReminders,
  uploadSymptoms,
} from "@/services/syncService";
import { mergeSavedList } from "@/services/savedListsMerge";
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
  /**
   * Set to a human-readable error message when the most recent sync attempt
   * failed (e.g. network error or partial upload failure). Cleared to null
   * at the start of every new sync attempt and after a successful sync.
   */
  syncError: string | null;
}

const CloudSyncContext = createContext<CloudSyncContextValue>({
  triggerSync: async () => {},
  isSyncing: false,
  syncSucceededAt: null,
  syncError: null,
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
  const {
    user,
    isLoading: appLoading,
    hydrateGoalsFromSync,
    hydrateProfileFromServer,
    hydrateSavedListsFromSync,
    markBookmarksSynced,
  } = useApp();
  const { entries: symptoms, isLoading: sympLoading, hydrateFromServer: hydrateSymptoms } = useSymptoms();
  const { entries: journal, isLoading: jrnLoading, hydrateFromServer: hydrateJournal } = useJournal();
  const { reminders, isLoading: remLoading, hydrateFromServer: hydrateReminders } = useReminders();
  const {
    memories: ragnaMemories,
    livingProfile,
    livingProfileUpdatedAt,
    ragnaMemoryUpdatedAt,
    recentTiles: ragnaTiles,
    isLoading: veraLoading,
    updateLivingProfile,
    hydrateFromServer: hydrateRagnaMemory,
  } = useVeraMemory();
  const {
    entries: wellnessEntries,
    isLoading: wellnessLoading,
    hydrateFromServer: hydrateWellness,
    markSynced: markWellnessSynced,
  } = useCaregiverWellness();

  const initialized = useRef(false);
  const isSyncingRef = useRef(false);
  const wasOnline = useRef<boolean | null>(null);

  // Reactive isSyncing state for UI consumers
  const [isSyncing, setIsSyncing] = useState(false);

  // Updated to a new Date() when a qualifying foreground sync completes.
  // "Qualifying" = app is active + previous sync was > SYNC_TOAST_THRESHOLD_MS ago.
  const [syncSucceededAt, setSyncSucceededAt] = useState<Date | null>(null);

  // Set to a human-readable message when a sync attempt fails; cleared on the
  // next sync start and cleared again on success.
  const [syncError, setSyncError] = useState<string | null>(null);

  // All six local stores must have finished loading from AsyncStorage before
  // we attempt any sync or hydration. This prevents pushing stale empty-state
  // or missing a restore because any context was still null at sync time.
  const contextsReady = !appLoading && !sympLoading && !jrnLoading && !remLoading && !veraLoading && !wellnessLoading;

  const runSync = useCallback(async () => {
    if (!isSignedIn || isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncError(null);

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
      //
      // We use `hydrateGoalsFromSync` instead of `updatePatientProfile` here.
      // `updatePatientProfile` calls `saveUser` which now stamps `updatedAt` and
      // fires `uploadProfile` — using it during sync would overwrite the server
      // profile with a stale React closure value carrying a brand-new timestamp.
      if (resolvedGoals && resolvedGoals !== localGoals) {
        await hydrateGoalsFromSync(resolvedGoals);
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

      // ── Ragna AI memory (true LWW by ragnaMemoryUpdatedAt) ───────────────
      //
      // Memories and tile history are stored as a single document per user.
      // The version key is `ragnaMemoryUpdatedAt` — a dedicated timestamp
      // stamped and persisted on every addMemory / recordTile write.  It is
      // independent of `livingProfileUpdatedAt` so the two stores can advance
      // independently without one clobbering the other.
      //
      // LWW: the server row wins when the server timestamp is newer than the
      // local version, or when local has no content yet (new device / reinstall).
      //
      // Captured resolved values let Step 3 push the correct data even though
      // React state from the hydrate call won't be visible in the closure until
      // the next render.
      let resolvedRagnaMemories = ragnaMemories;
      let resolvedRagnaTiles = ragnaTiles;
      let resolvedRagnaUpdatedAt = ragnaMemoryUpdatedAt;

      if (serverData.ragnaMemory) {
        const serverTs = serverData.ragnaMemory.updatedAt ?? null;
        const serverIsNewer = serverTs && (
          !ragnaMemoryUpdatedAt ||
          new Date(serverTs) > new Date(ragnaMemoryUpdatedAt)
        );
        const ragnaIsEmpty = ragnaMemories.length === 0 && ragnaTiles.length === 0;

        if (ragnaIsEmpty || serverIsNewer) {
          const serverMemories = serverData.ragnaMemory.memories as import("@/types").VeraMemory[];
          const serverTiles = serverData.ragnaMemory.tiles as string[];
          const effectiveTs = serverTs ?? new Date().toISOString();
          // Pass the server's own updatedAt so local LWW is set correctly and
          // the next sync doesn't immediately re-upload this as "newer".
          await hydrateRagnaMemory(serverMemories, serverTiles, effectiveTs);
          resolvedRagnaMemories = serverMemories;
          resolvedRagnaTiles = serverTiles;
          resolvedRagnaUpdatedAt = effectiveTs;
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
      // Uses filteredServerWellness — pending-deleted IDs have been removed so
      // the union merge cannot restore entries the user already deleted offline.
      const filteredServerWellness = pendingDeletes.wellness.length > 0
        ? (serverData.caregiverWellness ?? []).filter((e) => !pendingDeletes.wellness.includes(e.id))
        : (serverData.caregiverWellness ?? []);
      const mergedWellness = mergeWellnessEntries(wellnessEntries, filteredServerWellness);
      await hydrateWellness(mergedWellness);

      // ── Saved resources & providers (set union merge) ─────────────────────
      //
      // These two arrays are part of the user profile object but use a union
      // merge strategy (like symptoms/journal) rather than true LWW.  This
      // ensures a resource bookmarked on Device A while offline is never wiped
      // by a newer profile saved on Device B.
      //
      // IDs the user explicitly un-saved while offline are tracked in the
      // pending-deletes queue (savedResources / savedProviders stores) and
      // filtered out of the union so the deletion survives a sync.
      const serverSavedResources: string[] =
        Array.isArray(serverData.userProfile?.data?.savedResources)
          ? (serverData.userProfile!.data.savedResources as string[])
          : [];
      const serverSavedProviders: string[] =
        Array.isArray(serverData.userProfile?.data?.savedProviders)
          ? (serverData.userProfile!.data.savedProviders as string[])
          : [];
      const localSavedResources: string[] = user?.savedResources ?? [];
      const localSavedProviders: string[] = user?.savedProviders ?? [];

      const mergedSavedResources = mergeSavedList(
        localSavedResources,
        serverSavedResources,
        pendingDeletes.savedResources,
      );

      const mergedSavedProviders = mergeSavedList(
        localSavedProviders,
        serverSavedProviders,
        pendingDeletes.savedProviders,
      );

      // ── User profile (LWW for scalar fields, union for saved lists) ────────
      // The server stores role, journeyStage, name, onboardingComplete,
      // savedResources/Providers, ragnaPrivacy, and patientProfile WITHOUT
      // goalsOfCare (that field is owned by the /sync/goals path above).
      //
      // Scalar fields (role, journeyStage, ragnaPrivacy …) use true LWW keyed
      // on user.updatedAt. The saved-list fields always use the union computed
      // above and are injected into whichever profile data wins the LWW so
      // `hydrateProfileFromServer` persists the correct union.
      //
      // `hydrateProfileFromServer` always preserves the local goalsOfCare value
      // so the two sync paths don't interfere with each other.
      //
      // IMPORTANT: `appliedServerProfile` drives the Step 3 push decision.
      // When we hydrate from server the `user` React closure still holds the
      // pre-hydration (stale) value. We must NOT push the closure in that case
      // or we'd immediately overwrite the correct server data with stale local
      // data (doubly dangerous for legacy profiles that lack `updatedAt`).
      let appliedServerProfile = false;
      if (serverData.userProfile?.data) {
        const serverProfileTs  = serverData.userProfile.updatedAt;
        const localProfileTs   = user?.updatedAt;
        const serverIsNewer    = serverProfileTs && (
          !localProfileTs || new Date(serverProfileTs) > new Date(localProfileTs)
        );
        const isNewDevice = !user?.onboardingComplete;

        if (serverIsNewer || isNewDevice) {
          // Inject the union-merged saved lists so hydrateProfileFromServer
          // persists them rather than restoring the server's raw (possibly
          // smaller) snapshot.
          const dataWithMergedLists: Record<string, unknown> = {
            ...serverData.userProfile.data,
            savedResources: mergedSavedResources,
            savedProviders: mergedSavedProviders,
          };
          await hydrateProfileFromServer(dataWithMergedLists);
          appliedServerProfile = true;
        } else {
          // Local profile wins the LWW comparison, but we still union-merge the
          // saved lists in case the server contributed bookmarks from another
          // device. Only write if the merged result actually differs from local.
          const savedListsChanged =
            mergedSavedResources.length !== localSavedResources.length ||
            mergedSavedProviders.length !== localSavedProviders.length ||
            mergedSavedResources.some((id) => !localSavedResources.includes(id)) ||
            mergedSavedProviders.some((id) => !localSavedProviders.includes(id));

          if (savedListsChanged) {
            await hydrateSavedListsFromSync(mergedSavedResources, mergedSavedProviders);
          }
        }
      } else if (user?.onboardingComplete) {
        // No server profile yet — still apply local pending-deletes filtering
        // so un-saved IDs don't linger after the queue is cleared.
        const filteredResources = localSavedResources.filter(
          (id) => !pendingDeletes.savedResources.includes(id),
        );
        const filteredProviders = localSavedProviders.filter(
          (id) => !pendingDeletes.savedProviders.includes(id),
        );
        const savedListsChanged =
          filteredResources.length !== localSavedResources.length ||
          filteredProviders.length !== localSavedProviders.length;
        if (savedListsChanged) {
          await hydrateSavedListsFromSync(filteredResources, filteredProviders);
        }
      }

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

      // Push Ragna memory when we have anything to save.
      // Use `resolvedRagna*` (captured during Step 2) rather than the React
      // closure values, which may not yet reflect a hydration that just ran.
      // Only push when there is something meaningful (at least one memory or
      // tile) — an empty upload would create a server row with no content.
      if (
        (resolvedRagnaMemories.length > 0 || resolvedRagnaTiles.length > 0) &&
        resolvedRagnaUpdatedAt
      ) {
        pushOps.push(uploadRagnaMemory(resolvedRagnaMemories, resolvedRagnaTiles, resolvedRagnaUpdatedAt));
      }

      if (mergedReminders.length > 0) pushOps.push(uploadReminders(mergedReminders));

      // Always push when there are pending wellness deletes so that an empty
      // merged result (the user deleted their last entry offline) actually
      // clears the server — otherwise clearAllPendingDeletes() would wipe the
      // delete marker before the server had received the empty snapshot, and
      // the next sync would restore the deleted entry.
      if (mergedWellness.length > 0 || pendingDeletes.wellness.length > 0) {
        pushOps.push(uploadCaregiverWellness(mergedWellness));
      }

      // Push user profile:
      //
      // Case A — local profile wins LWW (appliedServerProfile=false):
      //   Push the local `user` closure with merged saved lists injected. We use
      //   the captured `mergedSavedResources`/`mergedSavedProviders` rather than
      //   `user.savedResources`/`user.savedProviders` because the hydrate call
      //   above (hydrateSavedListsFromSync) is batched and the closure hasn't
      //   updated yet. Guards: onboardingComplete + updatedAt (same as before).
      //
      // Case B — server profile wins LWW (appliedServerProfile=true):
      //   The `user` closure is stale — we must NOT push it wholesale. But if
      //   the merged saved lists differ from the server's snapshot, we still need
      //   to push so that the union survives on the server. In this case we
      //   construct a synthetic profile from the server's own data (already the
      //   "winning" value for scalar fields) + merged lists + a fresh updatedAt
      //   so the server's LWW accepts the update.
      if (!appliedServerProfile && user?.onboardingComplete && user.updatedAt) {
        // Case A: push closure with merged saved lists
        const profileWithMergedLists = {
          ...user,
          savedResources: mergedSavedResources,
          savedProviders: mergedSavedProviders,
        };
        pushOps.push(uploadProfile(profileWithMergedLists));
      } else if (appliedServerProfile && serverData.userProfile?.data && user?.onboardingComplete) {
        // Case B: push only when merged lists contain bookmarks the server lacked.
        // Compare merged result against what the server originally sent — if the
        // union added any IDs (or pending deletes removed any), push the update.
        const serverHadAllResources = mergedSavedResources.every((id) =>
          serverSavedResources.includes(id),
        );
        const serverHadAllProviders = mergedSavedProviders.every((id) =>
          serverSavedProviders.includes(id),
        );
        const serverHadExtraResources = serverSavedResources.some(
          (id) => pendingDeletes.savedResources.includes(id),
        );
        const serverHadExtraProviders = serverSavedProviders.some(
          (id) => pendingDeletes.savedProviders.includes(id),
        );
        const needsListPush =
          !serverHadAllResources ||
          !serverHadAllProviders ||
          serverHadExtraResources ||
          serverHadExtraProviders;

        if (needsListPush) {
          // Use the server's profile data as the base so we don't push stale
          // scalar fields from the closure. Override saved lists with the union
          // and stamp a fresh updatedAt so the server accepts the update.
          const syntheticProfile = {
            ...(serverData.userProfile.data as unknown as import("@/types").User),
            savedResources: mergedSavedResources,
            savedProviders: mergedSavedProviders,
            updatedAt: new Date().toISOString(),
          };
          pushOps.push(uploadProfile(syntheticProfile));
        }
      }

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
        // Dismiss the wellness pending-sync badge now that all entries have
        // been confirmed uploaded to the server.
        markWellnessSynced();
        // Dismiss the bookmark pending-sync badge now that the saved-lists
        // snapshot has been delivered to the server.
        markBookmarksSynced();
        // A successful full sync pushed the current state of every store, so
        // any queued retry payloads and pending-delete entries are redundant.
        await clearRetryQueue();
        await clearAllPendingDeletes();
        // Clear any previous error now that sync succeeded.
        setSyncError(null);

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
      } else {
        // One or more push operations failed — let the UI know so it can
        // surface a useful error message to the user.
        setSyncError("Last sync failed — reconnect to sync");
      }
    } catch {
      // Sync failures are silent at the system level — app continues offline.
      // Surface the failure to the UI via syncError.
      setSyncError("Last sync failed — reconnect to sync");
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
    ragnaMemories,
    ragnaTiles,
    ragnaMemoryUpdatedAt,
    hydrateSymptoms,
    hydrateJournal,
    hydrateReminders,
    hydrateWellness,
    hydrateGoalsFromSync,
    hydrateProfileFromServer,
    hydrateSavedListsFromSync,
    updateLivingProfile,
    hydrateRagnaMemory,
    markWellnessSynced,
    markBookmarksSynced,
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
    <CloudSyncContext.Provider value={{ triggerSync: runSync, isSyncing, syncSucceededAt, syncError }}>
      {children}
    </CloudSyncContext.Provider>
  );
}

/** @deprecated Use CloudSyncProvider instead */
export function CloudSyncManager() {
  return null;
}
