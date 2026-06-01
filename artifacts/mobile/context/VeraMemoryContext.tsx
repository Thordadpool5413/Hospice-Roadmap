// Powers Ragna's conversational memory, living profile, and tile history.
// File name retained as VeraMemoryContext for storage compatibility — safe to rename in a later migration pass.
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Legacy compatibility name retained for now. This type powers Ragna memory and can be renamed in a later migration pass.
import { VeraMemory } from "@/types";
import { uploadRagnaMemory } from "@/services/syncService";

// AsyncStorage keys are frozen — renaming would lose existing user data.
const STORAGE_KEY = "@vera_memories_v1";
const PROFILE_KEY = "@vera_living_profile_v1";
const PROFILE_UPDATED_AT_KEY = "@vera_living_profile_updated_at_v1";
const TILES_KEY = "@vera_tile_history_v1";
// Dedicated LWW version key for the ragna_memory server document (memories + tiles).
// Separate from livingProfileUpdatedAt because memory writes and profile writes
// are independent operations; mixing them would break LWW on both paths.
const RAGNA_MEMORY_UPDATED_AT_KEY = "@ragna_memory_updated_at_v1";
const MAX_MEMORIES = 5;
const MAX_TILES = 20;

// Legacy compatibility name retained for now. Powers Ragna memory context.
interface VeraMemoryContextType {
  memories: VeraMemory[];
  livingProfile: string;
  /** ISO timestamp of the last local write to livingProfile — used as LWW version key for sync. */
  livingProfileUpdatedAt: string;
  /** ISO timestamp of the last local write to memories or tiles — LWW version key for the ragna_memory server document. */
  ragnaMemoryUpdatedAt: string;
  recentTiles: string[];
  /** True while the initial AsyncStorage load is still in flight. */
  isLoading: boolean;
  addMemory: (memory: VeraMemory) => Promise<void>;
  clearMemories: () => Promise<void>;
  updateLivingProfile: (profile: string, updatedAt?: string) => Promise<void>;
  recordTile: (label: string) => void;
  getMemorySummary: () => string;
  memoryCount: number;
  /**
   * Restore memories and tiles from a server sync response (LWW already
   * resolved by CloudSyncManager). Writes through to AsyncStorage without
   * triggering a write-through upload (the data just came from the server).
   * @param serverUpdatedAt  The server row's updatedAt — stored as the local
   *   LWW version so the next sync doesn't immediately re-upload as "newer".
   */
  hydrateFromServer: (
    serverMemories: VeraMemory[],
    serverTiles: string[],
    serverUpdatedAt: string,
  ) => Promise<void>;
}

// Legacy compatibility name retained for now. Powers Ragna memory context.
const VeraMemoryContext = createContext<VeraMemoryContextType | null>(null);

// Legacy compatibility name retained for now. Hook that provides Ragna's memory to consumers.
export function useVeraMemory(): VeraMemoryContextType {
  const ctx = useContext(VeraMemoryContext);
  if (!ctx) throw new Error("useVeraMemory must be inside VeraMemoryProvider");
  return ctx;
}

