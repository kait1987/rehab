/**
 * @file scripts/check-image-matching-status.ts
 * @description 모든 운동과 이미지 매칭 상태 확인
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking exercise-image matching status...\n");

  // 1. DB의 모든 운동 가져오기
  const allExercises = await prisma.exerciseTemplate.findMany({
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
    orderBy: { name: "asc" },
  });

  console.log(`📊 Total exercises in DB: ${allExercises.length}\n`);

  // 2. 이미지 파일 목록 가져오기
  const imagesDir = path.join(process.cwd(), "public", "images", "exercises");
  let imageFiles: string[] = [];
  
  if (fs.existsSync(imagesDir)) {
    imageFiles = fs.readdirSync(imagesDir).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".png", ".jpg", ".jpeg", ".png.jpg"].includes(ext);
    });
  }

  console.log(`📁 Total image files: ${imageFiles.length}\n`);

  // 3. 매칭 상태 분석
  let withLocalImage = 0;
  let withExternalImage = 0;
  let withoutImage = 0;
  let localImageExists = 0;
  let localImageMissing = 0;

  const exercisesWithoutImage: string[] = [];
  const exercisesWithExternalImage: string[] = [];
  const exercisesWithLocalImage: string[] = [];
  const imagesWithoutExercise: string[] = [];
  const missingImageFiles: string[] = [];

  for (const exercise of allExercises) {
    if (!exercise.imageUrl) {
      withoutImage++;
      exercisesWithoutImage.push(exercise.name);
    } else if (exercise.imageUrl.startsWith("/images/")) {
      withLocalImage++;
      exercisesWithLocalImage.push(exercise.name);
      
      // 실제 파일 존재 확인
      // /images/exercises/... -> public/images/exercises/...
      const relativePath = exercise.imageUrl.replace(/^\//, "");
      const imagePath = path.join(process.cwd(), "public", relativePath);
      
      if (fs.existsSync(imagePath)) {
        localImageExists++;
      } else {
        localImageMissing++;
        missingImageFiles.push(`${exercise.name} -> ${exercise.imageUrl}`);
      }
    } else {
      withExternalImage++;
      exercisesWithExternalImage.push(exercise.name);
    }
  }

  // 4. 이미지 파일 중 운동에 연결되지 않은 것 찾기
  for (const imageFile of imageFiles) {
    const imagePath = `/images/exercises/${imageFile}`;
    const hasExercise = allExercises.some(
      (ex) => ex.imageUrl === imagePath
    );
    if (!hasExercise) {
      imagesWithoutExercise.push(imageFile);
    }
  }

  // 5. 결과 출력
  console.log("=".repeat(60));
  console.log("📊 Matching Status Summary");
  console.log("=".repeat(60));
  console.log(`Total exercises:           ${allExercises.length}`);
  console.log(`✅ With local image:       ${withLocalImage} (${((withLocalImage / allExercises.length) * 100).toFixed(1)}%)`);
  console.log(`   - Image file exists:    ${localImageExists}`);
  console.log(`   - Image file missing:   ${localImageMissing}`);
  console.log(`🌐 With external image:   ${withExternalImage} (${((withExternalImage / allExercises.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Without image:          ${withoutImage} (${((withoutImage / allExercises.length) * 100).toFixed(1)}%)`);
  console.log(`📁 Unmatched image files:  ${imagesWithoutExercise.length}`);
  console.log("=".repeat(60));

  if (exercisesWithoutImage.length > 0) {
    console.log(`\n❌ Exercises without image (${exercisesWithoutImage.length}):`);
    exercisesWithoutImage.forEach((name) => console.log(`   - ${name}`));
  }

  if (missingImageFiles.length > 0) {
    console.log(`\n⚠️  Missing image files (${missingImageFiles.length}):`);
    missingImageFiles.slice(0, 10).forEach((item) => console.log(`   - ${item}`));
    if (missingImageFiles.length > 10) {
      console.log(`   ... and ${missingImageFiles.length - 10} more`);
    }
  }

  if (exercisesWithExternalImage.length > 0) {
    console.log(`\n🌐 Exercises with external image (${exercisesWithExternalImage.length}):`);
    exercisesWithExternalImage.slice(0, 10).forEach((name) => console.log(`   - ${name}`));
    if (exercisesWithExternalImage.length > 10) {
      console.log(`   ... and ${exercisesWithExternalImage.length - 10} more`);
    }
  }

  if (imagesWithoutExercise.length > 0) {
    console.log(`\n📁 Image files without exercise (${imagesWithoutExercise.length}):`);
    imagesWithoutExercise.slice(0, 10).forEach((file) => console.log(`   - ${file}`));
    if (imagesWithoutExercise.length > 10) {
      console.log(`   ... and ${imagesWithoutExercise.length - 10} more`);
    }
  }

  // 6. 최종 상태
  console.log("\n" + "=".repeat(60));
  if (withoutImage === 0 && localImageMissing === 0) {
    console.log("✅ All exercises have images and all image files exist!");
  } else if (withoutImage === 0) {
    console.log("⚠️  All exercises have image URLs, but some image files are missing.");
  } else {
    console.log("❌ Some exercises are missing images.");
  }
  console.log("=".repeat(60));
}

main()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

