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
const MAX_MEMORIES = 5;

interface VeraMemoryContextType {
  memories: VeraMemory[];
  addMemory: (memory: VeraMemory) => Promise<void>;
  clearMemories: () => Promise<void>;
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

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setMemories(JSON.parse(raw) as VeraMemory[]);
      })
      .catch(() => {});
  }, []);

  const persist = useCallback(async (updated: VeraMemory[]) => {
    setMemories(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addMemory = useCallback(
    async (memory: VeraMemory) => {
      const deduped = memories.filter((m) => m.conversationId !== memory.conversationId);
      const updated = [memory, ...deduped].slice(0, MAX_MEMORIES);
      await persist(updated);
    },
    [memories, persist]
  );

  const clearMemories = useCallback(async () => {
    await persist([]);
  }, [persist]);

  const getMemorySummary = useCallback((): string => {
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
  }, [memories]);

  return (
    <VeraMemoryContext.Provider
      value={{
        memories,
        addMemory,
        clearMemories,
        getMemorySummary,
        memoryCount: memories.length,
      }}
    >
      {children}
    </VeraMemoryContext.Provider>
  );
}
