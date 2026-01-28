-- AlterTable
ALTER TABLE "exercise_templates" ADD COLUMN     "english_name" TEXT,
ADD COLUMN     "gif_url" TEXT,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "video_url" TEXT;

-- AlterTable
ALTER TABLE "user_fitness_profiles" ADD COLUMN     "current_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_workout_date" TIMESTAMPTZ,
ADD COLUMN     "longest_streak" INTEGER NOT NULL DEFAULT 0;