// Legacy compatibility name retained for now. Provides Ragna's memory state to the tree.
export function VeraMemoryProvider({ children }: { children: React.ReactNode }) {
  const [memories, setMemories] = useState<VeraMemory[]>([]);
  const [livingProfile, setLivingProfile] = useState<string>("");
  const [livingProfileUpdatedAt, setLivingProfileUpdatedAt] = useState<string>("");
  const [ragnaMemoryUpdatedAt, setRagnaMemoryUpdatedAt] = useState<string>("");
  const [recentTiles, setRecentTiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refs so upload callbacks always see the current value without being listed
  // in every useCallback dependency array.
  const memoriesRef = useRef<VeraMemory[]>([]);
  const tilesRef = useRef<string[]>([]);
  const ragnaMemoryUpdatedAtRef = useRef<string>("");

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(PROFILE_KEY),
      AsyncStorage.getItem(PROFILE_UPDATED_AT_KEY),
      AsyncStorage.getItem(TILES_KEY),
      AsyncStorage.getItem(RAGNA_MEMORY_UPDATED_AT_KEY),
    ])
      .then(([memoriesRaw, profileRaw, profileUpdatedAtRaw, tilesRaw, ragnaUpdatedAtRaw]) => {
        if (memoriesRaw) {
          const parsed = JSON.parse(memoriesRaw) as VeraMemory[];
          setMemories(parsed);
          memoriesRef.current = parsed;
        }
        if (profileRaw) setLivingProfile(profileRaw);
        if (profileUpdatedAtRaw) setLivingProfileUpdatedAt(profileUpdatedAtRaw);
        if (tilesRaw) {
          const parsed = JSON.parse(tilesRaw) as string[];
          setRecentTiles(parsed);
          tilesRef.current = parsed;
        }
        if (ragnaUpdatedAtRaw) {
          setRagnaMemoryUpdatedAt(ragnaUpdatedAtRaw);
          ragnaMemoryUpdatedAtRef.current = ragnaUpdatedAtRaw;
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const persistMemories = useCallback(async (updated: VeraMemory[]) => {
    setMemories(updated);
    memoriesRef.current = updated;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  /**
   * Stamp a new ragnaMemoryUpdatedAt, persist it, and return the new ISO string.
   * Called on every write that should advance the LWW version key.
   */
  const stampRagnaUpdatedAt = useCallback(async (): Promise<string> => {
    const ts = new Date().toISOString();
    setRagnaMemoryUpdatedAt(ts);
    ragnaMemoryUpdatedAtRef.current = ts;
    await AsyncStorage.setItem(RAGNA_MEMORY_UPDATED_AT_KEY, ts);
    return ts;
  }, []);

  const addMemory = useCallback(
    async (memory: VeraMemory) => {
      const deduped = memoriesRef.current.filter(
        (m) => m.conversationId !== memory.conversationId,
      );
      const updated = [memory, ...deduped].slice(0, MAX_MEMORIES);
      await persistMemories(updated);

      // Stamp a new LWW version key and fire a write-through upload (fire-and-forget).
      const ts = await stampRagnaUpdatedAt();
      uploadRagnaMemory(updated, tilesRef.current, ts).catch(() => {});
    },
    [persistMemories, stampRagnaUpdatedAt]
  );

  // Clears all local Ragna memory: saved conversation memories, the living
  // profile summary, and the recent tile/topic history — all on this device only.
  // Does not affect any server-backed conversation history or support requests.
  const clearMemories = useCallback(async () => {
    await persistMemories([]);
    setLivingProfile("");
    setLivingProfileUpdatedAt("");
    setRagnaMemoryUpdatedAt("");
    ragnaMemoryUpdatedAtRef.current = "";
    tilesRef.current = [];
    setRecentTiles([]);
    await AsyncStorage.multiRemove([
      PROFILE_KEY,
      PROFILE_UPDATED_AT_KEY,
      TILES_KEY,
      RAGNA_MEMORY_UPDATED_AT_KEY,
    ]);
  }, [persistMemories]);

  /**
   * Update the living profile string.
   * @param profile   The new synthesised profile text.
   * @param updatedAt Optional ISO timestamp to use as the LWW version key.
   *                  Defaults to now, so server restores use the server's own
   *                  updatedAt to avoid immediately re-uploading as "newer".
   */
  const updateLivingProfile = useCallback(async (profile: string, updatedAt?: string) => {
    const ts = updatedAt ?? new Date().toISOString();
    setLivingProfile(profile);
    setLivingProfileUpdatedAt(ts);
    await AsyncStorage.setItem(PROFILE_KEY, profile);
    await AsyncStorage.setItem(PROFILE_UPDATED_AT_KEY, ts);
  }, []);

  const recordTile = useCallback((label: string) => {
    setRecentTiles((prev) => {
      const updated = [label, ...prev].slice(0, MAX_TILES);
      tilesRef.current = updated;
      AsyncStorage.setItem(TILES_KEY, JSON.stringify(updated)).catch(() => {});

      // Stamp a new LWW version key and fire a write-through upload (fire-and-forget).
      // We persist the timestamp first, then upload, to ensure durability even
      // if the upload fails — the stamped ts will be used on the next full sync.
      stampRagnaUpdatedAt()
        .then((ts) => uploadRagnaMemory(memoriesRef.current, updated, ts))
        .catch(() => {});

      return updated;
    });
  }, [stampRagnaUpdatedAt]);

  /**
   * Restore memories and tile history from the server after CloudSyncManager
   * has already resolved the LWW conflict and determined the server data wins.
   * Writes through to AsyncStorage and stores the server's updatedAt as the
   * new local LWW key so the next sync doesn't re-upload this data as "newer".
   * Does NOT fire a write-through upload — the data came from the server.
   */
  const hydrateFromServer = useCallback(
    async (serverMemories: VeraMemory[], serverTiles: string[], serverUpdatedAt: string) => {
      setMemories(serverMemories);
      memoriesRef.current = serverMemories;
      setRecentTiles(serverTiles);
      tilesRef.current = serverTiles;
      setRagnaMemoryUpdatedAt(serverUpdatedAt);
      ragnaMemoryUpdatedAtRef.current = serverUpdatedAt;
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverMemories)),
        AsyncStorage.setItem(TILES_KEY, JSON.stringify(serverTiles)),
        AsyncStorage.setItem(RAGNA_MEMORY_UPDATED_AT_KEY, serverUpdatedAt),
      ]);
    },
    []
  );

  const getMemorySummary = useCallback((): string => {
    if (livingProfile) {
      const lines: string[] = ["--- Ragna's Understanding of This Family ---"];
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

    const lines: string[] = ["--- Ragna's Memory of Previous Conversations ---"];
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
        livingProfileUpdatedAt,
        ragnaMemoryUpdatedAt,
        recentTiles,
        isLoading,
        addMemory,
        clearMemories,
        updateLivingProfile,
        recordTile,
        getMemorySummary,
        memoryCount: memories.length,
        hydrateFromServer,
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
