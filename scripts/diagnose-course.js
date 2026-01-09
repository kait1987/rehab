const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== 데이터베이스 상태 진단 ===\n');

  // 1. 각 테이블 개수
  const [exerciseCount, mappingCount, bodyPartCount] = await Promise.all([
    prisma.exerciseTemplate.count(),
    prisma.bodyPartExerciseMapping.count(),
    prisma.bodyPart.count(),
  ]);

  console.log('📊 테이블 개수:');
  console.log('  - exercise_templates:', exerciseCount);
  console.log('  - body_part_exercise_mappings:', mappingCount);
  console.log('  - body_parts:', bodyPartCount);

  // 2. 부위별 운동 수 확인
  console.log('\n📍 부위별 운동 템플릿 수:');
  const bodyParts = await prisma.bodyPart.findMany({ select: { id: true, name: true } });
  for (const bp of bodyParts) {
    const count = await prisma.exerciseTemplate.count({ where: { bodyPartId: bp.id } });
    console.log(`  - ${bp.name}: ${count}개`);
  }

  // 3. body_part_exercise_mappings 샘플
  console.log('\n📎 부위-운동 매핑 샘플:');
  const mappings = await prisma.bodyPartExerciseMapping.findMany({
    take: 5,
    include: {
      bodyPart: { select: { name: true } },
      exerciseTemplate: { select: { name: true } },
    },
  });
  if (mappings.length === 0) {
    console.log('  ❌ body_part_exercise_mappings 테이블이 비어있습니다!');
    console.log('  이 테이블이 비어있으면 코스 생성이 실패합니다.');
  } else {
    mappings.forEach((m) => {
      console.log(`  - ${m.bodyPart.name} → ${m.exerciseTemplate.name}`);
    });
  }

  // 4. 허리 부위로 테스트 쿼리
  console.log('\n🔍 허리 부위 운동 검색 테스트:');
  const 허리 = await prisma.bodyPart.findFirst({ where: { name: '허리' } });
  if (허리) {
    const templates = await prisma.exerciseTemplate.findMany({
      where: { bodyPartId: 허리.id, isActive: true },
      take: 3,
    });
    console.log(`  - 허리(${허리.id}) 직접 연결된 운동: ${templates.length}개`);
    templates.forEach((t) => console.log(`    → ${t.name}`));
  } else {
    console.log('  ❌ 허리 부위를 찾을 수 없습니다');
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
