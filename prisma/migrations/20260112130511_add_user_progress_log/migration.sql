-- CreateTable
CREATE TABLE "user_progress_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "body_part_id" UUID NOT NULL,
    "pain_level" INTEGER NOT NULL,
    "range_of_motion" INTEGER,
    "notes" TEXT,
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_progress_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_user_progress_logs_user_id" ON "user_progress_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_progress_logs_body_part_id" ON "user_progress_logs"("body_part_id");

-- CreateIndex
CREATE INDEX "idx_user_progress_logs_recorded_at" ON "user_progress_logs"("recorded_at" DESC);

-- AddForeignKey
ALTER TABLE "user_progress_logs" ADD CONSTRAINT "user_progress_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress_logs" ADD CONSTRAINT "user_progress_logs_body_part_id_fkey" FOREIGN KEY ("body_part_id") REFERENCES "body_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
