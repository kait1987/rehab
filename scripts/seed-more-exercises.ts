import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 추가할 운동 데이터
const newExercises = [
  // === 등 (Back) - 현재 1개뿐이라 10개 이상 추가 ===
  {
    name: "밴드 로우 (Band Row)",
    englishName: "Band Row",
    bodyPart: "등",
    equipment: ["밴드"],
    intensityLevel: 3,
  },
  {
    name: "시티드 로우 (Seated Row)",
    englishName: "Seated Row",
    bodyPart: "등",
    equipment: ["밴드"],
    intensityLevel: 3,
  },
  {
    name: "밴드 풀 어파트 (Band Pull Apart)",
    englishName: "Band Pull Apart",
    bodyPart: "등",
    equipment: ["밴드"],
    intensityLevel: 2,
  },
  {
    name: "래트 풀다운 (Lat Pulldown)",
    englishName: "Lat Pulldown",
    bodyPart: "등",
    equipment: ["밴드"],
    intensityLevel: 3,
  },
  {
    name: "리버스 플라이 (Reverse Fly)",
    englishName: "Reverse Fly",
    bodyPart: "등",
    equipment: ["덤벨"],
    intensityLevel: 3,
  },
  {
    name: "등 스트레칭 (Back Stretch)",
    englishName: "Back Stretch",
    bodyPart: "등",
    equipment: ["맨몸"],
    intensityLevel: 1,
  },
  {
    name: "차일드 포즈 (Child's Pose)",
    englishName: "Child Pose",
    bodyPart: "등",
    equipment: ["매트"],
    intensityLevel: 1,
  },
  {
    name: "스레드 더 니들 (Thread the Needle)",
    englishName: "Thread the Needle",
    bodyPart: "등",
    equipment: ["매트"],
    intensityLevel: 1,
  },
  {
    name: "코브라 스트레칭 (Cobra Stretch)",
    englishName: "Cobra Stretch",
    bodyPart: "등",
    equipment: ["매트"],
    intensityLevel: 1,
  },
  {
    name: "상체 회전 스트레칭 (Trunk Rotation)",
    englishName: "Trunk Rotation Stretch",
    bodyPart: "등",
    equipment: ["매트"],
    intensityLevel: 1,
  },
  {
    name: "등 월 슬라이드 (Back Wall Slide)",
    englishName: "Back Wall Slide",
    bodyPart: "등",
    equipment: ["맨몸"],
    intensityLevel: 2,
  },

  // === 어깨 추가 ===
  {
    name: "오버헤드 프레스 (Overhead Press)",
    englishName: "Overhead Press",
    bodyPart: "어깨",
    equipment: ["덤벨"],
    intensityLevel: 4,
  },
  {
    name: "프론트 레이즈 (Front Raise)",
    englishName: "Front Raise",
    bodyPart: "어깨",
    equipment: ["덤벨"],
    intensityLevel: 3,
  },
  {
    name: "업라이트 로우 (Upright Row)",
    englishName: "Upright Row",
    bodyPart: "어깨",
    equipment: ["덤벨"],
    intensityLevel: 3,
  },
  {
    name: "어깨 스트레칭 (Shoulder Stretch)",
    englishName: "Shoulder Stretch",
    bodyPart: "어깨",
    equipment: ["맨몸"],
    intensityLevel: 1,
  },

  // === 목 추가 ===
  {
    name: "목 옆 스트레칭 (Lateral Neck Stretch)",
    englishName: "Lateral Neck Stretch",
    bodyPart: "목",
    equipment: ["맨몸"],
    intensityLevel: 1,
  },
  {
    name: "목 회전 운동 (Neck Rotation)",
    englishName: "Neck Rotation",
    bodyPart: "목",
    equipment: ["맨몸"],
    intensityLevel: 1,
  },

  // === 허리 추가 ===
  {
    name: "시티드 트위스트 (Seated Twist)",
    englishName: "Seated Twist",
    bodyPart: "허리",
    equipment: ["매트"],
    intensityLevel: 1,
  },
  {
    name: "스탠딩 사이드 밴드 (Standing Side Bend)",
    englishName: "Standing Side Bend",
    bodyPart: "허리",
    equipment: ["맨몸"],
    intensityLevel: 2,
  },
  {
    name: "행잉 니 레이즈 (Hanging Knee Raise)",
    englishName: "Hanging Knee Raise",
    bodyPart: "허리",
    equipment: ["맨몸"],
    intensityLevel: 4,
  },

  // === 골반 추가 ===
  {
    name: "힙 플렉서 런지 (Hip Flexor Lunge)",
    englishName: "Hip Flexor Lunge",
    bodyPart: "골반",
    equipment: ["매트"],
    intensityLevel: 2,
  },
  {
    name: "레그 스윙 (Leg Swing)",
    englishName: "Leg Swing",
    bodyPart: "골반",
    equipment: ["맨몸"],
    intensityLevel: 1,
  },
  {
    name: "스모 스쿼트 (Sumo Squat)",
    englishName: "Sumo Squat",
    bodyPart: "골반",
    equipment: ["맨몸"],
    intensityLevel: 3,
  },

  // === 무릎 추가 ===
  {
    name: "터미널 니 익스텐션 (Terminal Knee Extension)",
    englishName: "Terminal Knee Extension",
    bodyPart: "무릎",
    equipment: ["밴드"],
    intensityLevel: 2,
  },
  {
    name: "스텝 다운 (Step Down)",
    englishName: "Step Down",
    bodyPart: "무릎",
    equipment: ["맨몸"],
    intensityLevel: 3,
  },
  {
    name: "힐 슬라이드 (Heel Slide)",
    englishName: "Heel Slide",
    bodyPart: "무릎",
    equipment: ["매트"],
    intensityLevel: 1,
  },

  // === 발목 추가 ===
  {
    name: "토 레이즈 (Toe Raise)",
    englishName: "Toe Raise",
    bodyPart: "발목",
    equipment: ["맨몸"],
    intensityLevel: 2,
  },
  {
    name: "발목 스트레칭 (Ankle Stretch)",
    englishName: "Ankle Stretch",
    bodyPart: "발목",
    equipment: ["맨몸"],
    intensityLevel: 1,
  },

  // === 손목 추가 ===
  {
    name: "손목 스트레칭 (Wrist Stretch)",
    englishName: "Wrist Stretch",
    bodyPart: "손목",
    equipment: ["맨몸"],
    intensityLevel: 1,
  },
  {
    name: "손목 강화 운동 (Wrist Strengthening)",
    englishName: "Wrist Strengthening",
    bodyPart: "손목",
    equipment: ["덤벨"],
    intensityLevel: 2,
  },
];

