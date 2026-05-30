import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { GOC_FIELDS, type GoalsOfCareField } from "@workspace/goc-merge";
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

const DNR_STATUS_ENUM = ["dnr", "full-code", "unknown", "not-discussed"] as const;

/**
 * Zod schema for the GoC JSONB content blob.
 *
 * Field entries are derived programmatically from GOC_FIELDS so that adding
 * a new field to GOC_FIELDS automatically includes it here without a manual
 * edit. `dnrStatus` retains its enum constraint; all other fields are optional
 * strings.
 *
 * `updatedAt` is the document-level ISO timestamp written by the mobile client.
 * `fieldUpdatedAt` is a per-field ISO timestamp map written by mergeGoalsOfCare.
 *
 * Using z.object() (not passthrough) means any extra keys are stripped on
 * parse, keeping the stored JSONB tidy even if a future client sends new
 * fields before the server schema is updated.
 */
const gocFieldShape = GOC_FIELDS.reduce<Record<GoalsOfCareField, z.ZodTypeAny>>(
  (shape, field) => {
    shape[field] =
      field === "dnrStatus"
        ? z.enum(DNR_STATUS_ENUM).optional()
        : z.string().optional();
    return shape;
  },
  {} as Record<GoalsOfCareField, z.ZodTypeAny>,
);

export const gocContentSchema = z.object({
  ...gocFieldShape,
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
