import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const livingProfiles = pgTable("living_profiles", {
  userId: text("user_id").primaryKey(),
  profile: text("profile").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertLivingProfileSchema = createInsertSchema(livingProfiles).omit({
  updatedAt: true,
});

export type LivingProfile = typeof livingProfiles.$inferSelect;
export type InsertLivingProfile = z.infer<typeof insertLivingProfileSchema>;
