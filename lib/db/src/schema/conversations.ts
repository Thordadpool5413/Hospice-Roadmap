import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    clientId: text("client_id").notNull().default("legacy_unowned"),
    userId: text("user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("conversations_client_id_idx").on(table.clientId),
    index("conversations_user_id_idx").on(table.userId),
  ]
);

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
