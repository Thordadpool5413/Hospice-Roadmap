import { bigint, index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const caregiverWellness = pgTable(
  "caregiver_wellness",
  {
    id: text("id").notNull(),
    userId: text("user_id").notNull(),
    date: text("date").notNull(),
    timestamp: bigint("timestamp", { mode: "number" }).notNull(),
    mood: text("mood").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index("caregiver_wellness_user_id_idx").on(table.userId),
    index("caregiver_wellness_user_date_idx").on(table.userId, table.date),
  ]
);

export const insertCaregiverWellnessSchema = createInsertSchema(caregiverWellness).omit({
  createdAt: true,
  updatedAt: true,
});

export type CaregiverWellnessRow = typeof caregiverWellness.$inferSelect;
export type InsertCaregiverWellness = z.infer<typeof insertCaregiverWellnessSchema>;
