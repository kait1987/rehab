const { PrismaClient } = require("@prisma/client");
const { readFileSync } = require("fs");
const { join } = require("path");

const prisma = new PrismaClient();

const TEMPLATES_FILE = join(
  process.cwd(),
  "templates",
  "exercise-templates-real.json",
);
const ADDITIONAL_FILE = join(
  process.cwd(),
  "templates",
  "exercise-templates-additional.json",
);

async function main() {
  console.log("📤 실제 운동명 템플릿 업로드 시작...\n");

  // JSON 파일 읽기
  const realTemplates = JSON.parse(readFileSync(TEMPLATES_FILE, "utf-8"));

  let additionalTemplates = [];
  try {
    const additionalContent = readFileSync(ADDITIONAL_FILE, "utf-8");
    additionalTemplates = JSON.parse(additionalContent);
    console.log(`➕ 추가 템플릿 ${additionalTemplates.length}개 발견`);
  } catch (error) {
    console.log("ℹ️ 추가 템플릿 파일이 없거나 비어있습니다.");
  }

  const templates = [...realTemplates, ...additionalTemplates];

  console.log(`📊 총 ${templates.length}개 템플릿 업로드 중...\n`);

  // body_parts와 equipment_types 맵 생성
  const bodyParts = await prisma.bodyPart.findMany();
  const equipmentTypes = await prisma.equipmentType.findMany();

  const bodyPartMap = new Map(bodyParts.map((bp) => [bp.name, bp.id]));
  const equipmentTypeMap = new Map(
    equipmentTypes.map((et) => [et.name, et.id]),
  );

  // 1. 기존 매핑 삭제
  await prisma.bodyPartExerciseMapping.deleteMany({});
  console.log("✅ 기존 매핑 삭제 완료");

  // 2. 기존 템플릿 삭제
  await prisma.exerciseEquipmentMapping.deleteMany({});
  await prisma.exerciseTemplate.deleteMany({});
  console.log("✅ 기존 템플릿 삭제 완료\n");

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];

    try {
      const bodyPartId = bodyPartMap.get(template.bodyPartName);
      if (!bodyPartId) {
        console.log(
          `⚠️  [${template.name}] 부위 '${template.bodyPartName}' 없음`,
        );
        errorCount++;
        continue;
      }

      // 템플릿 생성
      const created = await prisma.exerciseTemplate.create({
        data: {
          name: template.name,
          description: template.description,
          bodyPartId: bodyPartId,
          intensityLevel: template.intensity_level,
          durationMinutes: template.duration_minutes,
          reps: template.reps,
          sets: template.sets,
          restSeconds: template.rest_seconds,
          difficultyScore: template.difficulty_score,
          instructions: template.instructions,
          precautions: template.precautions,
          isActive: true,
        },
      });

      // 기구 매핑 생성
      if (template.equipmentTypes && template.equipmentTypes.length > 0) {
        for (const eqName of template.equipmentTypes) {
          const eqId = equipmentTypeMap.get(eqName);
          if (eqId) {
            await prisma.exerciseEquipmentMapping.create({
              data: {
                exerciseTemplateId: created.id,
                equipmentTypeId: eqId,
                isRequired: false,
              },
            });
          }
        }
      }

      // 부위-운동 매핑 생성
      await prisma.bodyPartExerciseMapping.create({
        data: {
          bodyPartId: bodyPartId,
          exerciseTemplateId: created.id,
          priority: 1,
          painLevelRange: "all",
          intensityLevel: template.intensity_level,
          isActive: true,
        },
      });

      successCount++;
      if (successCount % 10 === 0) {
        console.log(`✅ [${successCount}/${templates.length}] 업로드 중...`);
      }
    } catch (error) {
      console.error(`❌ [${template.name}] 에러:`, error.message);
      errorCount++;
    }
  }

  console.log("\n📈 결과:");
  console.log(`  ✅ 성공: ${successCount}개`);
  console.log(`  ❌ 실패: ${errorCount}개`);
  console.log("🎉 업로드 완료!");
}

main()
  .catch((e) => {
    console.error("❌ 스크립트 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
