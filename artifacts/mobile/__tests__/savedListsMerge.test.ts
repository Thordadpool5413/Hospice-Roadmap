/**
 * Unit tests for the savedListsMerge helper used by CloudSyncManager.
 *
 * Covers the four interaction modes documented in the task:
 *   1. Union of local + server (no pending deletes)
 *   2. Pending-delete filtering (offline un-save survives sync)
 *   3. Server-wins injection (server-only items are added to local)
 *   4. Local-wins hydration (local-only items survive when server has less)
 */

import { describe, it, expect } from "vitest";
import { mergeSavedList } from "../services/savedListsMerge";

describe("mergeSavedList", () => {
  // ── 1. Union of local + server ──────────────────────────────────────────────

  describe("union of local + server", () => {
    it("returns the union when local and server have no overlap", () => {
      const result = mergeSavedList(["a", "b"], ["c", "d"], []);
      expect(result.sort()).toEqual(["a", "b", "c", "d"]);
    });

    it("deduplicates IDs present on both sides", () => {
      const result = mergeSavedList(["a", "b"], ["b", "c"], []);
      expect(result.sort()).toEqual(["a", "b", "c"]);
    });

    it("returns local items when server list is empty", () => {
      const result = mergeSavedList(["a", "b"], [], []);
      expect(result.sort()).toEqual(["a", "b"]);
    });

    it("returns server items when local list is empty", () => {
      const result = mergeSavedList([], ["c", "d"], []);
      expect(result.sort()).toEqual(["c", "d"]);
    });

    it("returns empty when both local and server are empty", () => {
      expect(mergeSavedList([], [], [])).toEqual([]);
    });
  });

  // ── 2. Pending-delete filtering ─────────────────────────────────────────────

  describe("pending-delete filtering (offline un-save survives sync)", () => {
    it("removes an ID from the union when it appears in pendingDeletes", () => {
      const result = mergeSavedList(["a", "b", "c"], ["b", "d"], ["b"]);
      expect(result.sort()).toEqual(["a", "c", "d"]);
    });

    it("removes multiple IDs that are in pendingDeletes", () => {
      const result = mergeSavedList(["a", "b", "c"], ["b", "d", "e"], ["b", "d"]);
      expect(result.sort()).toEqual(["a", "c", "e"]);
    });

    it("removes a server-only ID that appears in pendingDeletes (prevents resurrection)", () => {
      // User un-saved "x" while offline; the server still has it.
      // The merge should NOT restore it.
      const result = mergeSavedList([], ["x", "y"], ["x"]);
      expect(result).toEqual(["y"]);
    });

    it("removes a local-only ID that appears in pendingDeletes (local offline delete)", () => {
      // Edge case: ID queued as pending-delete but somehow still in local list.
      const result = mergeSavedList(["x", "y"], [], ["x"]);
      expect(result).toEqual(["y"]);
    });

    it("returns empty when all union IDs are in pendingDeletes", () => {
      const result = mergeSavedList(["a"], ["b"], ["a", "b"]);
      expect(result).toEqual([]);
    });

    it("is a no-op when pendingDeletes contains IDs not in either list", () => {
      // Stale entries in pendingDeletes must not affect valid IDs.
      const result = mergeSavedList(["a", "b"], ["c"], ["z"]);
      expect(result.sort()).toEqual(["a", "b", "c"]);
    });

    it("does not remove an ID that was re-saved (not in pendingDeletes)", () => {
      // Simulate: "x" was un-saved then re-saved (dequeuePendingDelete was called)
      // so pendingDeletes no longer contains "x".
      const result = mergeSavedList(["x"], ["x"], []);
      expect(result).toEqual(["x"]);
    });
  });

  // ── 3. Server-wins injection ─────────────────────────────────────────────────

  describe("server-wins injection (items only on server appear in result)", () => {
    it("adds server-only items to the result (new bookmark from another device)", () => {
      const result = mergeSavedList(["a"], ["a", "newFromServer"], []);
      expect(result.sort()).toEqual(["a", "newFromServer"]);
    });

    it("keeps server-only items even when local list is empty (reinstall scenario)", () => {
      // Fresh install: local is empty, server has bookmarks from a previous device.
      const result = mergeSavedList([], ["server1", "server2"], []);
      expect(result.sort()).toEqual(["server1", "server2"]);
    });

    it("does NOT add a server-only item if it is in pendingDeletes", () => {
      // Server has "old" but the user un-saved it on this device while offline.
      const result = mergeSavedList(["a"], ["a", "old"], ["old"]);
      expect(result).toEqual(["a"]);
    });
  });

  // ── 4. Local-wins hydration ──────────────────────────────────────────────────

  describe("local-wins hydration (local-only items survive when server has less)", () => {
    it("preserves local-only items when the server list is a subset of local", () => {
      // Device B only synced a subset of bookmarks to the server.
      // Device A (local) has more; none should be lost.
      const result = mergeSavedList(["a", "b", "c"], ["a"], []);
      expect(result.sort()).toEqual(["a", "b", "c"]);
    });

    it("preserves local items when the server list is empty", () => {
      // No server profile yet — local bookmarks must survive unchanged.
      const result = mergeSavedList(["a", "b"], [], []);
      expect(result.sort()).toEqual(["a", "b"]);
    });

    it("excludes local items that are in pendingDeletes (offline un-save)", () => {
      // User un-saved "b" while offline; local still has it but pending delete
      // should remove it even though the server doesn't have it.
      const result = mergeSavedList(["a", "b"], [], ["b"]);
      expect(result).toEqual(["a"]);
    });
  });

  // ── Output properties ────────────────────────────────────────────────────────

  describe("output properties", () => {
    it("never returns duplicate IDs in the result", () => {
      const result = mergeSavedList(["a", "a", "b"], ["a", "b", "b"], []);
      const unique = new Set(result);
      expect(result.length).toBe(unique.size);
    });

    it("is stable: re-running with the same inputs produces identical results", () => {
      const args = [["a", "b"], ["b", "c"], ["x"]] as const;
      expect(mergeSavedList(...args)).toEqual(mergeSavedList(...args));
    });
  });
});
