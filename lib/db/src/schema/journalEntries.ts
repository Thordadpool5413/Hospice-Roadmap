import { index, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: text("id").notNull(),
    userId: text("user_id").notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    date: text("date").notNull(),
    timestamp: integer("timestamp").notNull(),
    moodLevel: integer("mood_level"),
    tags: jsonb("tags").$type<string[]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index("journal_entries_user_id_idx").on(table.userId),
    index("journal_entries_user_date_idx").on(table.userId, table.date),
  ]
);

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  createdAt: true,
  updatedAt: true,
});

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
