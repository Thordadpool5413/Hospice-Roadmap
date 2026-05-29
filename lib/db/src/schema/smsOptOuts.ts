import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const smsOptOuts = pgTable("sms_opt_outs", {
  phone: text("phone").notNull().primaryKey(),
  optedOutAt: timestamp("opted_out_at", { withTimezone: true }).notNull(),
});

export type SmsOptOut = typeof smsOptOuts.$inferSelect;
