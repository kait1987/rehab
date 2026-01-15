import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 등 부위 맨몸 고강도 운동 데이터
const backBodyweightExercises = [
  {
    name: "슈퍼맨 자세 (Superman Hold)",
    description: "엎드려서 양팔과 양다리를 동시에 들어올려 등 근육 강화",
    instructions:
      "바닥에 엎드린 상태에서 팔과 다리를 동시에 들어올립니다. 2-3초 유지 후 천천히 내립니다.",
    intensityLevel: 3,
    difficultyScore: 6,
    videoKeywords: "슈퍼맨 자세 운동",
    equipment: ["맨몸"],
  },
  {
    name: "버드독 (Bird Dog)",
    description: "네 발 자세에서 반대쪽 팔과 다리를 번갈아 뻗어 코어와 등 강화",
    instructions:
      "네 발 자세에서 오른팔과 왼다리를 동시에 뻗습니다. 3초 유지 후 반대쪽 반복.",
    intensityLevel: 3,
    difficultyScore: 5,
    videoKeywords: "버드독 운동 자세",
    equipment: ["맨몸"],
  },
  {
    name: "리버스 스노우 엔젤 (Reverse Snow Angel)",
    description: "엎드린 상태에서 팔을 위아래로 움직여 어깨와 등 강화",
    instructions:
      "엎드려서 팔을 몸 옆에서 머리 위까지 원호를 그리며 움직입니다.",
    intensityLevel: 4,
    difficultyScore: 7,
    videoKeywords: "리버스 스노우 엔젤",
    equipment: ["맨몸"],
  },
  {
    name: "프론 Y-T-W 레이즈",
    description:
      "엎드린 상태에서 Y, T, W 모양으로 팔을 들어 등 근육 전체 활성화",
    instructions: "엎드려서 팔을 Y자, T자, W자 모양으로 차례대로 들어올립니다.",
    intensityLevel: 3,
    difficultyScore: 6,
    videoKeywords: "Y T W 레이즈 운동",
    equipment: ["맨몸"],
  },
  {
    name: "플랭크 숄더 탭",
    description: "플랭크 자세에서 반대쪽 어깨를 터치하며 코어와 등 강화",
    instructions:
      "플랭크 자세를 유지하며 한 손을 들어 반대 어깨를 터치합니다. 번갈아 반복.",
    intensityLevel: 4,
    difficultyScore: 7,
    videoKeywords: "플랭크 숄더 탭",
    equipment: ["맨몸"],
  },
];

async function main() {
  console.log("🚀 등 부위 맨몸 고강도 운동 추가 중...\n");

  // 등 부위 ID 찾기
  const backBodyPart = await prisma.bodyPart.findFirst({
    where: { name: "등" },
  });

  if (!backBodyPart) {
    console.error("❌ '등' 부위를 찾을 수 없습니다.");
    return;
  }
  console.log(`등 부위 ID: ${backBodyPart.id}`);

  // 맨몸 기구 ID 찾기
  const bodyweightEquipment = await prisma.equipmentType.findFirst({
    where: { name: "맨몸" },
  });

  if (!bodyweightEquipment) {
    console.error("❌ '맨몸' 기구를 찾을 수 없습니다.");
    return;
  }
  console.log(`맨몸 기구 ID: ${bodyweightEquipment.id}\n`);

  for (const ex of backBodyweightExercises) {
    // 중복 확인
    const existing = await prisma.exerciseTemplate.findFirst({
      where: { name: ex.name },
    });

    if (existing) {
      console.log(`⏭️ ${ex.name} - 이미 존재함`);
      continue;
    }

    // 운동 템플릿 생성
    const newTemplate = await prisma.exerciseTemplate.create({
      data: {
        name: ex.name,
        description: ex.description,
        instructions: ex.instructions,
        intensityLevel: ex.intensityLevel,
        difficultyScore: ex.difficultyScore,
        isActive: true,
        bodyPartId: backBodyPart.id,
      },
    });

    // 기구 매핑
    await prisma.exerciseEquipmentMapping.create({
      data: {
        exerciseTemplateId: newTemplate.id,
        equipmentTypeId: bodyweightEquipment.id,
        isRequired: true,
      },
    });

    // 부위 매핑 (고강도)
    await prisma.bodyPartExerciseMapping.create({
      data: {
        bodyPartId: backBodyPart.id,
        exerciseTemplateId: newTemplate.id,
        priority: 1,
        isActive: true,
        intensityLevel: ex.intensityLevel,
      },
    });

    console.log(`✅ ${ex.name} (강도: ${ex.intensityLevel}) 추가됨`);
  }

  console.log("\n✅ 등 부위 맨몸 운동 추가 완료!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
