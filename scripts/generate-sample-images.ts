/**
 * @file scripts/generate-sample-images.ts
 * @description 샘플 이미지 생성 스크립트 (검증용)
 * 
 * 대표적인 운동 5개만 생성하여 프롬프트 개선 효과를 검증합니다.
 */

import * as fs from "fs";
import * as path from "path";
import {
  generateImageWithPollinations,
  saveImageToFile,
  wait,
} from "./utils/pollinations-image";

interface ExerciseData {
  name: string;
  filename: string;
  prompt: string;
}

/**
 * 샘플로 생성할 운동 이름 목록
 */
const SAMPLE_EXERCISES = [
  "캣 카우 스트레칭",  // 참고 이미지
  "플랭크",
  "스쿼트",
  "브릿지 (힙 레이즈)",
  "버드독",
];

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

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in n8n_exercises.json: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 샘플 운동만 필터링합니다.
 */
function filterSampleExercises(exercises: ExerciseData[]): ExerciseData[] {
  return exercises.filter(ex => SAMPLE_EXERCISES.includes(ex.name));
}

/**
 * 이미지 생성 및 저장
 */
async function generateAndSaveImage(
  exercise: ExerciseData
): Promise<boolean> {
  const imagePathBase = path.join(
    __dirname,
    "..",
    "public",
    "images",
    "exercises",
    exercise.filename.split(".")[0]
  );

  try {
    console.log(`\n🎨 Generating: ${exercise.name}`);
    console.log(`   Prompt: ${exercise.prompt.substring(0, 100)}...`);
    
    const { buffer, mimeType } = await generateImageWithPollinations(
      exercise.prompt,
      exercise.filename
    );
    
    saveImageToFile(buffer, imagePathBase, mimeType);
    
    const finalPath = `${imagePathBase}.${mimeType.split('/')[1]}`;
    console.log(`   ✅ Saved: ${path.basename(finalPath)}`);
    console.log(`   📁 Path: ${finalPath}`);
    
    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`   ❌ Failed: ${errorMessage}`);
    return false;
  }
}

/**
 * 메인 함수
 */
async function main() {
  console.log("🎨 Generating Sample Images for Verification...\n");
  console.log("ℹ️  This will generate 5 sample images to verify the improved prompts.\n");

  // 1. 운동 데이터 로드
  let allExercises: ExerciseData[];
  try {
    allExercises = loadExercisesData();
    console.log(`📋 Loaded ${allExercises.length} exercises from n8n_exercises.json\n`);
  } catch (error) {
    console.error("❌ Error loading exercises data:", error);
    process.exit(1);
  }

  // 2. 샘플 운동 필터링
  const sampleExercises = filterSampleExercises(allExercises);
  
  if (sampleExercises.length === 0) {
    console.error("❌ No sample exercises found in the data!");
    console.error(`   Looking for: ${SAMPLE_EXERCISES.join(", ")}`);
    process.exit(1);
  }

  console.log(`📋 Sample exercises to generate (${sampleExercises.length}):`);
  sampleExercises.forEach((ex, idx) => {
    console.log(`   ${idx + 1}. ${ex.name}`);
  });
  console.log("");

  // 3. 출력 디렉토리 확인
  const outputDir = path.join(__dirname, "..", "public", "images", "exercises");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}\n`);
  }

  // 4. 이미지 생성
  console.log("🚀 Starting image generation...\n");
  console.log("⏳ Note: Pollinations.ai may take 5-10 seconds per image.\n");

  const results: Array<{ exercise: ExerciseData; success: boolean; path?: string }> = [];

  for (let i = 0; i < sampleExercises.length; i++) {
    const exercise = sampleExercises[i];
    
    const success = await generateAndSaveImage(exercise);
    results.push({ exercise, success });
    
    // 마지막이 아니면 대기
    if (i < sampleExercises.length - 1) {
      await wait(2000); // 2초 대기
    }
  }

  // 5. 결과 요약
  console.log("\n" + "=".repeat(60));
  console.log("📊 Generation Summary");
  console.log("=".repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully generated: ${successful.length}/${sampleExercises.length}`);
  
  if (successful.length > 0) {
    console.log("\n📁 Generated images:");
    successful.forEach((r, idx) => {
      const imagePath = path.join(
        __dirname,
        "..",
        "public",
        "images",
        "exercises",
        r.exercise.filename.split(".")[0] + ".png.jpg"
      );
      console.log(`   ${idx + 1}. ${r.exercise.name}`);
      console.log(`      ${imagePath}`);
    });
  }
  
  if (failed.length > 0) {
    console.log("\n❌ Failed images:");
    failed.forEach(r => {
      console.log(`   - ${r.exercise.name}`);
    });
  }
  
  console.log("=".repeat(60));
  console.log("\n💡 Please review the generated images above.");
  console.log("   If they look good, we can proceed with generating all images.");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

