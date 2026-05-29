import { boolean, index, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const symptomEntries = pgTable(
  "symptom_entries",
  {
    id: text("id").notNull(),
    userId: text("user_id").notNull(),
    date: text("date").notNull(),
    time: text("time").notNull(),
    pain: integer("pain").notNull(),
    breathlessness: integer("breathlessness").notNull(),
    nausea: integer("nausea").notNull(),
    agitation: integer("agitation").notNull(),
    restlessness: boolean("restlessness").notNull().default(false),
    appetite: integer("appetite").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index("symptom_entries_user_id_idx").on(table.userId),
    index("symptom_entries_user_date_idx").on(table.userId, table.date),
  ]
);

export const insertSymptomEntrySchema = createInsertSchema(symptomEntries).omit({
  createdAt: true,
  updatedAt: true,
});

export type SymptomEntry = typeof symptomEntries.$inferSelect;
export type InsertSymptomEntry = z.infer<typeof insertSymptomEntrySchema>;
