const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== 부위별 운동 개수 ===\n');

  const bodyParts = await prisma.bodyPart.findMany({ orderBy: { displayOrder: 'asc' } });

  for (const bp of bodyParts) {
    const count = await prisma.exerciseTemplate.count({ where: { bodyPartId: bp.id } });
    const status = count > 0 ? '✅' : '❌';
    console.log(`${status} ${bp.name}: ${count}개`);
  }

  console.log('\n📊 전체:');
  const total = await prisma.exerciseTemplate.count();
  console.log('  - exercise_templates:', total);
  const mappings = await prisma.bodyPartExerciseMapping.count();
  console.log('  - body_part_exercise_mappings:', mappings);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
