/**
 * Pure helper for the toggle-saved-item logic used by AppContext.
 *
 * Determines whether an item should be saved or un-saved, returns the updated
 * list, and returns the pending-delete operation that must be applied so that
 * offline un-saves survive the next cloud sync's union-merge step.
 *
 * Extracting this as a pure function makes the critical side-effect decisions
 * (enqueue vs. dequeue) unit-testable without a full React render tree.
 *
 * Called by:
 *   - AppContext.toggleSavedResource  (storeType = "savedResources")
 *   - AppContext.toggleSavedProvider  (storeType = "savedProviders")
 */

import type { DeleteStoreType } from "./pendingDeletes";

export type SavedListStore = Extract<DeleteStoreType, "savedResources" | "savedProviders">;

export interface ToggleResult {
  /** Updated list after the toggle is applied. */
  nextList: string[];
  /**
   * What the caller must do to the pending-deletes queue:
   *   "enqueue"  — item was removed; queue it so the next sync doesn't restore it.
   *   "dequeue"  — item was added; cancel any existing pending delete for this ID.
   */
  pendingDeleteOp: "enqueue" | "dequeue";
}

/**
 * Compute the result of toggling `id` in `currentList`.
 *
 * @param currentList  The current saved-item IDs (e.g. user.savedResources)
 * @param id           The item being toggled
 * @returns            The updated list and which pending-delete operation to apply
 */
export function computeSavedListToggle(
  currentList: string[],
  id: string,
): ToggleResult {
  if (currentList.includes(id)) {
    return {
      nextList: currentList.filter((existing) => existing !== id),
      pendingDeleteOp: "enqueue",
    };
  }
  return {
    nextList: [...currentList, id],
    pendingDeleteOp: "dequeue",
  };
}
