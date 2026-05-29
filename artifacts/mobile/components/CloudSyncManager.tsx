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
 * Living-profile LWW:
 *   - The context now persists `livingProfileUpdatedAt` (ISO timestamp) beside
 *     the profile string in AsyncStorage.
 *   - On hydration, we compare local vs. server timestamps and apply the
 *     newer value — not just "hydrate if empty".
 *   - On upload, we send the stored `livingProfileUpdatedAt` (NOT new Date())
 *     so a stale local copy cannot win over a fresher server version.
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
import {
  fetchServerData,
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

      // Step 2: hydrate contexts from server when local state is empty
      //         (restores data on a new device or after a reinstall)
      if (symptoms.length === 0 && serverData.symptoms.length > 0) {
        await hydrateSymptoms(serverData.symptoms as Parameters<typeof hydrateSymptoms>[0]);
      }

      if (journal.length === 0 && serverData.journal.length > 0) {
        await hydrateJournal(serverData.journal as Parameters<typeof hydrateJournal>[0]);
      }

      // Goals of care — hydrate only if local has no content at all
      const localGoals = user?.patientProfile?.goalsOfCare;
      const hasLocalGoals = !!(
        localGoals?.whatMattersMost?.trim() ||
        localGoals?.goodDayLooksLike?.trim() ||
        localGoals?.thingsToAvoid?.trim() ||
        localGoals?.dnrStatus ||
        localGoals?.additionalDirectives?.trim()
      );
      if (!hasLocalGoals && serverData.goals?.content) {
        const restoredGoals = serverData.goals.content as GoalsOfCare;
        const currentProfile = user?.patientProfile ?? {};
        updatePatientProfile({ ...currentProfile, goalsOfCare: restoredGoals });
      }

      // Living profile — true LWW: apply whichever version has the newer timestamp.
      // This handles the "stale local profile" case: if a newer version exists on
      // the server (e.g. edited on another device), we take the server's version.
      if (serverData.livingProfile?.profile) {
        const serverTs = typeof (serverData.livingProfile as Record<string, unknown>)["updatedAt"] === "string"
          ? (serverData.livingProfile as Record<string, unknown>)["updatedAt"] as string
          : null;
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

      if (reminders.length === 0 && serverData.reminders.length > 0) {
        await hydrateReminders(serverData.reminders as Parameters<typeof hydrateReminders>[0]);
      }

      // Step 3: push current local state to server with stored LWW timestamps
      const pushOps: Promise<unknown>[] = [];

      if (symptoms.length > 0) pushOps.push(uploadSymptoms(symptoms));
      if (journal.length > 0) pushOps.push(uploadJournal(journal));

      const goalsOfCare = user?.patientProfile?.goalsOfCare;
      const hasAnyGoals = !!(
        goalsOfCare?.whatMattersMost?.trim() ||
        goalsOfCare?.goodDayLooksLike?.trim() ||
        goalsOfCare?.thingsToAvoid?.trim() ||
        goalsOfCare?.dnrStatus ||
        goalsOfCare?.additionalDirectives?.trim()
      );
      if (goalsOfCare && hasAnyGoals) {
        pushOps.push(uploadGoals(goalsOfCare));
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

  // Sync on network reconnect (offline → online transition)
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
      runSync();
    }
  }, [isSignedIn, isOnline, runSync]);

  return null;
}
