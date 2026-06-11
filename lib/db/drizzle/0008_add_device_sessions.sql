CREATE TABLE "device_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"device_id" text NOT NULL,
	"clerk_session_id" text NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "device_sessions_user_device_idx" ON "device_sessions" USING btree ("user_id","device_id");--> statement-breakpoint
CREATE INDEX "device_sessions_user_id_idx" ON "device_sessions" USING btree ("user_id");