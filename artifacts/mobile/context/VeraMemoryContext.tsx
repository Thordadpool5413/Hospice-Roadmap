import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { VeraMemory } from "@/types";

const STORAGE_KEY = "@vera_memories_v1";
const PROFILE_KEY = "@vera_living_profile_v1";
const TILES_KEY = "@vera_tile_history_v1";
const MAX_MEMORIES = 5;
const MAX_TILES = 20;

interface VeraMemoryContextType {
  memories: VeraMemory[];
  livingProfile: string;
  recentTiles: string[];
  addMemory: (memory: VeraMemory) => Promise<void>;
  clearMemories: () => Promise<void>;
  updateLivingProfile: (profile: string) => Promise<void>;
  recordTile: (label: string) => void;
  getMemorySummary: () => string;
  memoryCount: number;
}

const VeraMemoryContext = createContext<VeraMemoryContextType | null>(null);

export function useVeraMemory(): VeraMemoryContextType {
  const ctx = useContext(VeraMemoryContext);
  if (!ctx) throw new Error("useVeraMemory must be inside VeraMemoryProvider");
  return ctx;
}

export function VeraMemoryProvider({ children }: { children: React.ReactNode }) {
  const [memories, setMemories] = useState<VeraMemory[]>([]);
  const [livingProfile, setLivingProfile] = useState<string>("");
  const [recentTiles, setRecentTiles] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setMemories(JSON.parse(raw) as VeraMemory[]);
      })
      .catch(() => {});
    AsyncStorage.getItem(PROFILE_KEY)
      .then((raw) => {
        if (raw) setLivingProfile(raw);
      })
      .catch(() => {});
    AsyncStorage.getItem(TILES_KEY)
      .then((raw) => {
        if (raw) setRecentTiles(JSON.parse(raw) as string[]);
      })
      .catch(() => {});
  }, []);

  const persistMemories = useCallback(async (updated: VeraMemory[]) => {
    setMemories(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addMemory = useCallback(
    async (memory: VeraMemory) => {
      const deduped = memories.filter((m) => m.conversationId !== memory.conversationId);
      const updated = [memory, ...deduped].slice(0, MAX_MEMORIES);
      await persistMemories(updated);
    },
    [memories, persistMemories]
  );

  const clearMemories = useCallback(async () => {
    await persistMemories([]);
    setLivingProfile("");
    await AsyncStorage.removeItem(PROFILE_KEY);
    setRecentTiles([]);
    await AsyncStorage.removeItem(TILES_KEY);
  }, [persistMemories]);

  const updateLivingProfile = useCallback(async (profile: string) => {
    setLivingProfile(profile);
    await AsyncStorage.setItem(PROFILE_KEY, profile);
  }, []);

  const recordTile = useCallback((label: string) => {
    setRecentTiles((prev) => {
      const updated = [label, ...prev].slice(0, MAX_TILES);
      AsyncStorage.setItem(TILES_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const getMemorySummary = useCallback((): string => {
    if (livingProfile) {
      const lines: string[] = ["--- Vera's Understanding of This Family ---"];
      lines.push(livingProfile);
      if (memories.length > 0) {
        lines.push("\nRecent conversation history:");
        for (const m of memories.slice(0, 3)) {
          const date = new Date(m.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          lines.push(`[${date}] ${m.summary} (tone: ${m.emotionalTone})`);
        }
      }
      const topTiles = getTopTiles(recentTiles, 4);
      if (topTiles.length > 0) {
        lines.push(`\nTopics this person returns to most: ${topTiles.join(", ")}`);
      }
      lines.push(
        "\nUse this understanding to greet them as someone you know well. Reference relevant context naturally. Notice if their situation has changed."
      );
      return lines.join("\n");
    }

    if (memories.length === 0) return "";

    const lines: string[] = ["--- Vera's Memory of Previous Conversations ---"];
    for (const m of memories) {
      const date = new Date(m.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      lines.push(`\n[${date}] ${m.summary}`);
      if (m.keyFacts.length > 0) {
        lines.push(`Key context: ${m.keyFacts.join("; ")}`);
      }
      if (m.mainTopics.length > 0) {
        lines.push(`Topics discussed: ${m.mainTopics.join(", ")}`);
      }
      lines.push(`Emotional tone: ${m.emotionalTone}`);
    }
    lines.push(
      "\nUse this memory to greet the person as someone you know, reference relevant past context naturally, and notice if their situation has changed."
    );
    return lines.join("\n");
  }, [memories, livingProfile, recentTiles]);

  return (
    <VeraMemoryContext.Provider
      value={{
        memories,
        livingProfile,
        recentTiles,
        addMemory,
        clearMemories,
        updateLivingProfile,
        recordTile,
        getMemorySummary,
        memoryCount: memories.length,
      }}
    >
      {children}
    </VeraMemoryContext.Provider>
  );
}

function getTopTiles(tiles: string[], n: number): string[] {
  const counts: Record<string, number> = {};
  for (const t of tiles) {
    counts[t] = (counts[t] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label]) => label);
}
