-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "clerk_id" TEXT,
    "email" TEXT,
    "name" TEXT,
    "display_name" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gyms" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "price_range" VARCHAR(20),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "facility_info_count" INTEGER NOT NULL DEFAULT 0,
    "last_updated_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gym_facilities" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "is_quiet" BOOLEAN NOT NULL DEFAULT false,
    "has_rehab_equipment" BOOLEAN NOT NULL DEFAULT false,
    "has_pt_coach" BOOLEAN NOT NULL DEFAULT false,
    "has_shower" BOOLEAN NOT NULL DEFAULT false,
    "has_parking" BOOLEAN NOT NULL DEFAULT false,
    "has_locker" BOOLEAN NOT NULL DEFAULT false,
    "has_water_dispenser" BOOLEAN NOT NULL DEFAULT false,
    "has_air_conditioning" BOOLEAN NOT NULL DEFAULT false,
    "other_facilities" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gym_facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gym_operating_hours" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "open_time" TEXT,
    "close_time" TEXT,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gym_operating_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gym_crowd_levels" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "time_slot" VARCHAR(20) NOT NULL,
    "day_of_week" INTEGER,
    "crowd_level" VARCHAR(20) NOT NULL,
    "source" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "reported_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gym_crowd_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_tags" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" VARCHAR(50),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "user_id" UUID,
    "comment" TEXT,
    "is_admin_review" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_tag_mappings" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "review_tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_tag_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_parts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "body_part_id" UUID NOT NULL,
    "intensity_level" INTEGER,
    "duration_minutes" INTEGER,
    "reps" INTEGER,
    "sets" INTEGER,
    "rest_seconds" INTEGER,
    "difficulty_score" INTEGER,
    "contraindications" TEXT[],
    "instructions" TEXT,
    "precautions" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_equipment_mappings" (
    "id" UUID NOT NULL,
    "exercise_template_id" UUID NOT NULL,
    "equipment_type_id" UUID NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_equipment_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_part_exercise_mappings" (
    "id" UUID NOT NULL,
    "body_part_id" UUID NOT NULL,
    "exercise_template_id" UUID NOT NULL,
    "priority" INTEGER NOT NULL,
    "intensity_level" INTEGER,
    "pain_level_range" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_part_exercise_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_part_contraindications" (
    "id" UUID NOT NULL,
    "body_part_id" UUID NOT NULL,
    "exercise_template_id" UUID NOT NULL,
    "pain_level_min" INTEGER,
    "reason" TEXT,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'warning',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_part_contraindications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "total_duration_minutes" INTEGER NOT NULL,
    "pain_level" INTEGER,
    "experience_level" VARCHAR(20),
    "body_parts" TEXT[],
    "equipment_available" TEXT[],
    "course_type" VARCHAR(20) NOT NULL DEFAULT 'warmup_main_cooldown',
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_exercises" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "exercise_template_id" UUID NOT NULL,
    "section" TEXT NOT NULL,
    "order_in_section" INTEGER NOT NULL,
    "duration_minutes" INTEGER,
    "reps" INTEGER,
    "sets" INTEGER,
    "rest_seconds" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_pain_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "body_part_id" UUID NOT NULL,
    "pain_level" INTEGER,
    "experience_level" VARCHAR(20),
    "equipment_available" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pain_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_course_history" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "course_id" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ,
    "saved_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_course_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorites" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "gym_id" UUID NOT NULL,
    "saved_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "anonymous_id" TEXT,
    "event_name" VARCHAR(100) NOT NULL,
    "event_data" JSONB,
    "event_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_clerk_id" ON "users"("clerk_id");

-- CreateIndex
CREATE INDEX "idx_users_is_active" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "idx_users_is_admin" ON "users"("is_admin");

-- CreateIndex
CREATE INDEX "idx_gyms_location" ON "gyms"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "idx_gyms_is_active" ON "gyms"("is_active");

-- CreateIndex
CREATE INDEX "idx_gyms_price_range" ON "gyms"("price_range");

-- CreateIndex
CREATE UNIQUE INDEX "gym_facilities_gym_id_key" ON "gym_facilities"("gym_id");

-- CreateIndex
CREATE INDEX "idx_gym_facilities_gym_id" ON "gym_facilities"("gym_id");

-- CreateIndex
CREATE INDEX "idx_gym_facilities_is_quiet" ON "gym_facilities"("is_quiet");

-- CreateIndex
CREATE INDEX "idx_gym_facilities_has_rehab_equipment" ON "gym_facilities"("has_rehab_equipment");

