const { PrismaClient } = require('@prisma/client');
const { readFileSync } = require('fs');
const { join } = require('path');

const prisma = new PrismaClient();

const TEMPLATES_FILE = join(process.cwd(), 'templates', 'exercise-templates-additional.json');

async function main() {
  console.log('📤 추가 운동명 템플릿 업로드 시작...\n');

  const fileContent = readFileSync(TEMPLATES_FILE, 'utf-8');
  const templates = JSON.parse(fileContent);

  console.log(`📊 총 ${templates.length}개 템플릿 업로드 중...\n`);

  const bodyParts = await prisma.bodyPart.findMany();
  const equipmentTypes = await prisma.equipmentType.findMany();

  const bodyPartMap = new Map(bodyParts.map((bp) => [bp.name, bp.id]));
  const equipmentTypeMap = new Map(equipmentTypes.map((et) => [et.name, et.id]));

  let successCount = 0;
  let errorCount = 0;

  for (const template of templates) {
    try {
      const bodyPartId = bodyPartMap.get(template.bodyPartName);
      if (!bodyPartId) {
        console.log(`⚠️  [${template.name}] 부위 '${template.bodyPartName}' 없음`);
        errorCount++;
        continue;
      }

      // 중복 확인
      const existing = await prisma.exerciseTemplate.findFirst({
        where: { name: template.name }
      });
      if (existing) {
        console.log(`⏭️  [${template.name}] 이미 존재, 건너뜀`);
        continue;
      }

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

      // 기구 매핑
      if (template.equipmentTypes) {
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

      // 부위-운동 매핑
      await prisma.bodyPartExerciseMapping.create({
        data: {
          bodyPartId: bodyPartId,
          exerciseTemplateId: created.id,
          priority: 1,
          painLevelRange: 'all',
          intensityLevel: template.intensity_level,
          isActive: true,
        },
      });

      successCount++;
      console.log(`✅ [${template.name}] 추가됨`);
    } catch (error) {
      console.error(`❌ [${template.name}] 에러:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📈 결과: ${successCount}개 추가됨, ${errorCount}개 실패`);
  
  const total = await prisma.exerciseTemplate.count();
  console.log(`📊 전체 운동 템플릿: ${total}개`);
}

main()
  .catch((e) => {
    console.error('❌ 스크립트 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
