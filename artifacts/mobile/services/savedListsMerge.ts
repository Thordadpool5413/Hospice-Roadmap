/**
 * Pure helper for the union-merge strategy used by CloudSyncManager when
 * reconciling savedResources and savedProviders across devices.
 *
 * Strategy:
 *   1. Take the union (Set) of local + server IDs so bookmarks added on
 *      another device while offline are not lost.
 *   2. Remove any IDs the user explicitly un-saved while offline (tracked in
 *      the pending-deletes queue) so that offline deletions survive a sync
 *      without being restored from the server side of the union.
 *
 * This is intentionally a pure function so it can be unit-tested without any
 * AsyncStorage, React, or network dependencies.
 *
 * @param local          IDs saved on this device (user.savedResources or .savedProviders)
 * @param server         IDs coming from the server profile snapshot
 * @param pendingDeletes IDs explicitly un-saved while offline (from PendingDeletesStore)
 * @returns Deduplicated union of local + server with pendingDeletes excluded.
 */
export function mergeSavedList(
  local: string[],
  server: string[],
  pendingDeletes: string[],
): string[] {
  const deleteSet = new Set(pendingDeletes);
  return Array.from(new Set([...local, ...server])).filter(
    (id) => !deleteSet.has(id),
  );
}
