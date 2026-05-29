/**
 * CloudSyncManager — mounts inside all context providers and ClerkLoaded.
 *
 * Triggers on:
 *   - Initial sign-in (after ALL contexts finish loading from AsyncStorage —
 *     uses isLoading flags from AppContext, SymptomContext, JournalContext,
 *     RemindersContext, and VeraMemoryContext)
 *   - App foreground (AppState "active")
 *   - Network reconnect (isOnline transitions false → true via useAppNetwork)
 *
 * Conflict resolution strategy:
 *   - Symptom entries and journal entries: per-record merge (union by ID).
 *     For matching IDs, the record with the newer `updatedAt` wins; the server
 *     is the tie-break authority. This prevents last-write-wins at the store
 *     level when two devices edit while one is offline.
 *   - Goals of care: true LWW — compare the server row's `updatedAt` against
 *     the local GoalsOfCare.updatedAt and keep whichever is newer.
 *   - Living profile: true LWW — compare stored `livingProfileUpdatedAt`
 *     against the server row's `updatedAt` and keep whichever is newer.
 *   - Reminders: restore-if-empty (no per-record merge; reminders are
 *     device-local by nature and the merge spec does not apply to them).
 *
 * Merge note:
 *   The merged arrays are used for BOTH the hydrate call (writing to local
 *   storage / context state) and the push call (uploading to the server).
 *   This is intentional: because React state updates are batched and won't
 *   be reflected in the `symptoms`/`journal` closure until the next render,
 *   reading from the closure after hydration would push stale pre-merge data.
 *   Using the captured merged array guarantees the server receives the full
 *   union even within a single sync run.
 */

