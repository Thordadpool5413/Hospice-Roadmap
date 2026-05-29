import { boolean, index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const syncReminders = pgTable(
  "sync_reminders",
  {
    id: text("id").notNull(),
    userId: text("user_id").notNull(),
    type: text("type").notNull(),
    label: text("label").notNull(),
    datetime: text("datetime").notNull(),
    recurrence: text("recurrence").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index("sync_reminders_user_id_idx").on(table.userId),
  ]
);

export const insertSyncReminderSchema = createInsertSchema(syncReminders).omit({
  createdAt: true,
  updatedAt: true,
});

export type SyncReminder = typeof syncReminders.$inferSelect;
export type InsertSyncReminder = z.infer<typeof insertSyncReminderSchema>;
