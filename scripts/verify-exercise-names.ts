/**
 * @file scripts/verify-exercise-names.ts
 * @description DB에서 찾을 수 없는 운동들의 정확한 이름을 구글 검색으로 검증
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import fetchOrig from "node-fetch";
const fetch = fetchOrig as unknown as typeof globalThis.fetch;

const prisma = new PrismaClient();

interface ExerciseData {
  name: string;
  filename: string;
  prompt: string;
}

function loadExercisesData(): ExerciseData[] {
  const exercisesJsonPath = path.join(__dirname, "..", "n8n_exercises.json");
  const fileContent = fs.readFileSync(exercisesJsonPath, "utf8");
  return JSON.parse(fileContent);
}

async function main() {
  console.log("🔍 Verifying exercise names...\n");

  // 1. DB의 모든 운동 이름 가져오기
  const dbExercises = await prisma.exerciseTemplate.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });
  const dbExerciseNames = new Set(dbExercises.map((e) => e.name));
  
  // DB 운동 이름을 파일로 저장 (UTF-8 인코딩)
  const dbNamesPath = path.join(__dirname, "..", "db_exercise_names.json");
  fs.writeFileSync(
    dbNamesPath,
    JSON.stringify(dbExercises.map((e) => e.name), null, 2),
    "utf8"
  );
  console.log(`📊 Total exercises in DB: ${dbExercises.length}`);
  console.log(`💾 Saved to: ${dbNamesPath}\n`);

  // 2. n8n_exercises.json 로드
  const exercisesData = loadExercisesData();
  
  // 3. DB에서 찾을 수 없는 운동 찾기
  const missingExercises = exercisesData.filter(
    (ex) => !dbExerciseNames.has(ex.name)
  );

  console.log(`⚠️  Found ${missingExercises.length} exercises not in DB:\n`);
  
  for (const ex of missingExercises) {
    console.log(`  - ${ex.name}`);
  }

  console.log(`\n📋 Check db_exercise_names.json for exact DB exercise names`);
}

main()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

