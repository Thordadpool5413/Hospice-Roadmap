/**
 * Unit tests for computeSavedListToggle — the pure helper that encapsulates
 * the pending-delete decision made by AppContext.toggleSavedResource and
 * AppContext.toggleSavedProvider.
 *
 * AppContext.toggleSavedResource / toggleSavedProvider delegate the "what
 * should happen to the pending-deletes queue?" decision to this function and
 * then call enqueuePendingDelete (for "enqueue") or dequeuePendingDelete
 * (for "dequeue") based on the returned `pendingDeleteOp`. Testing the helper
 * therefore verifies the dispatch logic without a React render tree.
 *
 * Tests cover:
 *   - Un-saving an item:  pendingDeleteOp === "enqueue"  (next sync must not restore it)
 *   - Re-saving an item:  pendingDeleteOp === "dequeue"  (cancel the prior un-save)
 *   - Resulting list correctness in both branches
 *   - Bulk clear path (clearSavedResources / clearSavedProviders) using
 *     enqueuePendingDeletes with the full prior list — exercised via the
 *     pendingDeletes service directly to confirm the AppContext contract.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeSavedListToggle } from "../services/savedListToggle";

// ─── AsyncStorage mock (needed because pendingDeletes imports it) ─────────────

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

import {
  enqueuePendingDelete,
  dequeuePendingDelete,
  enqueuePendingDeletes,
  getPendingDeletes,
} from "../services/pendingDeletes";

beforeEach(() => {
  storage.clear();
});

// ─── computeSavedListToggle ───────────────────────────────────────────────────

describe("computeSavedListToggle — un-save path (item is currently saved)", () => {
  it("returns pendingDeleteOp 'enqueue' when the ID is in the current list", () => {
    const { pendingDeleteOp } = computeSavedListToggle(["res-1", "res-2"], "res-1");
    expect(pendingDeleteOp).toBe("enqueue");
  });

  it("removes the ID from nextList when un-saving", () => {
    const { nextList } = computeSavedListToggle(["res-1", "res-2"], "res-1");
    expect(nextList).not.toContain("res-1");
    expect(nextList).toContain("res-2");
  });

  it("nextList length decreases by one on un-save", () => {
    const list = ["a", "b", "c"];
    const { nextList } = computeSavedListToggle(list, "b");
    expect(nextList).toHaveLength(2);
  });

  it("nextList is empty when un-saving the last remaining item", () => {
    const { nextList } = computeSavedListToggle(["only"], "only");
    expect(nextList).toEqual([]);
  });
});

describe("computeSavedListToggle — re-save path (item is not currently saved)", () => {
  it("returns pendingDeleteOp 'dequeue' when the ID is NOT in the current list", () => {
    const { pendingDeleteOp } = computeSavedListToggle(["res-1"], "res-2");
    expect(pendingDeleteOp).toBe("dequeue");
  });

  it("adds the ID to nextList when re-saving", () => {
    const { nextList } = computeSavedListToggle(["res-1"], "res-2");
    expect(nextList).toContain("res-1");
    expect(nextList).toContain("res-2");
  });

  it("nextList length increases by one on re-save", () => {
    const list = ["a", "b"];
    const { nextList } = computeSavedListToggle(list, "c");
    expect(nextList).toHaveLength(3);
  });

  it("returns pendingDeleteOp 'dequeue' when adding to an empty list", () => {
    const { pendingDeleteOp, nextList } = computeSavedListToggle([], "res-new");
    expect(pendingDeleteOp).toBe("dequeue");
    expect(nextList).toEqual(["res-new"]);
  });
});

// ─── AppContext toggle contract: queue interaction ────────────────────────────
//
// These tests simulate what AppContext.toggleSavedResource /
// toggleSavedProvider do when they receive the result from
// computeSavedListToggle — they call enqueuePendingDelete or
// dequeuePendingDelete accordingly. This verifies the full un-save / re-save
// contract that CloudSyncManager depends on.

describe("AppContext toggle contract via pendingDeletes service", () => {
  it("un-saving (enqueue path): enqueuePendingDelete is called and ID appears in the queue", async () => {
    const resourceId = "res-toggle";
    const currentList = [resourceId, "res-other"];

    const { pendingDeleteOp } = computeSavedListToggle(currentList, resourceId);
    expect(pendingDeleteOp).toBe("enqueue");

    // AppContext calls this when pendingDeleteOp === "enqueue"
    await enqueuePendingDelete("savedResources", resourceId);

    const store = await getPendingDeletes();
    expect(store.savedResources).toContain(resourceId);
  });

  it("re-saving (dequeue path): dequeuePendingDelete is called and ID is removed from the queue", async () => {
    const resourceId = "res-toggle";
    // Simulate a prior offline un-save
    await enqueuePendingDelete("savedResources", resourceId);

    const currentList: string[] = []; // already un-saved, so not in list
    const { pendingDeleteOp } = computeSavedListToggle(currentList, resourceId);
    expect(pendingDeleteOp).toBe("dequeue");

    // AppContext calls this when pendingDeleteOp === "dequeue"
    await dequeuePendingDelete("savedResources", resourceId);

    const store = await getPendingDeletes();
    expect(store.savedResources).not.toContain(resourceId);
  });

  it("un-saving a provider (enqueue path) enqueues to the savedProviders store", async () => {
    const providerId = "prov-toggle";
    const currentList = [providerId];

    const { pendingDeleteOp } = computeSavedListToggle(currentList, providerId);
    expect(pendingDeleteOp).toBe("enqueue");

    await enqueuePendingDelete("savedProviders", providerId);

    const store = await getPendingDeletes();
    expect(store.savedProviders).toContain(providerId);
    // Must not bleed into savedResources
    expect(store.savedResources).not.toContain(providerId);
  });

  it("re-saving a provider (dequeue path) removes it from the savedProviders queue", async () => {
    const providerId = "prov-toggle";
    await enqueuePendingDelete("savedProviders", providerId);

    const { pendingDeleteOp } = computeSavedListToggle([], providerId);
    expect(pendingDeleteOp).toBe("dequeue");

    await dequeuePendingDelete("savedProviders", providerId);

    const store = await getPendingDeletes();
    expect(store.savedProviders).not.toContain(providerId);
  });

  it("toggle cycle: un-save then re-save leaves the queue clean", async () => {
    const id = "res-cycle";
    const savedList = [id];

    // Un-save
    const unsave = computeSavedListToggle(savedList, id);
    expect(unsave.pendingDeleteOp).toBe("enqueue");
    await enqueuePendingDelete("savedResources", id);

    // Re-save (currentList is now unsave.nextList which doesn't contain id)
    const resave = computeSavedListToggle(unsave.nextList, id);
    expect(resave.pendingDeleteOp).toBe("dequeue");
    await dequeuePendingDelete("savedResources", id);

    const store = await getPendingDeletes();
    expect(store.savedResources).not.toContain(id);
    expect(resave.nextList).toContain(id);
  });

  it("clearSavedResources contract: bulk-enqueues all IDs via enqueuePendingDeletes", async () => {
    // AppContext.clearSavedResources calls enqueuePendingDeletes("savedResources", user.savedResources)
    // then sets savedResources to []. This test verifies the bulk-enqueue contract.
    const allSaved = ["res-a", "res-b", "res-c"];

    await enqueuePendingDeletes("savedResources", allSaved);

    const store = await getPendingDeletes();
    expect(store.savedResources.sort()).toEqual(allSaved.sort());
  });

  it("clearSavedProviders contract: bulk-enqueues all IDs via enqueuePendingDeletes", async () => {
    const allSaved = ["prov-a", "prov-b"];

    await enqueuePendingDeletes("savedProviders", allSaved);

    const store = await getPendingDeletes();
    expect(store.savedProviders.sort()).toEqual(allSaved.sort());
    expect(store.savedResources).toEqual([]);
  });
});
