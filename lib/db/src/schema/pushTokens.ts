import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * One row per (user, device) pair. Stores the Expo push token used to deliver
 * remote notifications to a signed-in user's device(s).
 *
 * A user can have multiple rows (one per device). The unique index on
 * (user_id, expo_push_token) is the upsert conflict target so re-registering
 * the same token simply refreshes `platform` / `updated_at` instead of
 * inserting a duplicate.
 */
export const pushTokens = pgTable(
  "push_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    expoPushToken: text("expo_push_token").notNull(),
    platform: text("platform").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("push_tokens_user_id_token_idx").on(table.userId, table.expoPushToken),
    index("push_tokens_user_id_idx").on(table.userId),
  ]
);

export const insertPushTokenSchema = createInsertSchema(pushTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = z.infer<typeof insertPushTokenSchema>;
