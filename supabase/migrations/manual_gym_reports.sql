-- ============================================================
-- Manual Migration for Gym Reports
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Create gym_reports table
CREATE TABLE IF NOT EXISTS "public"."gym_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
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

    CONSTRAINT "gym_reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "gym_reports_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gym_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 2. Create Indexes
CREATE INDEX IF NOT EXISTS "idx_gym_reports_gym_id" ON "public"."gym_reports"("gym_id");
CREATE INDEX IF NOT EXISTS "idx_gym_reports_status" ON "public"."gym_reports"("status");
CREATE INDEX IF NOT EXISTS "idx_gym_reports_created_at" ON "public"."gym_reports"("created_at");

-- 3. Enable RLS
ALTER TABLE "public"."gym_reports" ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- Allow users to insert their own reports
CREATE POLICY "Users can insert their own reports"
ON "public"."gym_reports"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own reports
CREATE POLICY "Users can view their own reports"
ON "public"."gym_reports"
FOR SELECT
USING (auth.uid() = user_id);

-- 5. Grant Permissions
GRANT ALL ON TABLE "public"."gym_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."gym_reports" TO "service_role";