-- CreateIndex
CREATE INDEX "idx_gym_facilities_has_pt_coach" ON "gym_facilities"("has_pt_coach");

-- CreateIndex
CREATE INDEX "idx_gym_operating_hours_gym_id" ON "gym_operating_hours"("gym_id");

-- CreateIndex
CREATE INDEX "idx_gym_operating_hours_day_of_week" ON "gym_operating_hours"("day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "gym_operating_hours_unique" ON "gym_operating_hours"("gym_id", "day_of_week");

-- CreateIndex
CREATE INDEX "idx_gym_crowd_levels_gym_id" ON "gym_crowd_levels"("gym_id");

-- CreateIndex
CREATE INDEX "idx_gym_crowd_levels_time_slot" ON "gym_crowd_levels"("time_slot");

-- CreateIndex
CREATE INDEX "idx_gym_crowd_levels_crowd_level" ON "gym_crowd_levels"("crowd_level");

-- CreateIndex
CREATE UNIQUE INDEX "review_tags_name_key" ON "review_tags"("name");

-- CreateIndex
CREATE INDEX "idx_review_tags_category" ON "review_tags"("category");

-- CreateIndex
CREATE INDEX "idx_review_tags_display_order" ON "review_tags"("display_order");

-- CreateIndex
CREATE INDEX "idx_reviews_gym_id" ON "reviews"("gym_id");

-- CreateIndex
CREATE INDEX "idx_reviews_user_id" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "idx_reviews_is_deleted" ON "reviews"("is_deleted");

-- CreateIndex
CREATE INDEX "idx_reviews_is_admin_review" ON "reviews"("is_admin_review");

-- CreateIndex
CREATE INDEX "idx_reviews_created_at" ON "reviews"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_review_tag_mappings_review_id" ON "review_tag_mappings"("review_id");

-- CreateIndex
CREATE INDEX "idx_review_tag_mappings_review_tag_id" ON "review_tag_mappings"("review_tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_tag_mappings_unique" ON "review_tag_mappings"("review_id", "review_tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "body_parts_name_key" ON "body_parts"("name");

-- CreateIndex
CREATE INDEX "idx_body_parts_display_order" ON "body_parts"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_types_name_key" ON "equipment_types"("name");

-- CreateIndex
CREATE INDEX "idx_equipment_types_display_order" ON "equipment_types"("display_order");

-- CreateIndex
CREATE INDEX "idx_exercise_templates_body_part_id" ON "exercise_templates"("body_part_id");

-- CreateIndex
CREATE INDEX "idx_exercise_templates_intensity_level" ON "exercise_templates"("intensity_level");

-- CreateIndex
CREATE INDEX "idx_exercise_templates_is_active" ON "exercise_templates"("is_active");

-- CreateIndex
CREATE INDEX "idx_exercise_equipment_mappings_exercise_template_id" ON "exercise_equipment_mappings"("exercise_template_id");

-- CreateIndex
CREATE INDEX "idx_exercise_equipment_mappings_equipment_type_id" ON "exercise_equipment_mappings"("equipment_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_equipment_mappings_unique" ON "exercise_equipment_mappings"("exercise_template_id", "equipment_type_id");

-- CreateIndex
CREATE INDEX "idx_body_part_exercise_mappings_body_part_id" ON "body_part_exercise_mappings"("body_part_id");

-- CreateIndex
CREATE INDEX "idx_body_part_exercise_mappings_exercise_template_id" ON "body_part_exercise_mappings"("exercise_template_id");

-- CreateIndex
CREATE INDEX "idx_body_part_exercise_mappings_priority" ON "body_part_exercise_mappings"("priority");

-- CreateIndex
CREATE INDEX "idx_body_part_exercise_mappings_pain_level_range" ON "body_part_exercise_mappings"("pain_level_range");

-- CreateIndex
CREATE UNIQUE INDEX "body_part_exercise_mappings_unique" ON "body_part_exercise_mappings"("body_part_id", "exercise_template_id", "pain_level_range");

-- CreateIndex
CREATE INDEX "idx_body_part_contraindications_body_part_id" ON "body_part_contraindications"("body_part_id");

-- CreateIndex
CREATE INDEX "idx_body_part_contraindications_exercise_template_id" ON "body_part_contraindications"("exercise_template_id");

-- CreateIndex
CREATE INDEX "idx_body_part_contraindications_pain_level_min" ON "body_part_contraindications"("pain_level_min");

-- CreateIndex
CREATE UNIQUE INDEX "body_part_contraindications_unique" ON "body_part_contraindications"("body_part_id", "exercise_template_id", "pain_level_min");

-- CreateIndex
CREATE INDEX "idx_courses_user_id" ON "courses"("user_id");

-- CreateIndex
CREATE INDEX "idx_courses_pain_level" ON "courses"("pain_level");

-- CreateIndex
CREATE INDEX "idx_courses_is_template" ON "courses"("is_template");

-- CreateIndex
CREATE INDEX "idx_courses_created_at" ON "courses"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_course_exercises_course_id" ON "course_exercises"("course_id");

-- CreateIndex
CREATE INDEX "idx_course_exercises_exercise_template_id" ON "course_exercises"("exercise_template_id");

-- CreateIndex
CREATE INDEX "idx_course_exercises_section" ON "course_exercises"("section", "order_in_section");

-- CreateIndex
CREATE INDEX "idx_user_pain_profiles_user_id" ON "user_pain_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_pain_profiles_body_part_id" ON "user_pain_profiles"("body_part_id");

-- CreateIndex
CREATE INDEX "idx_user_course_history_user_id" ON "user_course_history"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_course_history_course_id" ON "user_course_history"("course_id");

-- CreateIndex
CREATE INDEX "idx_user_course_history_saved_at" ON "user_course_history"("saved_at" DESC);

-- CreateIndex
CREATE INDEX "idx_user_course_history_is_favorite" ON "user_course_history"("is_favorite");

-- CreateIndex
CREATE INDEX "idx_user_favorites_user_id" ON "user_favorites"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_favorites_gym_id" ON "user_favorites"("gym_id");

-- CreateIndex
CREATE INDEX "idx_user_favorites_saved_at" ON "user_favorites"("saved_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_favorites_unique" ON "user_favorites"("user_id", "gym_id");

-- CreateIndex
CREATE INDEX "idx_events_user_id" ON "events"("user_id");

-- CreateIndex
CREATE INDEX "idx_events_anonymous_id" ON "events"("anonymous_id");

-- CreateIndex
CREATE INDEX "idx_events_event_name" ON "events"("event_name");

-- CreateIndex
CREATE INDEX "idx_events_event_time" ON "events"("event_time" DESC);

-- AddForeignKey
ALTER TABLE "gym_facilities" ADD CONSTRAINT "gym_facilities_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_operating_hours" ADD CONSTRAINT "gym_operating_hours_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_crowd_levels" ADD CONSTRAINT "gym_crowd_levels_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_tag_mappings" ADD CONSTRAINT "review_tag_mappings_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_tag_mappings" ADD CONSTRAINT "review_tag_mappings_review_tag_id_fkey" FOREIGN KEY ("review_tag_id") REFERENCES "review_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_templates" ADD CONSTRAINT "exercise_templates_body_part_id_fkey" FOREIGN KEY ("body_part_id") REFERENCES "body_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_equipment_mappings" ADD CONSTRAINT "exercise_equipment_mappings_exercise_template_id_fkey" FOREIGN KEY ("exercise_template_id") REFERENCES "exercise_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_equipment_mappings" ADD CONSTRAINT "exercise_equipment_mappings_equipment_type_id_fkey" FOREIGN KEY ("equipment_type_id") REFERENCES "equipment_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_part_exercise_mappings" ADD CONSTRAINT "body_part_exercise_mappings_body_part_id_fkey" FOREIGN KEY ("body_part_id") REFERENCES "body_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_part_exercise_mappings" ADD CONSTRAINT "body_part_exercise_mappings_exercise_template_id_fkey" FOREIGN KEY ("exercise_template_id") REFERENCES "exercise_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_part_contraindications" ADD CONSTRAINT "body_part_contraindications_body_part_id_fkey" FOREIGN KEY ("body_part_id") REFERENCES "body_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_part_contraindications" ADD CONSTRAINT "body_part_contraindications_exercise_template_id_fkey" FOREIGN KEY ("exercise_template_id") REFERENCES "exercise_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_exercises" ADD CONSTRAINT "course_exercises_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_exercises" ADD CONSTRAINT "course_exercises_exercise_template_id_fkey" FOREIGN KEY ("exercise_template_id") REFERENCES "exercise_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pain_profiles" ADD CONSTRAINT "user_pain_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pain_profiles" ADD CONSTRAINT "user_pain_profiles_body_part_id_fkey" FOREIGN KEY ("body_part_id") REFERENCES "body_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_course_history" ADD CONSTRAINT "user_course_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_course_history" ADD CONSTRAINT "user_course_history_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
