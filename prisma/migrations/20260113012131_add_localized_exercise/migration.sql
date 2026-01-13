-- CreateTable
CREATE TABLE "localized_exercises" (
    "id" UUID NOT NULL,
    "exercise_template_id" UUID NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "precautions" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "localized_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_localized_exercises_locale" ON "localized_exercises"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "localized_exercises_unique" ON "localized_exercises"("exercise_template_id", "locale");

-- AddForeignKey
ALTER TABLE "localized_exercises" ADD CONSTRAINT "localized_exercises_exercise_template_id_fkey" FOREIGN KEY ("exercise_template_id") REFERENCES "exercise_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
