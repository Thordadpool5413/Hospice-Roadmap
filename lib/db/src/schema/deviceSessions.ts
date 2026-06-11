import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * One row per (user, device) pair. Tracks which Clerk session is active on
 * each device so the server can revoke all OTHER sessions when a new device
 * signs in, enforcing one active device per account.
 *
 * Conflict target for upsert: unique index on (user_id, device_id).
 * When the same device signs in again (e.g. new session after token refresh),
 * the existing row is updated with the latest clerkSessionId + lastSeenAt.
 */
export const deviceSessions = pgTable(
  "device_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    deviceId: text("device_id").notNull(),
    clerkSessionId: text("clerk_session_id").notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("device_sessions_user_device_idx").on(table.userId, table.deviceId),
    index("device_sessions_user_id_idx").on(table.userId),
  ]
);

export const insertDeviceSessionSchema = createInsertSchema(deviceSessions).omit({
  id: true,
  lastSeenAt: true,
});

export type DeviceSession = typeof deviceSessions.$inferSelect;
export type InsertDeviceSession = z.infer<typeof insertDeviceSessionSchema>;
