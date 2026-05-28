ALTER TABLE "conversations" ADD COLUMN "user_id" text;--> statement-breakpoint
CREATE INDEX "conversations_user_id_idx" ON "conversations" USING btree ("user_id");