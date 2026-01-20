/**
 * @file scripts/generate-images-pollinations-from-json.ts
 * @description n8n_exercises.json의 프롬프트를 사용하여 Pollinations.ai로 운동 이미지 생성
 *
 * 이 스크립트는 n8n_exercises.json 파일에 작성된 상세한 프롬프트를 사용하여
 * Pollinations.ai를 통해 운동 이미지를 생성하고 public/images/exercises/ 폴더에 저장합니다.
 *
 * 사용법:
 *   pnpm tsx scripts/generate-images-pollinations-from-json.ts
 *
 * @dependencies
 * - n8n_exercises.json: 운동 프롬프트 데이터 파일
 * - Pollinations.ai: 무료 AI 이미지 생성 서비스 (API 키 불필요)
 */

import * as fs from "fs";
import * as path from "path";
import {
  generateSeedFromFilename,
  generateAndSaveImageWithPollinations,
  wait,
} from "./utils/pollinations-image";

/**
 * 운동 데이터 타입
 */
interface ExerciseData {
  name: string;
  filename: string;
  prompt: string;
}

/**
 * 진행 상황 통계
 */
interface ProgressStats {
  total: number;
  completed: number;
  failed: number;
  skipped: number;
}

/**
 * n8n_exercises.json 파일을 읽어옵니다.
 */
function loadExercisesData(): ExerciseData[] {
  const exercisesJsonPath = path.join(
    __dirname,
    "..",
    "n8n_exercises.json"
  );

  if (!fs.existsSync(exercisesJsonPath)) {
    throw new Error(
      `n8n_exercises.json not found at ${exercisesJsonPath}`
    );
  }

  try {
    const fileContent = fs.readFileSync(exercisesJsonPath, "utf8");
    const data: ExerciseData[] = JSON.parse(fileContent);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("n8n_exercises.json must contain a non-empty array");
    }

    // Validate structure
    for (const ex of data) {
      if (!ex.name || !ex.filename || !ex.prompt) {
        throw new Error(
          "Each exercise must have name, filename, and prompt fields"
        );
      }
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in n8n_exercises.json: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 이미지가 이미 존재하는지 확인합니다.
 */
function imageExists(filename: string): boolean {
  const imagePath = path.join(
    __dirname,
    "..",
    "public",
    "images",
    "exercises",
    filename
  );
  return fs.existsSync(imagePath);
}

/**
 * 이미지를 생성하고 저장합니다.
 */
async function generateAndSaveImage(
  exercise: ExerciseData,
  stats: ProgressStats
): Promise<boolean> {
  const imagePath = path.join(
    __dirname,
    "..",
    "public",
    "images",
    "exercises",
    exercise.filename
  );

  try {
    // 파일명 기반으로 고정된 seed 생성 (일관된 이미지 보장)
    const seed = generateSeedFromFilename(exercise.filename);

    // Generate and save image
    await generateAndSaveImageWithPollinations(
      exercise.prompt,
      imagePath,
      seed
    );

    stats.completed++;
    console.log(
      `✅ [${stats.completed}/${stats.total}] ${exercise.name} -> ${exercise.filename}`
    );

    return true;
  } catch (error) {
    stats.failed++;
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(
      `❌ [${stats.failed} failed] ${exercise.name}: ${errorMessage}`
    );
    return false;
  }
}

/**
 * 진행률을 표시합니다.
 */
function displayProgress(stats: ProgressStats): void {
  const percentage = ((stats.completed / stats.total) * 100).toFixed(1);
  console.log(
    `\n📊 Progress: ${stats.completed}/${stats.total} (${percentage}%) | ` +
      `Failed: ${stats.failed} | Skipped: ${stats.skipped}`
  );
}

/**
 * 메인 함수
 */
async function main() {
  console.log("🎨 Starting Pollinations.ai Image Generation...\n");

  // Load exercises data
  let exercises: ExerciseData[];
  try {
    exercises = loadExercisesData();
    console.log(`📋 Loaded ${exercises.length} exercises from n8n_exercises.json\n`);
  } catch (error) {
    console.error("❌ Error loading exercises data:", error);
    process.exit(1);
  }

  // Initialize stats
  const stats: ProgressStats = {
    total: exercises.length,
    completed: 0,
    failed: 0,
    skipped: 0,
  };

  // Ensure output directory exists
  const outputDir = path.join(__dirname, "..", "public", "images", "exercises");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}\n`);
  }

  // Process each exercise
  console.log("🚀 Starting image generation...\n");
  console.log("⏳ Note: Pollinations.ai image generation may take 5-10 seconds per image.\n");

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];

    // Skip if image already exists
    if (imageExists(exercise.filename)) {
      stats.skipped++;
      console.log(
        `⏭️  [${i + 1}/${stats.total}] ${exercise.name} -> Already exists, skipping`
      );
      continue;
    }

    // Generate and save image
    await generateAndSaveImage(exercise, stats);

    // Rate limiting: wait 1 second between requests (except for the last one)
    // Pollinations.ai는 무료이지만 서버 부하를 방지하기 위해 대기
    if (i < exercises.length - 1) {
      await wait(1000);
    }

    // Display progress every 10 items
    if ((i + 1) % 10 === 0) {
      displayProgress(stats);
    }
  }

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Final Summary");
  console.log("=".repeat(60));
  console.log(`Total exercises:     ${stats.total}`);
  console.log(`✅ Successfully generated: ${stats.completed}`);
  console.log(`⏭️  Skipped (already exist): ${stats.skipped}`);
  console.log(`❌ Failed:                 ${stats.failed}`);
  console.log(
    `📈 Success rate:          ${((stats.completed / stats.total) * 100).toFixed(1)}%`
  );
  console.log("=".repeat(60));

  if (stats.failed > 0) {
    console.log(
      "\n⚠️  Some images failed to generate. Check the error messages above."
    );
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

