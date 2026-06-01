import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { uploadProfile } from "@/services/syncService";

import { GOC_FIELDS } from "@workspace/goc-merge";

import {
  GoalsOfCare,
  GoalsOfCareField,
  JourneyStage,
  PatientProfile,
  RagnaPrivacySettings,
  User,
  UserRole,
} from "@/types";

/**
 * Compute per-field timestamps for a GoalsOfCare object saved from the UI.
 *
 * Called only when the incoming goals have NO `fieldUpdatedAt` map (i.e. the
 * save originated from the UI, not from a sync merge which already carries a
 * carefully constructed map). For each field:
 *   - If the value CHANGED vs the previous version → stamp `now`.
 *   - If the value is UNCHANGED → preserve the existing per-field timestamp
 *     (or fall back to the existing document-level updatedAt so the field
 *     participates correctly in future merges without appearing "just edited").
 *   - If the field was CLEARED (new value is undefined) → drop its entry so
 *     the merge knows it was intentionally removed.
 *
 * Returns the completed `fieldUpdatedAt` map.
 */
function computeFieldUpdatedAt(
  incoming: GoalsOfCare,
  existing: GoalsOfCare | undefined,
  now: string,
): Partial<Record<GoalsOfCareField, string>> {
  const result: Partial<Record<GoalsOfCareField, string>> = {};

  for (const field of GOC_FIELDS) {
    const newVal = (incoming as Record<string, unknown>)[field];
    const oldVal = (existing as Record<string, unknown> | undefined)?.[field];

    if (newVal === undefined || newVal === null || newVal === "") {
      // Field was cleared — omit from map so the merge treats it as gone.
      continue;
    }

    if (newVal !== oldVal) {
      // Value changed (or field is new) — use now.
      result[field] = now;
    } else {
      // Value unchanged — preserve the prior per-field timestamp so we don't
      // claim ownership of a field the user didn't actually touch.
      const prior =
        existing?.fieldUpdatedAt?.[field] ??
        existing?.updatedAt;
      if (prior) {
        result[field] = prior;
      } else {
        // No prior timestamp at all — use now as a safe initialization so the
        // field participates in future field-level merges rather than being
        // treated as unversioned.
        result[field] = now;
      }
    }
  }

  return result;
}

export const DEFAULT_RAGNA_PRIVACY: RagnaPrivacySettings = {
  personalizationEnabled: true,
  includeProfileDetails: true,
  includeMedicationAndEquipment: true,
  includeCareContacts: false,
  includeGoalsOfCare: true,
  includeRecentSymptoms: true,
  includeRecentJournal: true,
  includeConversationMemory: true,
  includeTimeContext: true,
  includeCaregiverWellness: true,
};

function normalizeUser(user: User): User {
  return {
    ...user,
    ragnaPrivacy: {
      ...DEFAULT_RAGNA_PRIVACY,
      ...(user.ragnaPrivacy ?? {}),
    },
  };
}

