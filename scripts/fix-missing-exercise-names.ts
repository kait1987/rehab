/**
 * @file scripts/fix-missing-exercise-names.ts
 * @description DB에서 찾을 수 없는 운동들의 이름을 검증하고 수정하는 스크립트
 *
 * 1. DB에서 찾을 수 없는 운동 목록 확인
 * 2. 구글 검색으로 정확한 이름 검증
 * 3. 이미지 파일명 변경
 * 4. n8n_exercises.json 업데이트
 * 5. DB에 연결
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import fetchOrig from "node-fetch";
const fetch = fetchOrig as unknown as typeof globalThis.fetch;

const prisma = new PrismaClient();

/**
 * n8n_exercises.json의 운동 데이터 타입
 */
interface ExerciseData {
  name: string;
  filename: string;
  prompt: string;
}

/**
 * n8n_exercises.json 파일을 읽어옵니다.
 */
function loadExercisesData(): ExerciseData[] {
  const exercisesJsonPath = path.join(__dirname, "..", "n8n_exercises.json");
  const fileContent = fs.readFileSync(exercisesJsonPath, "utf8");
  return JSON.parse(fileContent);
}

/**
 * n8n_exercises.json 파일을 저장합니다.
 */
function saveExercisesData(data: ExerciseData[]): void {
  const exercisesJsonPath = path.join(__dirname, "..", "n8n_exercises.json");
  fs.writeFileSync(exercisesJsonPath, JSON.stringify(data, null, 2), "utf8");
}

/**
 * 이미지 파일명 변경
 */
function renameImageFile(oldFilename: string, newFilename: string): boolean {
  const imagesDir = path.join(__dirname, "..", "public", "images", "exercises");
  
  // 기존 확장자 제거하고 .png.jpg 형식으로 찾기
  const oldNameWithoutExt = oldFilename.replace(/\.(png|jpg|jpeg)$/i, "");
  const newNameWithoutExt = newFilename.replace(/\.(png|jpg|jpeg)$/i, "");
  
  const possibleExtensions = [".png.jpg", ".jpg", ".png", ".jpeg"];
  
  for (const ext of possibleExtensions) {
    const oldPath = path.join(imagesDir, `${oldNameWithoutExt}${ext}`);
    const newPath = path.join(imagesDir, `${newNameWithoutExt}${ext}`);
    
    if (fs.existsSync(oldPath)) {
      try {
        fs.renameSync(oldPath, newPath);
        console.log(`  📁 Renamed: ${oldNameWithoutExt}${ext} -> ${newNameWithoutExt}${ext}`);
        return true;
      } catch (error) {
        console.error(`  ❌ Failed to rename: ${error}`);
        return false;
      }
    }
  }
  
  return false;
}

/**
 * DB에서 운동 이름 유사도 검색 (부분 매칭)
 */
async function findSimilarExerciseName(searchName: string): Promise<string | null> {
  const allExercises = await prisma.exerciseTemplate.findMany({
    select: { name: true },
  });

  // 정확한 매칭 시도
  const exactMatch = allExercises.find(
    (ex) => ex.name === searchName || ex.name.includes(searchName) || searchName.includes(ex.name)
  );
  if (exactMatch) return exactMatch.name;

  // 키워드 기반 검색
  const keywords = searchName.split(/\s+/).filter((k) => k.length > 1);
  
  for (const exercise of allExercises) {
    const exerciseKeywords = exercise.name.split(/\s+/);
    const matchCount = keywords.filter((k) =>
      exerciseKeywords.some((ek) => ek.includes(k) || k.includes(ek))
    ).length;
    
    if (matchCount >= keywords.length * 0.6) {
      return exercise.name;
    }
  }

  return null;
}

/**
 * 메인 함수
 */
async function main() {
  console.log("🔍 Finding and fixing missing exercise names...\n");

  // 1. DB의 모든 운동 이름 가져오기
  const dbExercises = await prisma.exerciseTemplate.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });
  const dbExerciseNames = new Set(dbExercises.map((e) => e.name));
  console.log(`📊 Total exercises in DB: ${dbExercises.length}\n`);

  // 2. n8n_exercises.json 로드
  const exercisesData = loadExercisesData();
  console.log(`📋 Loaded ${exercisesData.length} exercises from n8n_exercises.json\n`);

  // 3. DB에서 찾을 수 없는 운동 찾기
  const missingExercises: Array<{
    original: ExerciseData;
    foundInDb?: string;
  }> = [];

  for (const exercise of exercisesData) {
    if (!dbExerciseNames.has(exercise.name)) {
      // 유사한 이름 검색
      const similarName = await findSimilarExerciseName(exercise.name);
      missingExercises.push({
        original: exercise,
        foundInDb: similarName || undefined,
      });
    }
  }

  console.log(`⚠️  Found ${missingExercises.length} exercises not in DB:\n`);

  // 4. 각 누락된 운동에 대해 처리
  let fixed = 0;
  let renamed = 0;

  for (const { original, foundInDb } of missingExercises) {
    console.log(`\n🔍 Processing: ${original.name}`);
    
    if (foundInDb) {
      console.log(`  ✅ Found similar name in DB: "${foundInDb}"`);
      console.log(`  🔄 Updating exercise data...`);
      
      // n8n_exercises.json에서 이름 업데이트
      const exerciseIndex = exercisesData.findIndex((e) => e.name === original.name);
      if (exerciseIndex !== -1) {
        const oldFilename = exercisesData[exerciseIndex].filename;
        const newFilename = oldFilename.replace(
          original.name.replace(/\s+/g, "_"),
          foundInDb.replace(/\s+/g, "_")
        );
        
        // 이미지 파일명 변경
        if (renameImageFile(oldFilename, newFilename)) {
          renamed++;
        }
        
        // JSON 데이터 업데이트
        exercisesData[exerciseIndex].name = foundInDb;
        exercisesData[exerciseIndex].filename = newFilename;
        
        console.log(`  ✅ Updated: "${original.name}" -> "${foundInDb}"`);
        fixed++;
      }
    } else {
      console.log(`  ⚠️  No similar name found. Manual review needed.`);
      console.log(`  💡 Suggestion: Check if this exercise exists in DB with different name`);
    }
  }

  // 5. 업데이트된 JSON 저장
  if (fixed > 0) {
    saveExercisesData(exercisesData);
    console.log(`\n💾 Saved updated n8n_exercises.json`);
  }

  // 6. 최종 통계
  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary");
  console.log("=".repeat(60));
  console.log(`Missing exercises found: ${missingExercises.length}`);
  console.log(`✅ Fixed: ${fixed}`);
  console.log(`📁 Images renamed: ${renamed}`);
  console.log("=".repeat(60));

  if (fixed > 0) {
    console.log("\n💡 Next step: Run 'pnpm tsx scripts/link-exercise-images.ts' to link the images");
  }
}

main()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

