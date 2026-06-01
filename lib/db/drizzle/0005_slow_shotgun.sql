CREATE TABLE "caregiver_wellness" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"timestamp" bigint NOT NULL,
	"mood" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "caregiver_wellness_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "caregiver_wellness_user_id_idx" ON "caregiver_wellness" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "caregiver_wellness_user_date_idx" ON "caregiver_wellness" USING btree ("user_id","date");