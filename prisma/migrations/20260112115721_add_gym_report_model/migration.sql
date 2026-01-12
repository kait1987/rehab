-- AlterTable
ALTER TABLE "body_part_contraindications" ADD COLUMN     "condition" VARCHAR(50),
ADD COLUMN     "pain_level_max" INTEGER;

-- AlterTable
ALTER TABLE "body_parts" ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "parent_id" UUID,
ADD COLUMN     "synonyms" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "user_fitness_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "fitness_level" INTEGER NOT NULL DEFAULT 2,
    "rehab_phase" TEXT NOT NULL DEFAULT 'initial',
    "last_assessment" TIMESTAMPTZ,
    "avg_completion_rate" DOUBLE PRECISION,
    "avg_pain_reduction" DOUBLE PRECISION,
    "total_courses_completed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_fitness_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gym_reports" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "user_id" UUID,
    "report_type" VARCHAR(30) NOT NULL,
    "field_name" VARCHAR(50),
    "current_value" TEXT,
    "suggested_value" TEXT,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "review_note" TEXT,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gym_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_fitness_profiles_user_id_key" ON "user_fitness_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_fitness_profiles_fitness_level" ON "user_fitness_profiles"("fitness_level");

-- CreateIndex
CREATE INDEX "idx_user_fitness_profiles_rehab_phase" ON "user_fitness_profiles"("rehab_phase");

-- CreateIndex
CREATE INDEX "idx_gym_reports_gym_id" ON "gym_reports"("gym_id");

-- CreateIndex
CREATE INDEX "idx_gym_reports_status" ON "gym_reports"("status");

-- CreateIndex
CREATE INDEX "idx_gym_reports_created_at" ON "gym_reports"("created_at");

-- CreateIndex
CREATE INDEX "idx_body_parts_parent_id" ON "body_parts"("parent_id");

-- AddForeignKey
ALTER TABLE "user_fitness_profiles" ADD CONSTRAINT "user_fitness_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_reports" ADD CONSTRAINT "gym_reports_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_reports" ADD CONSTRAINT "gym_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_parts" ADD CONSTRAINT "body_parts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "body_parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
