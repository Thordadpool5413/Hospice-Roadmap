import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { SymptomEntry } from "@/types";
import { enqueueRetry } from "@/services/retryQueue";
import { uploadSymptoms } from "@/services/syncService";

const STORAGE_KEY = "@hospice_roadmap_symptoms";
const MAX_ENTRIES = 90;

interface SymptomContextValue {
  entries: SymptomEntry[];
  isLoading: boolean;
  addEntry: (entry: Omit<SymptomEntry, "id">) => Promise<void>;
  updateEntry: (id: string, updates: Partial<Omit<SymptomEntry, "id">>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getTodayEntry: () => SymptomEntry | null;
  getRecentEntries: (days: number) => SymptomEntry[];
  getRecentSummary: (days?: number) => string;
  clearEntries: () => Promise<void>;
  hydrateFromServer: (serverEntries: SymptomEntry[]) => Promise<void>;
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

  const saveEntries = async (updated: SymptomEntry[]): Promise<SymptomEntry[]> => {
    try {
      const trimmed = updated
        .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
        .slice(0, MAX_ENTRIES);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      setEntries(trimmed);
      return trimmed;
    } catch (e) {
      console.error("Error saving symptom entries:", e);
      return updated;
    }
  };

  const addEntry = useCallback(async (entry: Omit<SymptomEntry, "id">) => {
    const newEntry: SymptomEntry = {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      updatedAt: new Date().toISOString(),
    };
    const saved = await saveEntries([...entries, newEntry]);
    uploadSymptoms(saved)
      .then((ok) => { if (!ok) return enqueueRetry("symptoms", saved); })
      .catch(() => enqueueRetry("symptoms", saved));
  }, [entries]);

  const updateEntry = useCallback(async (id: string, updates: Partial<Omit<SymptomEntry, "id">>) => {
    const now = new Date().toISOString();
    const updated = entries.map((e) => e.id === id ? { ...e, ...updates, updatedAt: now } : e);
    const saved = await saveEntries(updated);
    uploadSymptoms(saved)
      .then((ok) => { if (!ok) return enqueueRetry("symptoms", saved); })
      .catch(() => enqueueRetry("symptoms", saved));
  }, [entries]);

  const deleteEntry = useCallback(async (id: string) => {
    const saved = await saveEntries(entries.filter((e) => e.id !== id));
    uploadSymptoms(saved)
      .then((ok) => { if (!ok) return enqueueRetry("symptoms", saved); })
      .catch(() => enqueueRetry("symptoms", saved));
  }, [entries]);

  const clearEntries = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      setEntries([]);
    } catch (e) {
      console.error("Error clearing symptom entries:", e);
    }
  }, []);

  const hydrateFromServer = useCallback(async (serverEntries: SymptomEntry[]) => {
    try {
      const trimmed = serverEntries
        .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
        .slice(0, MAX_ENTRIES);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      setEntries(trimmed);
    } catch (e) {
      console.error("Error hydrating symptom entries from server:", e);
    }
  }, []);

  const getTodayEntry = useCallback((): SymptomEntry | null => {
    const today = new Date().toISOString().slice(0, 10);
    return entries.find((e) => e.date === today) ?? null;
  }, [entries]);

  const getRecentEntries = useCallback((days: number): SymptomEntry[] => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days + 1);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return entries.filter((e) => e.date >= cutoffStr);
  }, [entries]);

  const getRecentSummary = useCallback((days: number = 7): string => {
    if (entries.length === 0) return "";
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const recent = entries
      .filter((e) => new Date(e.date) >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date)); // newest first
    if (recent.length === 0) return "";

    const AGITATION_LABELS = ["none", "mild", "moderate", "severe"];
    const APPETITE_LABELS = ["none", "poor", "fair", "good"];

    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
    const fmtAvg = (n: number | null) => (n !== null ? n.toFixed(1) : "—");

    const avgPain   = avg(recent.map((e) => e.pain));
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

    // Trend direction — compare newer half vs older half for pain
    let trendNote = "";
    if (recent.length >= 4) {
      const mid = Math.floor(recent.length / 2);
      const newer = recent.slice(0, mid);
      const older = recent.slice(mid);
      const newerAvgPain = avg(newer.map((e) => e.pain));
      const olderAvgPain = avg(older.map((e) => e.pain));
      if (newerAvgPain !== null && olderAvgPain !== null) {
        const diff = newerAvgPain - olderAvgPain;
        if (diff >= 1.5) trendNote = "Pain is trending upward over this period.";
        else if (diff <= -1.5) trendNote = "Pain appears to be improving recently.";
        else trendNote = "Pain levels are relatively stable across this period.";
      }
    }

    // Escalation alert — consecutive high-pain days at the end of the window
    const last3 = recent.slice(0, 3);
    const allHighPain = last3.length === 3 && last3.every((e) => e.pain >= 7);
    const escalationNote = allHighPain
      ? "ALERT: Pain has been 7 or above for 3 consecutive check-ins — this is clinically significant."
      : "";

    // High score note
    const high = recent.filter((e) => e.pain >= 7 || e.breathlessness >= 7);
    const highNote = high.length > 0
      ? `High scores (7+) recorded on ${high.length} of ${recent.length} check-ins.`
      : "";

    // Most recent entry full detail
    const latest = recent[0];
    const latestNote = latest
      ? `Most recent check-in (${latest.date}): pain ${latest.pain}/10, breathlessness ${latest.breathlessness}/10, nausea ${latest.nausea}/10, agitation ${AGITATION_LABELS[latest.agitation as number] ?? latest.agitation}${latest.notes ? `, caregiver note: "${latest.notes}"` : ""}`
      : "";

    return [
      `Recent symptom trends (last ${recent.length} check-ins over ${days} days):`,
      `Pain: avg ${fmtAvg(avgPain)}/10 | Breathlessness: avg ${fmtAvg(avgBreath)}/10 | Nausea: avg ${fmtAvg(avgNausea)}/10`,
      `Agitation: avg ${avgAgitation} | Appetite: avg ${avgAppetite}`,
      trendNote,
      escalationNote,
      highNote,
      latestNote,
    ].filter(Boolean).join("\n");
  }, [entries]);

  return (
    <SymptomContext.Provider
      value={{ entries, isLoading, addEntry, updateEntry, deleteEntry, getTodayEntry, getRecentEntries, getRecentSummary, clearEntries, hydrateFromServer }}
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