async function main() {
  console.log("🚀 Adding new exercises to database...\n");

  // 1. Get body part IDs
  const bodyParts = await prisma.bodyPart.findMany();
  const bodyPartMap = new Map(bodyParts.map((bp) => [bp.name, bp.id]));
  console.log(`Found ${bodyParts.length} body parts.`);

  // 2. Get equipment type IDs
  const equipmentTypes = await prisma.equipmentType.findMany();
  const equipmentMap = new Map(equipmentTypes.map((eq) => [eq.name, eq.id]));
  console.log(`Found ${equipmentTypes.length} equipment types.\n`);

  let added = 0;
  let skipped = 0;

  for (const ex of newExercises) {
    // Check if exercise already exists
    const existing = await prisma.exerciseTemplate.findFirst({
      where: { name: ex.name },
    });

    if (existing) {
      console.log(`⏭️ Skipped (exists): ${ex.name}`);
      skipped++;
      continue;
    }

    const bodyPartId = bodyPartMap.get(ex.bodyPart);
    if (!bodyPartId) {
      console.log(`❌ Body part not found: ${ex.bodyPart} for ${ex.name}`);
      continue;
    }

    // Create exercise with only valid schema fields
    const created = await prisma.exerciseTemplate.create({
      data: {
        name: ex.name,
        englishName: ex.englishName,
        bodyPartId: bodyPartId,
        intensityLevel: ex.intensityLevel,
        description: `${ex.name} 운동입니다.`,
        isActive: true,
      },
    });

    // Create equipment mappings
    for (const eqName of ex.equipment) {
      const eqId = equipmentMap.get(eqName);
      if (eqId) {
        await prisma.exerciseEquipmentMapping.create({
          data: {
            exerciseTemplateId: created.id,
            equipmentTypeId: eqId,
          },
        });
      }
    }

    console.log(`✅ Added: ${ex.name}`);
    added++;
  }

  console.log(`\n🎉 Complete! Added: ${added}, Skipped: ${skipped}`);

  const total = await prisma.exerciseTemplate.count();
  console.log(`Total exercises now: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
