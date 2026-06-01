import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * One row per user. Stores Ragna's accumulated AI memory as two JSONB arrays:
 *   - `memories`: array of VeraMemory objects (capped at 5 on the client)
 *   - `tiles`: recent tile/topic history (capped at 20 on the client)
 *
 * Conflict resolution is true LWW keyed on `updatedAt`. The client sends its
 * local `updatedAt` as `clientUpdatedAt`; the server only overwrites the stored
 * row when the incoming timestamp is ≥ the stored one.
 */
export const ragnaMemory = pgTable("ragna_memory", {
  userId: text("user_id").primaryKey(),
  memories: jsonb("memories").notNull().default([]),
  tiles: jsonb("tiles").notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertRagnaMemorySchema = createInsertSchema(ragnaMemory).omit({
  updatedAt: true,
});

export type RagnaMemoryRow = typeof ragnaMemory.$inferSelect;
export type InsertRagnaMemory = z.infer<typeof insertRagnaMemorySchema>;