import { useAuth } from "@clerk/expo";
import React, { useCallback, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

import { useApp } from "@/context/AppContext";
import { useJournal } from "@/context/JournalContext";
import { useReminders } from "@/context/RemindersContext";
import { useSymptoms } from "@/context/SymptomContext";
import { useVeraMemory } from "@/context/VeraMemoryContext";
import { useAppNetwork } from "@/hooks/useAppNetwork";
import { clearRetryQueue, drainRetryQueue } from "@/services/retryQueue";
import {
  fetchServerData,
  mergeJournalEntries,
  mergeSymptomEntries,
  recordSyncSuccess,
  runOnceLocalMigration,
  uploadGoals,
  uploadJournal,
  uploadLivingProfile,
  uploadReminders,
  uploadSymptoms,
} from "@/services/syncService";
import type { GoalsOfCare } from "@/types";

export function CloudSyncManager() {
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

  const initialized = useRef(false);
  const isSyncing = useRef(false);
  const wasOnline = useRef<boolean | null>(null);

  // All five local stores must have finished loading from AsyncStorage before
  // we attempt any sync or hydration. This prevents pushing stale empty-state
  // or missing a restore because any context was still null at sync time.
  const contextsReady = !appLoading && !sympLoading && !jrnLoading && !remLoading && !veraLoading;

  const runSync = useCallback(async () => {
    if (!isSignedIn || isSyncing.current) return;
    isSyncing.current = true;

    try {
      const serverData = await fetchServerData();
      if (!serverData) return;

      // Step 1: one-time migration — upload local data where server has none
      await runOnceLocalMigration(serverData);

      // Step 2: merge server data into local state
      //
      // For list stores (symptoms, journal): union of IDs with per-record LWW.
      // This means entries added on another device while this one was offline
      // are restored, and edits to the same record resolve by timestamp.
      //
      // For scalar stores (goals, living profile): LWW by comparing updatedAt
      // timestamps between local and server — the newer version wins.

      // ── Symptoms (per-record merge) ──────────────────────────────────────
      const mergedSymptoms = mergeSymptomEntries(symptoms, serverData.symptoms);
      // Always hydrate: if mergedSymptoms === symptoms (no new data), the write
      // is idempotent and inexpensive. This also handles the restore case.
      await hydrateSymptoms(mergedSymptoms);

      // ── Journal (per-record merge) ───────────────────────────────────────
      const mergedJournal = mergeJournalEntries(journal, serverData.journal);
      await hydrateJournal(mergedJournal);

      // ── Goals of care (true LWW by updatedAt) ───────────────────────────
      //
      // `resolvedGoals` captures the winning version so Step 3 uploads the
      // correct payload. We must NOT read from the `user` closure after
      // calling `updatePatientProfile` — React state updates are batched and
      // the closure still holds the pre-update value for the rest of this
      // async function, which would cause the stale local copy to be uploaded
      // with a fresh timestamp and overwrite the newer server data.
      const serverGoalsContent = serverData.goals?.content as GoalsOfCare | undefined;
      const serverGoalsTs = serverData.goals?.updatedAt;
      const localGoals = user?.patientProfile?.goalsOfCare;
      const localGoalsTs = localGoals?.updatedAt;

      const hasLocalGoals = !!(
        localGoals?.whatMattersMost?.trim() ||
        localGoals?.goodDayLooksLike?.trim() ||
        localGoals?.thingsToAvoid?.trim() ||
        localGoals?.dnrStatus ||
        localGoals?.additionalDirectives?.trim()
      );

      // resolvedGoals is the version that will be pushed in Step 3.
      // It is set here during Step 2 so Step 3 never touches the stale closure.
      let resolvedGoals: GoalsOfCare | null = null;

      if (serverGoalsContent) {
        let applyServer = false;
        if (!hasLocalGoals) {
          // Local is empty — always restore from server
          applyServer = true;
        } else if (serverGoalsTs && localGoalsTs) {
          // Both have explicit timestamps — proper LWW
          applyServer = new Date(serverGoalsTs) > new Date(localGoalsTs);
        } else if (serverGoalsTs && !localGoalsTs) {
          // Server has an explicit version; local predates the updatedAt field
          // — treat the server record as authoritative
          applyServer = true;
        }
        // else: local has a timestamp but server doesn't (shouldn't happen), or
        // neither has a timestamp — keep local to avoid silent data loss.

        if (applyServer) {
          const currentProfile = user?.patientProfile ?? {};
          updatePatientProfile({ ...currentProfile, goalsOfCare: serverGoalsContent });
          // Resolved = server content. Carry the server's updatedAt so the
          // upload uses the correct LWW key and is a no-op on the server
          // (same data, same or older timestamp — server's setWhere guard
          // will keep the existing row untouched).
          resolvedGoals = serverGoalsTs
            ? { ...serverGoalsContent, updatedAt: serverGoalsTs }
            : serverGoalsContent;
        } else if (hasLocalGoals && localGoals) {
          resolvedGoals = localGoals;
        }
      } else if (hasLocalGoals && localGoals) {
        // No server goals — local is the only version; push it.
        resolvedGoals = localGoals;
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

      // ── Reminders (restore-if-empty) ─────────────────────────────────────
      // Reminders are device-local by nature. Per-record merge is not required;
      // we simply restore from the server when the local list is empty (new
      // device / reinstall).
      if (reminders.length === 0 && serverData.reminders.length > 0) {
        await hydrateReminders(serverData.reminders as Parameters<typeof hydrateReminders>[0]);
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

      if (reminders.length > 0) pushOps.push(uploadReminders(reminders));

      const pushResults = await Promise.allSettled(pushOps);

      // Record the timestamp only when every attempted upload actually succeeded.
      // Each upload helper returns Promise<boolean> and resolves false on network
      // or HTTP failure rather than rejecting, so allSettled alone is not
      // sufficient — we must also check that every fulfilled value is true.
      const allPushesSucceeded =
        pushOps.length === 0 ||
        pushResults.every((r) => r.status === "fulfilled" && r.value === true);

      if (allPushesSucceeded) {
        await recordSyncSuccess();
        // A successful full sync pushed the current state of every store, so
        // any queued retry payloads are now redundant — clear them.
        await clearRetryQueue();
      }
    } catch {
      // Sync failures are silent — app continues to work offline
    } finally {
      isSyncing.current = false;
    }
  }, [
    isSignedIn,
    symptoms,
    journal,
    reminders,
    user,
    livingProfile,
    livingProfileUpdatedAt,
    hydrateSymptoms,
    hydrateJournal,
    hydrateReminders,
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

  return null;
}
