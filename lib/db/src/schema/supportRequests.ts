import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const supportRequests = pgTable(
  "support_requests",
  {
    id: serial("id").primaryKey(),
    clientId: text("client_id").notNull().default("anonymous_support"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    topic: text("topic").notNull(),
    preferredContact: text("preferred_contact").notNull(),
    message: text("message").notNull(),
    status: text("status").notNull().default("received"),
    source: text("source").notNull().default("ios_app"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("support_requests_client_id_idx").on(table.clientId),
    index("support_requests_topic_idx").on(table.topic),
    index("support_requests_status_idx").on(table.status),
    index("support_requests_created_at_idx").on(table.createdAt),
  ]
);

export const insertSupportRequestSchema = createInsertSchema(supportRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SupportRequest = typeof supportRequests.$inferSelect;
export type InsertSupportRequest = z.infer<typeof insertSupportRequestSchema>;
