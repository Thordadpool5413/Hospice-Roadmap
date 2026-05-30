import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { CaregiverMood, CaregiverWellnessEntry } from "@/types";
import { uploadCaregiverWellness } from "@/services/syncService";
import {
  cancelWellnessReminder,
  scheduleForwardReminder,
  syncWellnessReminder,
} from "@/services/wellnessReminderNotifier";

export const WELLNESS_STORAGE_KEY = "@caregiver_wellness_v1";
const MAX_ENTRIES = 90;

export const MOOD_LABELS: Record<CaregiverMood, string> = {
  doing_okay: "Doing okay",
  holding_up: "Holding up",
  tired: "Tired",
  sad: "Sad",
  overwhelmed: "Overwhelmed",
};

export const MOOD_SCORES: Record<CaregiverMood, number> = {
  doing_okay: 5,
  holding_up: 4,
  tired: 3,
  sad: 2,
  overwhelmed: 1,
};

interface CaregiverWellnessContextValue {
  entries: CaregiverWellnessEntry[];
  isLoading: boolean;
  addEntry: (mood: CaregiverMood, note?: string) => Promise<void>;
  getTodayEntry: () => CaregiverWellnessEntry | null;
  getRecentEntries: (days: number) => CaregiverWellnessEntry[];
  getWellnessSummary: (days?: number) => string;
  clearEntries: () => Promise<void>;
  hydrateFromServer: (serverEntries: CaregiverWellnessEntry[]) => Promise<void>;
}

const CaregiverWellnessContext = createContext<CaregiverWellnessContextValue | null>(null);

export function CaregiverWellnessProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<CaregiverWellnessEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(WELLNESS_STORAGE_KEY);
      const parsed: CaregiverWellnessEntry[] = stored ? JSON.parse(stored) : [];
      if (parsed.length > 0) setEntries(parsed);
      syncWellnessReminder(parsed).catch(() => {});
    } catch (e) {
      console.error("Error loading caregiver wellness entries:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEntries = async (
    updated: CaregiverWellnessEntry[],
  ): Promise<CaregiverWellnessEntry[]> => {
    try {
      const trimmed = updated
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_ENTRIES);
      await AsyncStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify(trimmed));
      setEntries(trimmed);
      return trimmed;
    } catch (e) {
      console.error("Error saving caregiver wellness entries:", e);
      return updated;
    }
  };

  const addEntry = useCallback(
    async (mood: CaregiverMood, note?: string) => {
      const now = new Date();
      const newEntry: CaregiverWellnessEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
        date: now.toISOString().slice(0, 10),
        timestamp: now.getTime(),
        mood,
        note: note?.trim() || undefined,
        updatedAt: now.toISOString(),
      };
      const saved = await saveEntries([...entries, newEntry]);
      uploadCaregiverWellness(saved).catch(() => {});
      // Forward-schedule the next reminder at 7 PM on (today + 3 days) so it
      // fires even if the app is never reopened before the threshold is hit.
      // scheduleForwardReminder cancels any existing notification internally.
      scheduleForwardReminder(newEntry.date).catch(() => {});
    },
    [entries],
  );

  const getTodayEntry = useCallback((): CaregiverWellnessEntry | null => {
    const today = new Date().toISOString().slice(0, 10);
    return entries.find((e) => e.date === today) ?? null;
  }, [entries]);

  const getRecentEntries = useCallback(
    (days: number): CaregiverWellnessEntry[] => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days + 1);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      return entries.filter((e) => e.date >= cutoffStr);
    },
    [entries],
  );

  const getWellnessSummary = useCallback(
    (days: number = 7): string => {
      const recent = getRecentEntries(days);
      if (recent.length === 0) return "";

      const latest = recent[0];
      const moodCounts: Partial<Record<CaregiverMood, number>> = {};
      for (const e of recent) {
        moodCounts[e.mood] = (moodCounts[e.mood] ?? 0) + 1;
      }
      const topMood = (
        Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as CaregiverMood
      ) ?? latest.mood;

      const avgScore =
        recent.reduce((sum, e) => sum + MOOD_SCORES[e.mood], 0) / recent.length;

      let alert = "";
      if (avgScore <= 2) {
        alert =
          "CAREGIVER ALERT: This caregiver has been reporting consistently difficult emotional states (sad or overwhelmed). Prioritize emotional support and acknowledgment before clinical topics.";
      } else if (avgScore <= 3) {
        alert =
          "The caregiver has been reporting significant fatigue and strain this week. Check in on their wellbeing.";
      }

      const lines = [
        `--- Caregiver Wellness Check-ins (last ${recent.length} of ${days} days) ---`,
        `Most recent mood: ${MOOD_LABELS[latest.mood]}${latest.note ? ` — "${latest.note}"` : ""}`,
        `Most frequent mood this week: ${MOOD_LABELS[topMood]}`,
        alert,
      ].filter(Boolean);

      return lines.join("\n");
    },
    [getRecentEntries],
  );

  const clearEntries = useCallback(async () => {
    try {
      await AsyncStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify([]));
      setEntries([]);
      uploadCaregiverWellness([]).catch(() => {});
      cancelWellnessReminder().catch(() => {});
    } catch (e) {
      console.error("Error clearing caregiver wellness entries:", e);
    }
  }, []);

  const hydrateFromServer = useCallback(
    async (serverEntries: CaregiverWellnessEntry[]) => {
      try {
        const trimmed = serverEntries
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, MAX_ENTRIES);
        await AsyncStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify(trimmed));
        setEntries(trimmed);
        syncWellnessReminder(trimmed).catch(() => {});
      } catch (e) {
        console.error("Error hydrating caregiver wellness from server:", e);
      }
    },
    [],
  );

  return (
    <CaregiverWellnessContext.Provider
      value={{
        entries,
        isLoading,
        addEntry,
        getTodayEntry,
        getRecentEntries,
        getWellnessSummary,
        clearEntries,
        hydrateFromServer,
      }}
    >
      {children}
    </CaregiverWellnessContext.Provider>
  );
}

export function useCaregiverWellness() {
  const ctx = useContext(CaregiverWellnessContext);
  if (!ctx)
    throw new Error("useCaregiverWellness must be inside CaregiverWellnessProvider");
  return ctx;
}
