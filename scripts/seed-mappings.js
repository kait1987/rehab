const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔗 매핑 데이터 생성 시작...');

  // 1. 기존 매핑 삭제 (재실행 대비)
  await prisma.bodyPartExerciseMapping.deleteMany({});
  console.log('✅ 기존 매핑 데이터 삭제 완료');

  // 2. exercise_templates 조회 (intensityLevel 포함)
  const templates = await prisma.exerciseTemplate.findMany({
    select: {
      id: true,
      name: true,
      bodyPartId: true,
      intensityLevel: true,
    },
  });

  console.log(`📊 총 ${templates.length}개 템플릿 발견`);

  // 3. 매핑 생성
  let successCount = 0;
  let errorCount = 0;

  for (const template of templates) {
    if (!template.bodyPartId) {
      console.warn(`⚠️  [${template.name}] bodyPartId 없음, 건너뜀`);
      errorCount++;
      continue;
    }

    try {
      await prisma.bodyPartExerciseMapping.create({
        data: {
          bodyPartId: template.bodyPartId,
          exerciseTemplateId: template.id,
          priority: 1, // 기본 우선순위
          painLevelRange: 'all', // 모든 통증 레벨
          intensityLevel: template.intensityLevel, // 🆕 운동 템플릿의 강도 레벨 복사
          isActive: true,
        },
      });
      successCount++;

      if (successCount % 10 === 0) {
        console.log(`✅ [${successCount}/${templates.length}] 매핑 생성 중...`);
      }
    } catch (error) {
      console.error(`❌ [${template.name}] 매핑 생성 실패:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📈 결과:');
  console.log(`  ✅ 성공: ${successCount}개`);
  console.log(`  ❌ 실패: ${errorCount}개`);
  console.log('🎉 매핑 생성 완료!');
}

main()
  .catch((e) => {
    console.error('❌ 스크립트 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
