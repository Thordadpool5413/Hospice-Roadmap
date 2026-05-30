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
