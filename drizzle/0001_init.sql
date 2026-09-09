-- mmscheduler initial schema: courses -> occurrences -> activities.
--> statement-breakpoint
CREATE TABLE "courses" (
	"course_id" text PRIMARY KEY NOT NULL,
	"module" text,
	"credits" integer,
	"year_period" text,
	"overall_target_student" integer,
	"level" text,
	"faculty" text,
	"continuous_assessment_weightage" text,
	"exam_duration" integer,
	"level_code" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occurrences" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"occurrence_no" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "occurrences_course_occ_uq" ON "occurrences" USING btree ("course_id","occurrence_no");
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"occurrence_id" integer NOT NULL,
	"title" text,
	"day" text,
	"room" text,
	"begin_time" text,
	"end_time" text,
	"tutor" text,
	"start_date" text,
	"end_date" text
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_occurrence_id_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."occurrences"("id") ON DELETE cascade ON UPDATE no action;
