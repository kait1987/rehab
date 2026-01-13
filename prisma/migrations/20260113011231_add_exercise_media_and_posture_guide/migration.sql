-- CreateTable
CREATE TABLE "exercise_media" (
    "id" UUID NOT NULL,
    "exercise_template_id" UUID NOT NULL,
    "media_type" VARCHAR(20) NOT NULL,
    "purpose" VARCHAR(30) NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posture_guides" (
    "id" UUID NOT NULL,
    "exercise_template_id" UUID NOT NULL,
    "step_number" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "common_mistake" TEXT,
    "correction" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posture_guides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_exercise_media_template_purpose" ON "exercise_media"("exercise_template_id", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "posture_guides_unique" ON "posture_guides"("exercise_template_id", "step_number");

-- AddForeignKey
ALTER TABLE "exercise_media" ADD CONSTRAINT "exercise_media_exercise_template_id_fkey" FOREIGN KEY ("exercise_template_id") REFERENCES "exercise_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posture_guides" ADD CONSTRAINT "posture_guides_exercise_template_id_fkey" FOREIGN KEY ("exercise_template_id") REFERENCES "exercise_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
