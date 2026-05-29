import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const familyUpdateLog = pgTable(
  "family_update_log",
  {
    id: text("id").notNull().primaryKey(),
    userId: text("user_id").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull(),
    recipientCount: integer("recipient_count").notNull(),
    preview: text("preview").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("family_update_log_user_id_idx").on(table.userId),
    index("family_update_log_user_sent_at_idx").on(table.userId, table.sentAt),
  ]
);

export const insertFamilyUpdateLogSchema = createInsertSchema(familyUpdateLog).omit({
  createdAt: true,
});

export type FamilyUpdateLog = typeof familyUpdateLog.$inferSelect;
export type InsertFamilyUpdateLog = z.infer<typeof insertFamilyUpdateLogSchema>;
