-- CreateTable
CREATE TABLE "wearable_data" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "source" VARCHAR(30) NOT NULL,
    "data_type" VARCHAR(30) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" VARCHAR(20),
    "recorded_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wearable_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_wearable_data_user_type_date" ON "wearable_data"("user_id", "data_type", "recorded_at");

-- CreateIndex
CREATE INDEX "idx_wearable_data_user_id" ON "wearable_data"("user_id");

-- AddForeignKey
ALTER TABLE "wearable_data" ADD CONSTRAINT "wearable_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
