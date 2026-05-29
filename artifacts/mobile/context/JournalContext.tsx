import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { JournalEntry, JournalEntryType } from "@/types";
import { enqueueRetry } from "@/services/retryQueue";
import { enqueuePendingDelete } from "@/services/pendingDeletes";
import { uploadJournal } from "@/services/syncService";

const STORAGE_KEY = "@hospice_roadmap_journal";

interface JournalContextValue {
  entries: JournalEntry[];
  isLoading: boolean;
  addEntry: (entry: Omit<JournalEntry, "id" | "timestamp">) => Promise<JournalEntry>;
  updateEntry: (id: string, updates: Partial<Omit<JournalEntry, "id" | "timestamp">>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  clearEntries: () => Promise<void>;
  hydrateFromServer: (serverEntries: JournalEntry[]) => Promise<void>;
}

const JournalContext = createContext<JournalContextValue | null>(null);

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setEntries(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const save = useCallback(async (list: JournalEntry[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  const addEntry = useCallback(
    async (entry: Omit<JournalEntry, "id" | "timestamp">): Promise<JournalEntry> => {
      const newEntry: JournalEntry = {
        ...entry,
        id: `journal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newEntry, ...entries];
      setEntries(updated);
      await save(updated);
      uploadJournal(updated)
        .then((ok) => { if (!ok) return enqueueRetry("journal", updated); })
        .catch(() => enqueueRetry("journal", updated));
      return newEntry;
    },
    [entries, save]
  );

  const updateEntry = useCallback(
    async (id: string, updates: Partial<Omit<JournalEntry, "id" | "timestamp">>) => {
      const now = new Date().toISOString();
      const updated = entries.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: now } : e));
      setEntries(updated);
      await save(updated);
      uploadJournal(updated)
        .then((ok) => { if (!ok) return enqueueRetry("journal", updated); })
        .catch(() => enqueueRetry("journal", updated));
    },
    [entries, save]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const updated = entries.filter((e) => e.id !== id);
      setEntries(updated);
      await save(updated);
      uploadJournal(updated)
        .then((ok) => {
          if (!ok) {
            enqueueRetry("journal", updated);
            enqueuePendingDelete("journal", id);
          }
        })
        .catch(() => {
          enqueueRetry("journal", updated);
          enqueuePendingDelete("journal", id);
        });
    },
    [entries, save]
  );

  const clearEntries = useCallback(async () => {
    setEntries([]);
    await save([]);
    uploadJournal([]);
  }, [save]);

  const hydrateFromServer = useCallback(async (serverEntries: JournalEntry[]) => {
    const sorted = [...serverEntries].sort((a, b) => b.timestamp - a.timestamp);
    setEntries(sorted);
    await save(sorted);
  }, [save]);

  return (
    <JournalContext.Provider value={{ entries, isLoading, addEntry, updateEntry, deleteEntry, clearEntries, hydrateFromServer }}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal(): JournalContextValue {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error("useJournal must be used within JournalProvider");
  return ctx;
}

export const JOURNAL_TYPE_META: Record<
  JournalEntryType,
  { label: string; icon: string; color: string; bg: string }
> = {
  symptom: { label: "Symptom", icon: "activity", color: "#C45A5A", bg: "#FDF0F0" },
  medication: { label: "Medication", icon: "package", color: "#5A7FA8", bg: "#EBF2FA" },
  observation: { label: "Observation", icon: "eye", color: "#C85A1C", bg: "#FEF1E8" },
  mood: { label: "Mood", icon: "heart", color: "#8A6A9A", bg: "#F0EBF6" },
  general: { label: "General", icon: "edit-3", color: "#7A8A6A", bg: "#F0F4EB" },
};
