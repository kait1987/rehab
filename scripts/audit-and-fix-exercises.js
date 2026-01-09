/**
 * 운동 데이터 전수 조사 + 자동 수정 스크립트
 * Phase 1: 데이터 조사 + 자동 수정 (15분)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 헬스장 전용 운동 (집에서 하기 어려운 운동)
const GYM_ONLY_EXERCISES = [
  '랫 풀다운',
  '시티드 로우',
  '체스트 프레스',
];

async function main() {
  console.log('🔍 운동 데이터 전수 조사 시작...\n');
  console.log('='.repeat(50));

  // 1. 부위별 운동 개수 확인
  console.log('\n📊 부위별 활성 운동 개수:\n');
  const bodyParts = await prisma.bodyPart.findMany({ orderBy: { displayOrder: 'asc' } });
  const stats = [];
  const insufficientParts = [];

  for (const bp of bodyParts) {
    const count = await prisma.exerciseTemplate.count({
      where: { bodyPartId: bp.id, isActive: true }
    });
    
    const status = count >= 5 ? '✅' : '⚠️';
    stats.push({ 부위: bp.name, 활성운동: count, 상태: status });
    
    if (count < 5) {
      insufficientParts.push({ name: bp.name, count });
    }
  }
  console.table(stats);

  if (insufficientParts.length > 0) {
    console.log('\n⚠️  5개 미만 부위:');
    insufficientParts.forEach(p => console.log(`   - ${p.name}: ${p.count}개`));
  }

  // 2. 잘못된 기구 매핑 확인
  console.log('\n' + '='.repeat(50));
  console.log('\n🔧 문제 운동 확인:\n');

  for (const exerciseName of GYM_ONLY_EXERCISES) {
    const exercise = await prisma.exerciseTemplate.findFirst({
      where: { name: exerciseName },
      include: {
        exerciseEquipmentMappings: {
          include: { equipmentType: true }
        }
      }
    });

    if (exercise) {
      const equipments = exercise.exerciseEquipmentMappings.map(m => m.equipmentType.name);
      const status = exercise.isActive ? '🔴 활성' : '🟢 비활성';
      console.log(`   ${status} ${exerciseName}: [${equipments.join(', ')}]`);
    } else {
      console.log(`   ⏭️  ${exerciseName}: 없음`);
    }
  }

  // 3. 자동 수정
  console.log('\n' + '='.repeat(50));
  console.log('\n🔧 자동 수정 실행...\n');

  const result = await prisma.exerciseTemplate.updateMany({
    where: { 
      name: { in: GYM_ONLY_EXERCISES },
      isActive: true
    },
    data: { isActive: false }
  });

  if (result.count > 0) {
    console.log(`   ✅ ${result.count}개 헬스장 운동 비활성화 완료`);
  } else {
    console.log(`   ℹ️  비활성화할 운동 없음 (이미 비활성화됨)`);
  }

  // 4. 최종 결과 확인
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 최종 부위별 활성 운동:\n');

  const finalStats = [];
  for (const bp of bodyParts) {
    const count = await prisma.exerciseTemplate.count({
      where: { bodyPartId: bp.id, isActive: true }
    });
    const status = count >= 5 ? '✅' : '⚠️';
    finalStats.push({ 부위: bp.name, 활성운동: count, 상태: status });
  }
  console.table(finalStats);

  // 5. 전체 요약
  const totalActive = await prisma.exerciseTemplate.count({ where: { isActive: true } });
  const totalInactive = await prisma.exerciseTemplate.count({ where: { isActive: false } });
  
  console.log('\n📈 전체 요약:');
  console.log(`   - 활성 운동: ${totalActive}개`);
  console.log(`   - 비활성 운동: ${totalInactive}개`);
  console.log('\n✅ Phase 1 완료!');
}

main()
  .catch((e) => {
    console.error('❌ 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
