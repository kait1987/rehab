/**
 * @file scripts/add-missing-exercises-to-db.ts
 * @description DB에 없는 운동들을 추가하는 스크립트
 * 
 * 구글 검색 결과를 바탕으로 정확한 운동 이름을 확인하고 DB에 추가
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
 * DB에 추가할 운동 목록
 * 구글 검색 결과를 바탕으로 정확한 이름 사용
 */
const exercisesToAdd = [
  {
    name: "푸쉬업",
    englishName: "Push-up",
    bodyPart: "가슴", // 또는 "상체"
    description: "팔굽혀펴기 운동으로 가슴, 어깨, 팔 근육을 강화합니다.",
  },
  {
    name: "체스트 프레스",
    englishName: "Chest Press",
    bodyPart: "가슴",
    description: "가슴 근육을 강화하는 프레스 운동입니다.",
  },
  {
    name: "체스트 플라이",
    englishName: "Chest Fly",
    bodyPart: "가슴",
    description: "가슴 근육을 타겟팅하는 플라이 운동입니다.",
  },
  {
    name: "월 푸쉬업",
    englishName: "Wall Push-up",
    bodyPart: "가슴",
    description: "벽을 이용한 초보자용 푸쉬업 운동입니다.",
  },
  {
    name: "바이셉 컬",
    englishName: "Bicep Curl",
    bodyPart: "팔",
    description: "이두근을 강화하는 컬 운동입니다.",
  },
  {
    name: "트라이셉 딥",
    englishName: "Tricep Dip",
    bodyPart: "팔",
    description: "삼두근을 강화하는 딥 운동입니다.",
  },
  {
    name: "해머 컬",
    englishName: "Hammer Curl",
    bodyPart: "팔",
    description: "이두근과 전완근을 강화하는 해머 그립 컬 운동입니다.",
  },
  {
    name: "트라이셉 익스텐션",
    englishName: "Tricep Extension",
    bodyPart: "팔",
    description: "삼두근을 강화하는 익스텐션 운동입니다.",
  },
  {
    name: "사이드 런지",
    englishName: "Side Lunge",
    bodyPart: "하체",
    description: "옆으로 움직이며 하체 근육을 강화하는 런지 운동입니다.",
  },
  {
    name: "이소메트릭 플렉션",
    englishName: "Isometric Elbow Flexion",
    bodyPart: "팔",
    description: "팔꿈치 굽힘 근육을 강화하는 정적 운동입니다.",
  },
  {
    name: "이소메트릭 익스텐션",
    englishName: "Isometric Elbow Extension",
    bodyPart: "팔",
    description: "팔꿈치 펴기 근육을 강화하는 정적 운동입니다.",
  },
  {
    name: "테니스볼 스퀴즈",
    englishName: "Tennis Ball Squeeze",
    bodyPart: "손",
    description: "테니스볼을 쥐어 손목과 손가락 근력을 강화하는 운동입니다.",
  },
];

async function main() {
  console.log("➕ Adding missing exercises to database...\n");

  // 1. Body Part ID 가져오기
  const bodyParts = await prisma.bodyPart.findMany();
  const bodyPartMap = new Map(bodyParts.map((bp) => [bp.name, bp.id]));
  
  console.log(`📊 Found ${bodyParts.length} body parts`);
  console.log(`   Available: ${bodyParts.map((bp) => bp.name).join(", ")}\n`);

  let added = 0;
  let skipped = 0;
  let errors = 0;

  // 2. 각 운동 추가
  for (const ex of exercisesToAdd) {
    try {
      // 이미 존재하는지 확인
      const existing = await prisma.exerciseTemplate.findFirst({
        where: { name: ex.name },
      });

      if (existing) {
        console.log(`⏭️  Skipped (exists): ${ex.name}`);
        skipped++;
        continue;
      }

      // Body Part 찾기
      let bodyPartId: string | undefined;
      
      // Body Part 매핑 (DB의 실제 이름 사용)
      const bodyPartMapping: Record<string, string> = {
        "가슴": "가슴",
        "팔": "팔꿈치", // 팔꿈치로 매핑
        "하체": "무릎", // 무릎으로 매핑
        "손": "손목",
      };
      
      const mappedBodyPart = bodyPartMapping[ex.bodyPart] || ex.bodyPart;
      bodyPartId = bodyPartMap.get(mappedBodyPart);

      if (!bodyPartId) {
        console.log(`❌ Body part not found: ${ex.bodyPart} for ${ex.name}`);
        console.log(`   Available body parts: ${Array.from(bodyPartMap.keys()).join(", ")}`);
        errors++;
        continue;
      }

      // 운동 추가
      await prisma.exerciseTemplate.create({
        data: {
          name: ex.name,
          englishName: ex.englishName,
          bodyPartId: bodyPartId,
          description: ex.description,
          isActive: true,
        },
      });

      console.log(`✅ Added: ${ex.name} (${ex.englishName})`);
      added++;
    } catch (error) {
      console.error(`❌ Error adding ${ex.name}:`, error);
      errors++;
    }
  }

  // 3. 최종 통계
  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary");
  console.log("=".repeat(60));
  console.log(`✅ Added: ${added}`);
  console.log(`⏭️  Skipped (exists): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log("=".repeat(60));

  const total = await prisma.exerciseTemplate.count();
  console.log(`\n📈 Total exercises in DB: ${total}`);
  
  if (added > 0) {
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

