/**
 * @file scripts/fix-all-missing-exercises.ts
 * @description DB에 없는 운동들의 이름을 검증하고 수정한 후 이미지 매칭
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ExerciseData {
  name: string;
  filename: string;
  prompt: string;
}

/**
 * 구글 검색 결과를 바탕으로 한 운동 이름 매핑
 * DB에 없는 운동들을 유사한 이름이나 정확한 이름으로 매핑
 */
const nameMapping: Record<string, string | null> = {
  // DB에 실제로 없는 운동들 - 유사한 운동으로 매핑하거나 null (추가 필요)
  "푸쉬업": null, // DB에 없음 - 추가 필요하거나 유사 운동 찾기
  "체스트 프레스": null, // DB에 없음
  "체스트 플라이": null, // DB에 없음
  "가슴 스트레칭": "어깨 스트레칭 (Shoulder Stretch)", // 유사한 스트레칭
  "월 푸쉬업": null, // DB에 없음
  "바이셉 컬": null, // DB에 없음
  "트라이셉 딥": null, // DB에 없음
  "해머 컬": null, // DB에 없음
  "트라이셉 익스텐션": null, // DB에 없음
  "사이드 런지": null, // DB에 없음
  "허벅지 스트레칭": "햄스트링 스트레칭", // 유사한 스트레칭
  "팔꿈치 플렉션 스트레칭": "손목 스트레칭 (Wrist Stretch)", // 유사한 스트레칭
  "이소메트릭 플렉션": null, // DB에 없음
  "이소메트릭 익스텐션": null, // DB에 없음
  "테니스볼 스퀴즈": null, // DB에 없음
};

function loadExercisesData(): ExerciseData[] {
  const exercisesJsonPath = path.join(__dirname, "..", "n8n_exercises.json");
  const fileContent = fs.readFileSync(exercisesJsonPath, "utf8");
  return JSON.parse(fileContent);
}

function saveExercisesData(data: ExerciseData[]): void {
  const exercisesJsonPath = path.join(__dirname, "..", "n8n_exercises.json");
  fs.writeFileSync(exercisesJsonPath, JSON.stringify(data, null, 2), "utf8");
}

function renameImageFile(oldFilename: string, newFilename: string): boolean {
  const imagesDir = path.join(__dirname, "..", "public", "images", "exercises");
  
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
 * DB에서 유사한 운동 이름 찾기 (키워드 기반)
 */
async function findSimilarExercise(searchName: string): Promise<string | null> {
  const allExercises = await prisma.exerciseTemplate.findMany({
    select: { name: true },
  });

  const keywords = searchName.toLowerCase().split(/\s+/).filter((k) => k.length > 1);
  
  // 정확한 키워드 매칭
  for (const exercise of allExercises) {
    const exerciseLower = exercise.name.toLowerCase();
    const matchCount = keywords.filter((k) => exerciseLower.includes(k)).length;
    
    if (matchCount >= keywords.length * 0.7) {
      return exercise.name;
    }
  }

  return null;
}

async function main() {
  console.log("🔍 Fixing all missing exercise names and matching images...\n");

  // 1. DB의 모든 운동 이름 가져오기
  const dbExercises = await prisma.exerciseTemplate.findMany({
    select: { name: true },
  });
  const dbExerciseNames = new Set(dbExercises.map((e) => e.name));
  console.log(`📊 Total exercises in DB: ${dbExercises.length}\n`);

  // 2. n8n_exercises.json 로드
  const exercisesData = loadExercisesData();
  console.log(`📋 Loaded ${exercisesData.length} exercises from n8n_exercises.json\n`);

  // 3. DB에서 찾을 수 없는 운동 찾기
  const missingExercises = exercisesData.filter(
    (ex) => !dbExerciseNames.has(ex.name)
  );

  console.log(`⚠️  Found ${missingExercises.length} exercises not in DB:\n`);

  let fixed = 0;
  let renamed = 0;
  let mappedToSimilar = 0;
  let stillMissing: string[] = [];

  // 4. 각 누락된 운동 처리
  for (let i = 0; i < exercisesData.length; i++) {
    const exercise = exercisesData[i];
    
    if (dbExerciseNames.has(exercise.name)) {
      continue; // 이미 DB에 있으면 스킵
    }

    console.log(`\n🔍 Processing: ${exercise.name}`);

    // 매핑 테이블 확인
    let targetName: string | null = nameMapping[exercise.name] || null;

    // 매핑이 없으면 유사한 운동 찾기
    if (!targetName) {
      targetName = await findSimilarExercise(exercise.name);
      if (targetName) {
        console.log(`  🔍 Found similar exercise: "${targetName}"`);
        mappedToSimilar++;
      }
    } else {
      console.log(`  📋 Using mapping: "${targetName}"`);
    }

    if (targetName && dbExerciseNames.has(targetName)) {
      // 매핑된 이름이 DB에 있으면 업데이트
      console.log(`  ✅ Mapping to: "${targetName}"`);
      
      // 파일명 생성
      const newFilename = targetName
        .replace(/\s+/g, "_")
        .replace(/[()]/g, "")
        .replace(/\//g, "")
        .replace(/,/g, "")
        + ".png";

      // 이미지 파일명 변경
      if (renameImageFile(exercise.filename, newFilename)) {
        renamed++;
      }

      // JSON 데이터 업데이트
      exercisesData[i].name = targetName;
      exercisesData[i].filename = newFilename;
      
      fixed++;
    } else {
      // 매핑할 수 없음
      console.log(`  ⚠️  No mapping found - exercise needs to be added to DB`);
      stillMissing.push(exercise.name);
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
  console.log(`✅ Fixed and mapped: ${fixed}`);
  console.log(`📁 Images renamed: ${renamed}`);
  console.log(`🔍 Mapped to similar: ${mappedToSimilar}`);
  console.log(`⚠️  Still missing: ${stillMissing.length}`);
  console.log("=".repeat(60));

  if (stillMissing.length > 0) {
    console.log(`\n⚠️  Exercises still not in DB (${stillMissing.length}):`);
    for (const name of stillMissing) {
      console.log(`  - ${name}`);
    }
    console.log(`\n💡 These exercises may need to be added to the database manually.`);
  }

  if (fixed > 0) {
    console.log(`\n💡 Next step: Run 'pnpm tsx scripts/link-exercise-images.ts' to link the images`);
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

