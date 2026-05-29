CREATE TABLE "family_update_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"recipient_count" integer NOT NULL,
	"preview" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "family_update_log_user_id_idx" ON "family_update_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "family_update_log_user_sent_at_idx" ON "family_update_log" USING btree ("user_id","sent_at");