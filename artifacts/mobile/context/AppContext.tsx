import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { JourneyStage, PatientProfile, User, UserRole } from "@/types";

interface AppContextValue {
  user: User | null;
  isOnboarded: boolean;
  isLoading: boolean;
  updateJourneyStage: (stage: JourneyStage) => void;
  updateRole: (role: UserRole) => void;
  completeOnboarding: (role: UserRole, stage: JourneyStage) => void;
  updatePatientProfile: (profile: PatientProfile) => void;
  toggleSavedResource: (resourceId: string) => void;
  toggleSavedProvider: (providerId: string) => void;
  isSavedResource: (resourceId: string) => boolean;
  isSavedProvider: (providerId: string) => boolean;
  buildPatientContext: () => string;
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
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading user:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (updatedUser: User) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (e) {
      console.error("Error saving user:", e);
    }
  };

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
      saveUser({ ...user, patientProfile: profile });
    },
    [user]
  );

  const buildPatientContext = useCallback((): string => {
    if (!user) return "";
    const p = user.patientProfile;
    const lines: string[] = [];
    const roleDescription = user.role === "patient"
      ? "The person using this app IS THE PATIENT themselves"
      : user.role === "caregiver"
      ? "The person using this app is a CAREGIVER for the patient"
      : "The person using this app is a family member or other person";
    lines.push(`Who is using this app: ${roleDescription}`);
    lines.push(`Journey stage: ${user.journeyStage}`);
    if (p?.patientName) lines.push(`Patient name: ${p.patientName}`);
    if (p?.diagnosis) lines.push(`Primary diagnosis: ${p.diagnosis}`);
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
    if (p?.hospicePhone) lines.push(`Hospice main phone: ${p.hospicePhone}`);
    if (p?.hospiceAfterHoursPhone) lines.push(`Hospice after-hours phone: ${p.hospiceAfterHoursPhone}`);
    if (p?.equipmentProviderPhone) lines.push(`Equipment provider phone: ${p.equipmentProviderPhone}`);
    if (p?.pharmacyPhone) lines.push(`Pharmacy phone: ${p.pharmacyPhone}`);
    if (p?.additionalNotes) lines.push(`Additional notes: ${p.additionalNotes}`);
    const g = p?.goalsOfCare;
    if (g) {
      lines.push("--- Goals of Care ---");
      if (g.whatMattersMost) lines.push(`What matters most: ${g.whatMattersMost}`);
      if (g.goodDayLooksLike) lines.push(`What a good day looks like: ${g.goodDayLooksLike}`);
      if (g.thingsToAvoid) lines.push(`Things to avoid: ${g.thingsToAvoid}`);
      if (g.dnrStatus && g.dnrStatus !== "not-discussed") {
        const dnrLabels: Record<string, string> = {
          "dnr": "DNR / Allow Natural Death",
          "full-code": "Full Code (CPR)",
          "unknown": "Not yet discussed",
        };
        lines.push(`Resuscitation preference: ${dnrLabels[g.dnrStatus] ?? g.dnrStatus}`);
      }
      if (g.additionalDirectives) lines.push(`Additional directives: ${g.additionalDirectives}`);
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

  return (
    <AppContext.Provider
      value={{
        user,
        isOnboarded: !!user?.onboardingComplete,
        isLoading,
        updateJourneyStage,
        updateRole,
        completeOnboarding,
        updatePatientProfile,
        toggleSavedResource,
        toggleSavedProvider,
        isSavedResource,
        isSavedProvider,
        buildPatientContext,
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
