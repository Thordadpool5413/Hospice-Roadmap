import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface GoalsOfCareContent {
  whatMattersMost?: string;
  goodDayLooksLike?: string;
  thingsToAvoid?: string;
  dnrStatus?: "dnr" | "full-code" | "unknown" | "not-discussed";
  additionalDirectives?: string;
  fearsAndConcerns?: string;
  finalDaysWishes?: string;
  afterDeathWishes?: string;
  updatedAt?: string;
}

/**
 * Zod schema for the GoC JSONB content blob.
 *
 * All eight user-editable fields are optional strings (dnrStatus is an enum).
 * `updatedAt` is the document-level ISO timestamp written by the mobile client.
 * `fieldUpdatedAt` is a per-field ISO timestamp map written by mergeGoalsOfCare.
 *
 * Using z.object() (not passthrough) means any extra keys are stripped on
 * parse, keeping the stored JSONB tidy even if a future client sends new
 * fields before the server schema is updated.
 */
export const gocContentSchema = z.object({
  whatMattersMost: z.string().optional(),
  goodDayLooksLike: z.string().optional(),
  thingsToAvoid: z.string().optional(),
  dnrStatus: z.enum(["dnr", "full-code", "unknown", "not-discussed"]).optional(),
  additionalDirectives: z.string().optional(),
  fearsAndConcerns: z.string().optional(),
  finalDaysWishes: z.string().optional(),
  afterDeathWishes: z.string().optional(),
  updatedAt: z.string().optional(),
  fieldUpdatedAt: z.record(z.string(), z.string()).optional(),
});

export type GocContent = z.infer<typeof gocContentSchema>;

export const goalsOfCare = pgTable("goals_of_care", {
  userId: text("user_id").primaryKey(),
  content: jsonb("content").$type<GoalsOfCareContent>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertGoalsOfCareSchema = createInsertSchema(goalsOfCare).omit({
  updatedAt: true,
});

export type GoalsOfCareRow = typeof goalsOfCare.$inferSelect;
export type InsertGoalsOfCare = z.infer<typeof insertGoalsOfCareSchema>;
