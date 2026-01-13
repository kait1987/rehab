-- CreateTable
CREATE TABLE "course_completion_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "exercise_template_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "actual_duration" INTEGER,
    "user_rating" INTEGER,
    "pain_after" INTEGER,
    "notes" TEXT,
    "completed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_completion_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_course_completion_logs_user_date" ON "course_completion_logs"("user_id", "completed_at");

-- CreateIndex
CREATE INDEX "idx_course_completion_logs_course_id" ON "course_completion_logs"("course_id");

-- CreateIndex
CREATE INDEX "idx_course_completion_logs_exercise_id" ON "course_completion_logs"("exercise_template_id");

-- AddForeignKey
ALTER TABLE "course_completion_logs" ADD CONSTRAINT "course_completion_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_completion_logs" ADD CONSTRAINT "course_completion_logs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_completion_logs" ADD CONSTRAINT "course_completion_logs_exercise_template_id_fkey" FOREIGN KEY ("exercise_template_id") REFERENCES "exercise_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
