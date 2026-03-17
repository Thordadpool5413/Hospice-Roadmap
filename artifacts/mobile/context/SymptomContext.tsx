import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { SymptomEntry } from "@/types";

const STORAGE_KEY = "@hospice_roadmap_symptoms";
const MAX_ENTRIES = 90;

interface SymptomContextValue {
  entries: SymptomEntry[];
  isLoading: boolean;
  addEntry: (entry: Omit<SymptomEntry, "id">) => Promise<void>;
  updateEntry: (id: string, updates: Partial<Omit<SymptomEntry, "id">>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getTodayEntry: () => SymptomEntry | null;
  getRecentSummary: (days?: number) => string;
}

const SymptomContext = createContext<SymptomContextValue | null>(null);

export function SymptomProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading symptom entries:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEntries = async (updated: SymptomEntry[]) => {
    try {
      const trimmed = updated
        .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
        .slice(0, MAX_ENTRIES);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      setEntries(trimmed);
    } catch (e) {
      console.error("Error saving symptom entries:", e);
    }
  };

  const addEntry = useCallback(async (entry: Omit<SymptomEntry, "id">) => {
    const newEntry: SymptomEntry = {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
    };
    await saveEntries([...entries, newEntry]);
  }, [entries]);

  const updateEntry = useCallback(async (id: string, updates: Partial<Omit<SymptomEntry, "id">>) => {
    const updated = entries.map((e) => e.id === id ? { ...e, ...updates } : e);
    await saveEntries(updated);
  }, [entries]);

  const deleteEntry = useCallback(async (id: string) => {
    await saveEntries(entries.filter((e) => e.id !== id));
  }, [entries]);

  const getTodayEntry = useCallback((): SymptomEntry | null => {
    const today = new Date().toISOString().slice(0, 10);
    return entries.find((e) => e.date === today) ?? null;
  }, [entries]);

  const getRecentSummary = useCallback((days: number = 7): string => {
    if (entries.length === 0) return "";
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const recent = entries.filter((e) => new Date(e.date) >= cutoff);
    if (recent.length === 0) return "";

    const AGITATION_LABELS = ["none", "mild", "moderate", "severe"];
    const APPETITE_LABELS = ["none", "poor", "fair", "good"];

    const avg = (arr: number[]) =>
      arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : "—";

    const avgPain = avg(recent.map((e) => e.pain));
    const avgBreath = avg(recent.map((e) => e.breathlessness));
    const avgNausea = avg(recent.map((e) => e.nausea));
    const agitationCounts = recent.map((e) => e.agitation as number);
    const avgAgitation = agitationCounts.length
      ? AGITATION_LABELS[Math.round(agitationCounts.reduce((s, v) => s + v, 0) / agitationCounts.length)]
      : "—";
    const appetiteCounts = recent.map((e) => e.appetite as number);
    const avgAppetite = appetiteCounts.length
      ? APPETITE_LABELS[Math.round(appetiteCounts.reduce((s, v) => s + v, 0) / appetiteCounts.length)]
      : "—";

    const high = recent.filter((e) => e.pain >= 7 || e.breathlessness >= 7);
    const highNote = high.length > 0
      ? ` High scores (7+) recorded on ${high.length} of ${recent.length} days.`
      : "";

    const latest = recent[0];
    const latestDate = latest ? latest.date : "";

    return [
      `Recent symptom trends (last ${recent.length} check-ins over ${days} days):`,
      `Pain: avg ${avgPain}/10 | Breathlessness: avg ${avgBreath}/10 | Nausea: avg ${avgNausea}/10`,
      `Agitation: avg ${avgAgitation} | Appetite: avg ${avgAppetite}`,
      highNote,
      latestDate ? `Most recent check-in: ${latestDate}` : "",
    ].filter(Boolean).join("\n");
  }, [entries]);

  return (
    <SymptomContext.Provider
      value={{ entries, isLoading, addEntry, updateEntry, deleteEntry, getTodayEntry, getRecentSummary }}
    >
      {children}
    </SymptomContext.Provider>
  );
}

export function useSymptoms() {
  const ctx = useContext(SymptomContext);
  if (!ctx) throw new Error("useSymptoms must be used inside SymptomProvider");
  return ctx;
}
