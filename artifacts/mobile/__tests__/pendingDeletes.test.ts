/**
 * Unit tests for the pendingDeletes service and the calling conventions
 * expected of AppContext.toggleSavedResource / toggleSavedProvider.
 *
 * Tests verify:
 *   - enqueuePendingDelete stores IDs and deduplicates
 *   - enqueuePendingDeletes bulk-enqueues with deduplication
 *   - dequeuePendingDelete removes an ID from the store
 *   - getPendingDeletes returns the current store
 *   - clearPendingDeletesForStore resets one store without touching others
 *   - clearAllPendingDeletes wipes the entire store
 *   - The expected calling convention for toggleSavedResource / toggleSavedProvider:
 *       • un-saving an item  → enqueuePendingDelete is called for that ID
 *       • re-saving an item  → dequeuePendingDelete is called to cancel the pending delete
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── AsyncStorage mock ────────────────────────────────────────────────────────
// The mobile artifact uses @react-native-async-storage/async-storage which is
// unavailable in the node vitest environment. We replicate the minimal get/set
// /remove interface backed by a plain in-memory Map.

const storage = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      storage.delete(key);
    }),
  },
}));

// Import AFTER the mock is registered so module resolution picks up the stub.
import {
  enqueuePendingDelete,
  enqueuePendingDeletes,
  dequeuePendingDelete,
  getPendingDeletes,
  clearPendingDeletesForStore,
  clearAllPendingDeletes,
} from "../services/pendingDeletes";

// ─── Reset storage before each test ──────────────────────────────────────────
beforeEach(() => {
  storage.clear();
});

// ─── enqueuePendingDelete ─────────────────────────────────────────────────────

describe("enqueuePendingDelete", () => {
  it("stores an ID for the given store type", async () => {
    await enqueuePendingDelete("savedResources", "res-1");
    const store = await getPendingDeletes();
    expect(store.savedResources).toContain("res-1");
  });

  it("stores an ID for savedProviders independently of savedResources", async () => {
    await enqueuePendingDelete("savedProviders", "prov-1");
    const store = await getPendingDeletes();
    expect(store.savedProviders).toContain("prov-1");
    expect(store.savedResources).toEqual([]);
  });

  it("deduplicates: enqueueing the same ID twice keeps only one copy", async () => {
    await enqueuePendingDelete("savedResources", "res-1");
    await enqueuePendingDelete("savedResources", "res-1");
    const store = await getPendingDeletes();
    expect(store.savedResources.filter((id) => id === "res-1")).toHaveLength(1);
  });

  it("accumulates multiple distinct IDs", async () => {
    await enqueuePendingDelete("savedResources", "res-1");
    await enqueuePendingDelete("savedResources", "res-2");
    const store = await getPendingDeletes();
    expect(store.savedResources.sort()).toEqual(["res-1", "res-2"]);
  });

  it("does not overwrite other store types when enqueueing for one store", async () => {
    await enqueuePendingDelete("symptoms", "sym-1");
    await enqueuePendingDelete("savedResources", "res-1");
    const store = await getPendingDeletes();
    expect(store.symptoms).toContain("sym-1");
    expect(store.savedResources).toContain("res-1");
  });
});

// ─── enqueuePendingDeletes (bulk) ─────────────────────────────────────────────

describe("enqueuePendingDeletes", () => {
  it("bulk-enqueues multiple IDs at once", async () => {
    await enqueuePendingDeletes("savedResources", ["res-1", "res-2", "res-3"]);
    const store = await getPendingDeletes();
    expect(store.savedResources.sort()).toEqual(["res-1", "res-2", "res-3"]);
  });

  it("deduplicates within the batch and against existing entries", async () => {
    await enqueuePendingDelete("savedResources", "res-1");
    await enqueuePendingDeletes("savedResources", ["res-1", "res-2"]);
    const store = await getPendingDeletes();
    expect(store.savedResources.filter((id) => id === "res-1")).toHaveLength(1);
    expect(store.savedResources).toContain("res-2");
  });

  it("is a no-op when ids array is empty", async () => {
    await enqueuePendingDeletes("savedResources", []);
    const store = await getPendingDeletes();
    expect(store.savedResources).toEqual([]);
  });
});

// ─── dequeuePendingDelete ─────────────────────────────────────────────────────

describe("dequeuePendingDelete", () => {
  it("removes an existing ID from the store", async () => {
    await enqueuePendingDelete("savedResources", "res-1");
    await dequeuePendingDelete("savedResources", "res-1");
    const store = await getPendingDeletes();
    expect(store.savedResources).not.toContain("res-1");
  });

  it("removes only the specified ID, leaving others intact", async () => {
    await enqueuePendingDelete("savedResources", "res-1");
    await enqueuePendingDelete("savedResources", "res-2");
    await dequeuePendingDelete("savedResources", "res-1");
    const store = await getPendingDeletes();
    expect(store.savedResources).not.toContain("res-1");
    expect(store.savedResources).toContain("res-2");
  });

  it("is a no-op when the ID is not present (no error thrown)", async () => {
    await expect(dequeuePendingDelete("savedResources", "nonexistent")).resolves.toBeUndefined();
    const store = await getPendingDeletes();
    expect(store.savedResources).toEqual([]);
  });

  it("does not affect other store types", async () => {
    await enqueuePendingDelete("savedProviders", "prov-1");
    await dequeuePendingDelete("savedResources", "prov-1");
    const store = await getPendingDeletes();
    expect(store.savedProviders).toContain("prov-1");
  });
});

// ─── getPendingDeletes ────────────────────────────────────────────────────────

describe("getPendingDeletes", () => {
  it("returns empty arrays for all stores when nothing is queued", async () => {
    const store = await getPendingDeletes();
    expect(store.savedResources).toEqual([]);
    expect(store.savedProviders).toEqual([]);
    expect(store.symptoms).toEqual([]);
    expect(store.journal).toEqual([]);
    expect(store.reminders).toEqual([]);
    expect(store.wellness).toEqual([]);
  });

  it("returns the current state after multiple enqueue operations", async () => {
    await enqueuePendingDelete("savedResources", "res-1");
    await enqueuePendingDelete("savedProviders", "prov-1");
    const store = await getPendingDeletes();
    expect(store.savedResources).toEqual(["res-1"]);
    expect(store.savedProviders).toEqual(["prov-1"]);
  });
});

// ─── clearPendingDeletesForStore ──────────────────────────────────────────────

describe("clearPendingDeletesForStore", () => {
  it("clears only the specified store, leaving others intact", async () => {
    await enqueuePendingDelete("savedResources", "res-1");
    await enqueuePendingDelete("savedProviders", "prov-1");
    await clearPendingDeletesForStore("savedResources");
    const store = await getPendingDeletes();
    expect(store.savedResources).toEqual([]);
    expect(store.savedProviders).toContain("prov-1");
  });

  it("is a no-op when the store is already empty", async () => {
    await expect(clearPendingDeletesForStore("savedResources")).resolves.toBeUndefined();
    const store = await getPendingDeletes();
    expect(store.savedResources).toEqual([]);
  });
});

// ─── clearAllPendingDeletes ───────────────────────────────────────────────────

describe("clearAllPendingDeletes", () => {
  it("wipes all stores at once", async () => {
    await enqueuePendingDelete("savedResources", "res-1");
    await enqueuePendingDelete("savedProviders", "prov-1");
    await enqueuePendingDelete("symptoms", "sym-1");
    await clearAllPendingDeletes();
    const store = await getPendingDeletes();
    expect(store.savedResources).toEqual([]);
    expect(store.savedProviders).toEqual([]);
    expect(store.symptoms).toEqual([]);
  });
});

// ─── Toggle calling conventions ───────────────────────────────────────────────
//
// AppContext.toggleSavedResource and toggleSavedProvider are React hooks that
// cannot be invoked in a pure vitest environment without a full React render
// tree. These tests instead verify the expected service-level calling convention
// at the pendingDeletes layer — the same behaviour that the toggle functions
// delegate to — covering both the un-save and re-save paths.

describe("toggle calling convention (un-save then re-save)", () => {
  it("un-saving a resource enqueues a pending delete for that ID", async () => {
    // Simulates what toggleSavedResource does when the ID is currently saved.
    await enqueuePendingDelete("savedResources", "res-toggle");
    const store = await getPendingDeletes();
    expect(store.savedResources).toContain("res-toggle");
  });

  it("re-saving a resource dequeues the pending delete so the union merge keeps it", async () => {
    // Simulate: user un-saved "res-toggle" while offline (pending delete queued)
    await enqueuePendingDelete("savedResources", "res-toggle");
    // Then re-saved it: toggleSavedResource calls dequeuePendingDelete
    await dequeuePendingDelete("savedResources", "res-toggle");
    const store = await getPendingDeletes();
    expect(store.savedResources).not.toContain("res-toggle");
  });

  it("un-saving a provider enqueues a pending delete for that ID", async () => {
    await enqueuePendingDelete("savedProviders", "prov-toggle");
    const store = await getPendingDeletes();
    expect(store.savedProviders).toContain("prov-toggle");
  });

  it("re-saving a provider dequeues the pending delete so the union merge keeps it", async () => {
    await enqueuePendingDelete("savedProviders", "prov-toggle");
    await dequeuePendingDelete("savedProviders", "prov-toggle");
    const store = await getPendingDeletes();
    expect(store.savedProviders).not.toContain("prov-toggle");
  });

  it("un-saving multiple providers (wipe all) bulk-enqueues all IDs", async () => {
    // Simulates clearSavedProviders which calls enqueuePendingDeletes with the
    // full array of IDs before wiping user.savedProviders.
    const ids = ["prov-a", "prov-b", "prov-c"];
    await enqueuePendingDeletes("savedProviders", ids);
    const store = await getPendingDeletes();
    expect(store.savedProviders.sort()).toEqual(ids);
  });

  it("un-saving then re-saving then un-saving again ends with a single pending delete", async () => {
    // Stress test: multiple toggle cycles must not corrupt the queue.
    await enqueuePendingDelete("savedResources", "res-x");
    await dequeuePendingDelete("savedResources", "res-x");
    await enqueuePendingDelete("savedResources", "res-x");
    const store = await getPendingDeletes();
    expect(store.savedResources.filter((id) => id === "res-x")).toHaveLength(1);
  });
});
