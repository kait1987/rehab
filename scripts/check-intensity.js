const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== 운동 템플릿 강도 레벨 분석 ===\n');

  // intensityLevel 분포
  const nullIntensity = await prisma.exerciseTemplate.count({
    where: { intensityLevel: null }
  });
  const level1 = await prisma.exerciseTemplate.count({
    where: { intensityLevel: 1 }
  });
  const level2 = await prisma.exerciseTemplate.count({
    where: { intensityLevel: 2 }
  });
  const level3 = await prisma.exerciseTemplate.count({
    where: { intensityLevel: 3 }
  });
  const level4 = await prisma.exerciseTemplate.count({
    where: { intensityLevel: 4 }
  });

  console.log('📊 intensityLevel 분포:');
  console.log('  - NULL:', nullIntensity);
  console.log('  - Level 1:', level1);
  console.log('  - Level 2:', level2);
  console.log('  - Level 3:', level3);
  console.log('  - Level 4:', level4);

  // 허리 운동 샘플
  console.log('\n📍 허리 운동 샘플 (intensityLevel 포함):');
  const 허리 = await prisma.bodyPart.findFirst({ where: { name: '허리' } });
  if (허리) {
    const samples = await prisma.exerciseTemplate.findMany({
      where: { bodyPartId: 허리.id },
      take: 5,
      select: {
        name: true,
        intensityLevel: true,
        durationMinutes: true,
      }
    });
    samples.forEach(s => {
      console.log(`  - ${s.name}: intensity=${s.intensityLevel}, duration=${s.durationMinutes}min`);
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
