// RagnaLearningContext — tracks meaningful app-activity events so Ragna
// always knows what the user has been entering, experiencing, and doing,
// even between conversations. This is the "always learning" layer.
//
// Storage key: @ragna_learning_v1
// Observations are kept for 21 days, capped at 40 entries.

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ObservationType =
  | "symptom_checkin"
  | "symptom_high"
  | "journal_entry"
  | "goals_updated"
  | "profile_updated"
  | "medication_added";

export interface RagnaObservation {
  id: string;
  type: ObservationType;
  summary: string;
  detail?: string;
  date: string;
  timestamp: number;
  significant: boolean;
}

interface RagnaLearningContextType {
  observations: RagnaObservation[];
  addObservation: (
    type: ObservationType,
    summary: string,
    options?: { detail?: string; significant?: boolean }
  ) => Promise<void>;
  getObservationContext: () => string;
  clearObservations: () => Promise<void>;
  significantCount: number;
  lastSignificantAt: number | null;
}

const RagnaLearningContext = createContext<RagnaLearningContextType | null>(null);

export const LEARNING_STORAGE_KEY = "@ragna_learning_v1";
const MAX_OBSERVATIONS = 40;
const DAYS_TO_KEEP = 21;

export function RagnaLearningProvider({ children }: { children: React.ReactNode }) {
  const [observations, setObservations] = useState<RagnaObservation[]>([]);
  const [lastSignificantAt, setLastSignificantAt] = useState<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LEARNING_STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as RagnaObservation[];
          const cutoff = Date.now() - DAYS_TO_KEEP * 86400000;
          const active = parsed.filter((o) => o.timestamp > cutoff);
          setObservations(active);
          const lastSig = active.find((o) => o.significant);
          if (lastSig) setLastSignificantAt(lastSig.timestamp);
        }
      })
      .catch(() => {});
  }, []);

  const persist = useCallback(async (list: RagnaObservation[]) => {
    setObservations(list);
    await AsyncStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(list));
  }, []);

  const addObservation = useCallback(
    async (
      type: ObservationType,
      summary: string,
      options?: { detail?: string; significant?: boolean }
    ) => {
      const now = Date.now();
      const obs: RagnaObservation = {
        id: `${now}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        summary,
        detail: options?.detail,
        date: new Date(now).toISOString().slice(0, 10),
        timestamp: now,
        significant: options?.significant ?? false,
      };
      const cutoff = now - DAYS_TO_KEEP * 86400000;
      const updated = [obs, ...observations]
        .filter((o) => o.timestamp > cutoff)
        .slice(0, MAX_OBSERVATIONS);
      await persist(updated);
      if (obs.significant) {
        setLastSignificantAt(now);
      }
    },
    [observations, persist]
  );

  const getObservationContext = useCallback((): string => {
    if (observations.length === 0) return "";

    const recent = observations.slice(0, 12);
    const lines: string[] = [
      "--- What Ragna Has Observed From Your App Activity ---",
    ];

    for (const obs of recent) {
      const dateStr = new Date(obs.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      lines.push(
        `[${dateStr}] ${obs.summary}${obs.detail ? ` — ${obs.detail}` : ""}`
      );
    }

    lines.push(
      "\nUse these observations to understand this person more deeply. Reference them naturally when relevant — not as a list, but as context that shapes how you speak with them."
    );
    return lines.join("\n");
  }, [observations]);

  const clearObservations = useCallback(async () => {
    await AsyncStorage.removeItem(LEARNING_STORAGE_KEY);
    setObservations([]);
    setLastSignificantAt(null);
  }, []);

  return (
    <RagnaLearningContext.Provider
      value={{
        observations,
        addObservation,
        getObservationContext,
        clearObservations,
        significantCount: observations.filter((o) => o.significant).length,
        lastSignificantAt,
      }}
    >
      {children}
    </RagnaLearningContext.Provider>
  );
}

export function useRagnaLearning(): RagnaLearningContextType {
  const ctx = useContext(RagnaLearningContext);
  if (!ctx) throw new Error("useRagnaLearning must be inside RagnaLearningProvider");
  return ctx;
}
