import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { JourneyStage, User, UserRole } from "@/types";

interface AppContextValue {
  user: User | null;
  isOnboarded: boolean;
  isLoading: boolean;
  updateJourneyStage: (stage: JourneyStage) => void;
  updateRole: (role: UserRole) => void;
  completeOnboarding: (role: UserRole, stage: JourneyStage) => void;
  toggleSavedResource: (resourceId: string) => void;
  toggleSavedProvider: (providerId: string) => void;
  isSavedResource: (resourceId: string) => boolean;
  isSavedProvider: (providerId: string) => boolean;
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
        toggleSavedResource,
        toggleSavedProvider,
        isSavedResource,
        isSavedProvider,
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
