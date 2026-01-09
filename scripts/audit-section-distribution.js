/**
 * 모든 부위별 섹션 운동 분포 확인 및 수정
 * 
 * 각 부위에 warmup(1-2), main(3+) 운동이 충분한지 확인
 * 부족하면 intensity 조정
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 부위별 섹션 운동 분포 확인 및 수정\n');
  console.log('='.repeat(70));
  console.log('분류 기준: warmup/cooldown = intensity 1-2, main = intensity 3+');
  console.log('='.repeat(70));

  const bodyParts = await prisma.bodyPart.findMany({ orderBy: { displayOrder: 'asc' } });
  const issues = [];

  for (const bp of bodyParts) {
    const exercises = await prisma.exerciseTemplate.findMany({
      where: { bodyPartId: bp.id, isActive: true },
      include: {
        exerciseEquipmentMappings: {
          include: { equipmentType: true }
        }
      },
      orderBy: { intensityLevel: 'asc' }
    });

    const warmup = exercises.filter(e => e.intensityLevel && e.intensityLevel <= 2);
    const main = exercises.filter(e => e.intensityLevel && e.intensityLevel >= 3);

    const status = {
      total: exercises.length,
      warmup: warmup.length,
      main: main.length,
      hasWarmup: warmup.length >= 2,
      hasMain: main.length >= 1
    };

    const statusIcon = status.hasWarmup && status.hasMain ? '✅' : '⚠️';
    console.log(`\n${statusIcon} ${bp.name}: 총 ${status.total}개 (warmup: ${status.warmup}, main: ${status.main})`);

    // 상세 출력
    exercises.forEach(ex => {
      const equipment = ex.exerciseEquipmentMappings.map(m => m.equipmentType.name).join(', ') || '없음';
      const section = ex.intensityLevel <= 2 ? 'warmup/cooldown' : 'main';
      console.log(`   - [${ex.intensityLevel}] ${ex.name} (${equipment}) → ${section}`);
    });

    if (!status.hasWarmup) {
      issues.push({ bp: bp.name, issue: 'warmup 부족 (< 2)' });
    }
    if (!status.hasMain) {
      issues.push({ bp: bp.name, issue: 'main 부족 (< 1)' });
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 문제 요약:');
  console.log('='.repeat(70));

  if (issues.length === 0) {
    console.log('✅ 모든 부위에 충분한 운동이 있습니다!');
  } else {
    issues.forEach(i => console.log(`⚠️  ${i.bp}: ${i.issue}`));
  }

  console.log('\n📋 권장 사항:');
  console.log('- warmup/cooldown: 부위당 최소 2개 (intensity 1-2)');
  console.log('- main: 부위당 최소 1개 (intensity 3+)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
