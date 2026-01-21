/**
 * @file scripts/link-exercise-images.ts
 * @description 생성된 로컬 이미지를 운동 항목에 연결하는 스크립트
 *
 * 이 스크립트는 public/images/exercises/ 폴더에 생성된 이미지 파일들을
 * 데이터베이스의 ExerciseTemplate 테이블에 연결합니다.
 *
 * 사용법:
 *   pnpm tsx scripts/link-exercise-images.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

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
 * 이미지 파일이 실제로 존재하는지 확인합니다.
 */
function imageFileExists(filename: string): boolean {
  // 실제 파일명은 .png.jpg 형식일 수 있으므로 여러 확장자 확인
  const possibleExtensions = [".png.jpg", ".jpg", ".png", ".jpeg"];
  const imagesDir = path.join(
    __dirname,
    "..",
    "public",
    "images",
    "exercises"
  );

  for (const ext of possibleExtensions) {
    const filePath = path.join(imagesDir, filename.replace(/\.(png|jpg|jpeg)$/, ext));
    if (fs.existsSync(filePath)) {
      return true;
    }
  }

  return false;
}

/**
 * 실제 이미지 파일명을 찾습니다 (확장자 포함).
 */
function findActualImageFile(baseFilename: string): string | null {
  const possibleExtensions = [".png.jpg", ".jpg", ".png", ".jpeg"];
  const imagesDir = path.join(
    __dirname,
    "..",
    "public",
    "images",
    "exercises"
  );

  // baseFilename에서 기존 확장자 제거
  const nameWithoutExt = baseFilename.replace(/\.(png|jpg|jpeg)$/i, "");

  for (const ext of possibleExtensions) {
    const filePath = path.join(imagesDir, `${nameWithoutExt}${ext}`);
    if (fs.existsSync(filePath)) {
      // 웹 경로로 반환 (확장자 포함)
      return `${nameWithoutExt}${ext}`;
    }
  }

  return null;
}

/**
 * 메인 함수
 */
async function main() {
  console.log("🔗 Linking Exercise Images to Database...\n");

  // 1. n8n_exercises.json 로드
  let exercisesData: ExerciseData[];
  try {
    exercisesData = loadExercisesData();
    console.log(`📋 Loaded ${exercisesData.length} exercises from n8n_exercises.json\n`);
  } catch (error) {
    console.error("❌ Error loading exercises data:", error);
    process.exit(1);
  }

  // 2. 통계 초기화
  let linked = 0;
  let notFound = 0;
  let imageMissing = 0;
  let alreadyLinked = 0;

  // 3. 각 운동에 대해 이미지 연결
  console.log("🚀 Starting image linking...\n");

  for (const exerciseData of exercisesData) {
    try {
      // DB에서 운동 찾기 (이름으로 매칭)
      const exercise = await prisma.exerciseTemplate.findFirst({
        where: {
          name: exerciseData.name,
        },
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      });

      if (!exercise) {
        console.warn(`⚠️  Exercise not found in DB: ${exerciseData.name}`);
        notFound++;
        continue;
      }

      // 이미 로컬 이미지가 있는 경우 건너뛰기
      if (exercise.imageUrl && exercise.imageUrl.startsWith("/images/")) {
        console.log(`⏭️  ${exercise.name} -> Already has local image, skipping`);
        alreadyLinked++;
        continue;
      }

      // 외부 URL이 있는 경우 로컬 이미지로 교체
      if (exercise.imageUrl && !exercise.imageUrl.startsWith("/images/")) {
        console.log(`🔄 ${exercise.name} -> Replacing external URL with local image`);
      }

      // 실제 이미지 파일 찾기
      const actualImageFile = findActualImageFile(exerciseData.filename);
      if (!actualImageFile) {
        console.warn(`⚠️  Image file not found: ${exerciseData.filename}`);
        imageMissing++;
        continue;
      }

      // 웹 경로 생성 (Next.js public 폴더 기준)
      const imageUrl = `/images/exercises/${actualImageFile}`;

      // DB 업데이트
      await prisma.exerciseTemplate.update({
        where: { id: exercise.id },
        data: { imageUrl: imageUrl },
      });

      linked++;
      console.log(`✅ [${linked}] ${exercise.name} -> ${imageUrl}`);
    } catch (error) {
      console.error(`❌ Error linking ${exerciseData.name}:`, error);
    }
  }

  // 4. 최종 통계
  console.log("\n" + "=".repeat(60));
  console.log("📊 Final Summary");
  console.log("=".repeat(60));
  console.log(`Total exercises in JSON:  ${exercisesData.length}`);
  console.log(`✅ Successfully linked:   ${linked}`);
  console.log(`⏭️  Already linked:        ${alreadyLinked}`);
  console.log(`⚠️  Exercise not found:    ${notFound}`);
  console.log(`⚠️  Image file missing:    ${imageMissing}`);
  console.log("=".repeat(60));

  // 5. 전체 DB 통계
  const totalInDb = await prisma.exerciseTemplate.count();
  const withImage = await prisma.exerciseTemplate.count({
    where: { imageUrl: { not: null } },
  });

  console.log(`\n📈 Database Statistics:`);
  console.log(`   Total exercises: ${totalInDb}`);
  console.log(`   With images:     ${withImage} (${((withImage / totalInDb) * 100).toFixed(1)}%)`);
  console.log("=".repeat(60));

  if (linked > 0) {
    console.log("\n🎉 Image linking completed successfully!");
  } else {
    console.log("\n⚠️  No images were linked. Check the warnings above.");
  }
}

// Run main function
main()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

