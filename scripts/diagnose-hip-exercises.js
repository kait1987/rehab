const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 골반(Hip) 운동 데이터 진단 중...");

  // 1. 골반 부위 ID 찾기
  const bodyPart = await prisma.bodyPart.findFirst({
    where: { name: "골반" },
  });

  if (!bodyPart) {
    console.error('❌ "골반" 부위를 찾을 수 없습니다.');
    return;
  }

  console.log(`✅ 골반 부위 ID: ${bodyPart.id}`);

  // 2. 골반 운동 목록 조회
  const exercises = await prisma.bodyPartExerciseMapping.findMany({
    where: { bodyPartId: bodyPart.id },
    include: {
      exerciseTemplate: {
        include: {
          exerciseEquipmentMappings: {
            include: {
              equipmentType: true,
            },
          },
        },
      },
    },
  });

  console.log(`📊 총 ${exercises.length}개의 골반 운동 발견`);

  // 3. 강도별 분류 (웜업/쿨다운 가능성 확인)
  const lowIntensity = exercises.filter(
    (e) => e.exerciseTemplate.intensityLevel <= 1,
  );
  const midIntensity = exercises.filter(
    (e) =>
      e.exerciseTemplate.intensityLevel === 2 ||
      e.exerciseTemplate.intensityLevel === 3,
  );
  const highIntensity = exercises.filter(
    (e) => e.exerciseTemplate.intensityLevel >= 4,
  );

  console.log("\n[강도 분포]");
  console.log(`- 저강도 (1 이하, 웜업/쿨다운 후보): ${lowIntensity.length}개`);
  console.log(`- 중강도 (2~3): ${midIntensity.length}개`);
  console.log(`- 고강도 (4 이상): ${highIntensity.length}개`);

  console.log("\n[저강도 운동 목록]");
  lowIntensity.forEach((e) => {
    const equipments = e.exerciseTemplate.exerciseEquipmentMappings
      .map((eq) => eq.equipmentType.name)
      .join(", ");
    const contraindications = e.exerciseTemplate.contraindications
      ? e.exerciseTemplate.contraindications.join(", ")
      : "없음";
    console.log(
      `- ${e.exerciseTemplate.name} (강도: ${
        e.exerciseTemplate.intensityLevel
      }, 난이도: ${e.exerciseTemplate.difficultyScore}, Active: ${
        e.isActive
      }, 장비: ${equipments || "없음"}, PainRange: ${
        e.painLevelRange || "all"
      })`,
    );
  });

  console.log("\n[중강도 운동 목록]");
  midIntensity.forEach((e) => {
    const equipments = e.exerciseTemplate.exerciseEquipmentMappings
      .map((eq) => eq.equipmentType.name)
      .join(", ");
    const contraindications = e.exerciseTemplate.contraindications
      ? e.exerciseTemplate.contraindications.join(", ")
      : "없음";
    console.log(
      `- ${e.exerciseTemplate.name} (강도: ${
        e.exerciseTemplate.intensityLevel
      }, 난이도: ${e.exerciseTemplate.difficultyScore}, Active: ${
        e.isActive
      }, 장비: ${equipments || "없음"}, PainRange: ${
        e.painLevelRange || "all"
      })`,
    );
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