interface AppContextValue {
  user: User | null;
  isOnboarded: boolean;
  isLoading: boolean;
  ragnaPrivacy: RagnaPrivacySettings;
  updateJourneyStage: (stage: JourneyStage) => void;
  updateRole: (role: UserRole) => void;
  completeOnboarding: (role: UserRole, stage: JourneyStage) => void;
  updatePatientProfile: (profile: PatientProfile) => void;
  clearPatientProfile: () => Promise<void>;
  clearGoalsOfCare: () => Promise<void>;
  clearSavedResources: () => Promise<void>;
  clearSavedProviders: () => Promise<void>;
  toggleSavedResource: (resourceId: string) => void;
  toggleSavedProvider: (providerId: string) => void;
  isSavedResource: (resourceId: string) => boolean;
  isSavedProvider: (providerId: string) => boolean;
  buildPatientContext: () => string;
  updateRagnaPrivacy: (updates: Partial<RagnaPrivacySettings>) => void;
  resetRagnaPrivacy: () => void;
  /**
   * Restore user profile data received from the server during cloud sync.
   *
   * Writes the merged profile to AsyncStorage + state WITHOUT triggering an
   * upload back to the server (which would be redundant — we just received it).
   * Crucially, it preserves the local `patientProfile.goalsOfCare` value, which
   * is managed by a separate sync path and must not be overwritten here.
   */
  hydrateProfileFromServer: (data: Record<string, unknown>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "@hospice_roadmap_user";

function createDefaultUser(role: UserRole, stage: JourneyStage): User {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    role,
    journeyStage: stage,
    onboardingComplete: true,
    savedResources: [],
    savedProviders: [],
    createdAt: new Date().toISOString(),
    ragnaPrivacy: { ...DEFAULT_RAGNA_PRIVACY },
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        setUser(normalizeUser(parsed));
      }
    } catch (e) {
      console.error("Error loading user:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (updatedUser: User) => {
    try {
      // Stamp a fresh updatedAt on every save so the LWW sync key is current.
      const stamped: User = { ...updatedUser, updatedAt: new Date().toISOString() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
      setUser(stamped);
      // Fire-and-forget: push to server. Non-fatal if offline.
      uploadProfile(stamped).catch(() => {});
    } catch (e) {
      console.error("Error saving user:", e);
    }
  };

  /**
   * Restore user profile data from the server WITHOUT triggering an upload
   * back (avoids a redundant round-trip and prevents stomping a newer server
   * value with stale local data). Preserves the local GoC value because that
   * field is managed by the separate /sync/goals endpoint.
   */
  const hydrateProfileFromServer = useCallback(
    async (data: Record<string, unknown>): Promise<void> => {
      try {
        const serverUser = data as Partial<User>;

        // Read the most-recent persisted state (not the React closure value,
        // which may be stale if called before a state update settles).
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const currentUser: User | null = stored
          ? normalizeUser(JSON.parse(stored) as User)
          : null;

        // Preserve the local GoC — it's authoritative here; the GoC sync path
        // owns that field and will merge it separately.
        const existingGoC = currentUser?.patientProfile?.goalsOfCare;

        const merged: User = normalizeUser({
          // Sensible fallback fields (device-local, never overwritten from server)
          id: currentUser?.id ?? Date.now().toString(),
          createdAt: currentUser?.createdAt ?? new Date().toISOString(),
          // Apply all server fields
          ...serverUser,
          // Always keep the local GoC
          patientProfile: serverUser.patientProfile
            ? { ...(serverUser.patientProfile as PatientProfile), goalsOfCare: existingGoC }
            : currentUser?.patientProfile,
        } as User);

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        setUser(merged);
      } catch (e) {
        console.error("Error hydrating profile from server:", e);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const completeOnboarding = useCallback(
    (role: UserRole, stage: JourneyStage) => {
      const newUser = createDefaultUser(role, stage);
      saveUser(newUser);
    },
    []
  );

  const updateJourneyStage = useCallback(
    (stage: JourneyStage) => {
      if (!user) return;
      saveUser({ ...user, journeyStage: stage });
    },
    [user]
  );

  const updateRole = useCallback(
    (role: UserRole) => {
      if (!user) return;
      saveUser({ ...user, role });
    },
    [user]
  );

  const updatePatientProfile = useCallback(
    (profile: PatientProfile) => {
      if (!user) return;

      // ── Per-field GoC timestamp stamping ──────────────────────────────────
      // When incoming goals have NO `fieldUpdatedAt` map the save originated
      // from the UI (the form always constructs a plain GoalsOfCare without
      // field-level timestamps). Compute per-field timestamps by comparing
      // each field's new value against the current local value:
      //   - Changed field  → stamp now.
      //   - Unchanged field → carry the existing per-field timestamp (or the
      //     document-level updatedAt) so we don't falsely claim ownership.
      //   - Cleared field  → omit from map.
      //
      // When incoming goals ALREADY have `fieldUpdatedAt` (written by the sync
      // merge step) we leave them untouched — the merge has already done the
      // correct field-level resolution.
      let finalProfile = profile;
      if (profile.goalsOfCare && !profile.goalsOfCare.fieldUpdatedAt) {
        const now = profile.goalsOfCare.updatedAt ?? new Date().toISOString();
        const existing = user.patientProfile?.goalsOfCare;
        const fieldUpdatedAt = computeFieldUpdatedAt(profile.goalsOfCare, existing, now);
        const updatedGoals: GoalsOfCare = {
          ...profile.goalsOfCare,
          ...(Object.keys(fieldUpdatedAt).length > 0 ? { fieldUpdatedAt } : {}),
        };
        finalProfile = { ...profile, goalsOfCare: updatedGoals };
      }

      saveUser({ ...user, patientProfile: finalProfile });
    },
    [user]
  );

  const updateRagnaPrivacy = useCallback(
    (updates: Partial<RagnaPrivacySettings>) => {
      if (!user) return;
      const current = user.ragnaPrivacy ?? { ...DEFAULT_RAGNA_PRIVACY };
      saveUser({ ...user, ragnaPrivacy: { ...current, ...updates } });
    },
    [user]
  );

  const resetRagnaPrivacy = useCallback(() => {
    if (!user) return;
    saveUser({ ...user, ragnaPrivacy: { ...DEFAULT_RAGNA_PRIVACY } });
  }, [user]);

  // Clears editable patient profile fields while preserving identity, journey,
  // saved lists, and goalsOfCare (which has its own separate clear below).
  const clearPatientProfile = useCallback(async (): Promise<void> => {
    if (!user) return;
    const preserved = user.patientProfile?.goalsOfCare;
    const cleared: PatientProfile = preserved ? { goalsOfCare: preserved } : {};
    await saveUser({ ...user, patientProfile: cleared });
  }, [user]);

  // Removes only goalsOfCare from the patient profile; all other fields stay.
  const clearGoalsOfCare = useCallback(async (): Promise<void> => {
    if (!user) return;
    const { goalsOfCare: _removed, ...rest } = user.patientProfile ?? {};
    await saveUser({ ...user, patientProfile: rest });
  }, [user]);

  const clearSavedResources = useCallback(async (): Promise<void> => {
    if (!user) return;
    await saveUser({ ...user, savedResources: [] });
  }, [user]);

  const clearSavedProviders = useCallback(async (): Promise<void> => {
    if (!user) return;
    await saveUser({ ...user, savedProviders: [] });
  }, [user]);

  const buildPatientContext = useCallback((): string => {
    if (!user) return "";
    const privacy = user.ragnaPrivacy ?? DEFAULT_RAGNA_PRIVACY;
    if (!privacy.personalizationEnabled) return "";

    const p = user.patientProfile;
    const lines: string[] = [];

    const roleDescription =
      user.role === "patient"
        ? "The person using this app IS THE PATIENT themselves"
        : user.role === "caregiver"
        ? "The person using this app is a CAREGIVER for the patient"
        : "The person using this app is a family member or other person";
    lines.push(`Who is using this app: ${roleDescription}`);
    lines.push(`Journey stage: ${user.journeyStage}`);

    if (privacy.includeProfileDetails) {
      if (p?.patientName) lines.push(`Patient name: ${p.patientName}`);
      if (p?.diagnosis) lines.push(`Primary diagnosis: ${p.diagnosis}`);
      if (p?.additionalNotes) lines.push(`Additional notes: ${p.additionalNotes}`);
    }

    if (privacy.includeMedicationAndEquipment) {
      if (p?.medications && p.medications.length > 0) {
        lines.push("Comfort kit medications in home:");
        for (const med of p.medications) {
          const parts = [`  - ${med.name}`];
          if (med.rxcui) parts.push(`(RxCUI: ${med.rxcui})`);
          if (med.tty) parts.push(`[${med.tty}]`);
          if (med.doseNote) parts.push(`— ${med.doseNote}`);
          lines.push(parts.join(" "));
        }
      } else if (p?.comfortKitMedications) {
        lines.push(`Comfort kit medications in home: ${p.comfortKitMedications}`);
      }
      if (p?.equipmentInHome) lines.push(`Medical equipment in home: ${p.equipmentInHome}`);
    }

    if (privacy.includeCareContacts) {
      if (p?.hospicePhone) lines.push(`Hospice main phone: ${p.hospicePhone}`);
      if (p?.hospiceAfterHoursPhone) lines.push(`Hospice after-hours phone: ${p.hospiceAfterHoursPhone}`);
      if (p?.equipmentProviderPhone) lines.push(`Equipment provider phone: ${p.equipmentProviderPhone}`);
      if (p?.pharmacyPhone) lines.push(`Pharmacy phone: ${p.pharmacyPhone}`);
    }

    if (privacy.includeGoalsOfCare) {
      const g = p?.goalsOfCare;
      if (g) {
        lines.push("--- Goals of Care ---");
        if (g.whatMattersMost) lines.push(`What matters most: ${g.whatMattersMost}`);
        if (g.goodDayLooksLike) lines.push(`What a good day looks like: ${g.goodDayLooksLike}`);
        if (g.thingsToAvoid) lines.push(`Things to avoid: ${g.thingsToAvoid}`);
        if (g.dnrStatus && g.dnrStatus !== "not-discussed") {
          const dnrLabels: Record<string, string> = {
            dnr: "DNR / Allow Natural Death",
            "full-code": "Full Code (CPR)",
            unknown: "Not yet discussed",
          };
          lines.push(`Resuscitation preference: ${dnrLabels[g.dnrStatus] ?? g.dnrStatus}`);
        }
        if (g.additionalDirectives) lines.push(`Additional directives: ${g.additionalDirectives}`);
        if (g.fearsAndConcerns) lines.push(`What the patient fears most: ${g.fearsAndConcerns}`);
        if (g.finalDaysWishes) lines.push(`Wishes for the final days: ${g.finalDaysWishes}`);
        if (g.afterDeathWishes) lines.push(`After-death wishes: ${g.afterDeathWishes}`);
      }
    }

    return lines.join("\n");
  }, [user]);

  const toggleSavedResource = useCallback(
    (resourceId: string) => {
      if (!user) return;
      const saved = user.savedResources.includes(resourceId)
        ? user.savedResources.filter((id) => id !== resourceId)
        : [...user.savedResources, resourceId];
      saveUser({ ...user, savedResources: saved });
    },
    [user]
  );

  const toggleSavedProvider = useCallback(
    (providerId: string) => {
      if (!user) return;
      const saved = user.savedProviders.includes(providerId)
        ? user.savedProviders.filter((id) => id !== providerId)
        : [...user.savedProviders, providerId];
      saveUser({ ...user, savedProviders: saved });
    },
    [user]
  );

  const isSavedResource = useCallback(
    (resourceId: string) => user?.savedResources.includes(resourceId) ?? false,
    [user]
  );

  const isSavedProvider = useCallback(
    (providerId: string) => user?.savedProviders.includes(providerId) ?? false,
    [user]
  );

  const ragnaPrivacy: RagnaPrivacySettings = user?.ragnaPrivacy ?? { ...DEFAULT_RAGNA_PRIVACY };

  return (
    <AppContext.Provider
      value={{
        user,
        isOnboarded: !!user?.onboardingComplete,
        isLoading,
        ragnaPrivacy,
        updateJourneyStage,
        updateRole,
        completeOnboarding,
        updatePatientProfile,
        clearPatientProfile,
        clearGoalsOfCare,
        clearSavedResources,
        clearSavedProviders,
        toggleSavedResource,
        toggleSavedProvider,
        isSavedResource,
        isSavedProvider,
        buildPatientContext,
        updateRagnaPrivacy,
        resetRagnaPrivacy,
        hydrateProfileFromServer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
