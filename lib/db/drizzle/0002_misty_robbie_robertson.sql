CREATE TABLE "symptom_entries" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"pain" integer NOT NULL,
	"breathlessness" integer NOT NULL,
	"nausea" integer NOT NULL,
	"agitation" integer NOT NULL,
	"restlessness" boolean DEFAULT false NOT NULL,
	"appetite" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "symptom_entries_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"date" text NOT NULL,
	"timestamp" integer NOT NULL,
	"mood_level" integer,
	"tags" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journal_entries_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "goals_of_care" (
	"user_id" text PRIMARY KEY NOT NULL,
	"content" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "living_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"profile" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_reminders" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"datetime" text NOT NULL,
	"recurrence" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sync_reminders_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE INDEX "symptom_entries_user_id_idx" ON "symptom_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "symptom_entries_user_date_idx" ON "symptom_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "journal_entries_user_id_idx" ON "journal_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "journal_entries_user_date_idx" ON "journal_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "sync_reminders_user_id_idx" ON "sync_reminders" USING btree ("user_id");