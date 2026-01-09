const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== 랫 풀다운 상태 확인 ===\n');

  const exercise = await prisma.exerciseTemplate.findFirst({
    where: { name: '랫 풀다운' },
    include: {
      exerciseEquipmentMappings: {
        include: { equipmentType: true }
      }
    }
  });

  if (exercise) {
    console.log('이름:', exercise.name);
    console.log('isActive:', exercise.isActive);
    console.log('기구:', exercise.exerciseEquipmentMappings.map(m => m.equipmentType.name));
  } else {
    console.log('랫 풀다운 운동을 찾을 수 없습니다.');
  }

  // 등 부위 활성화된 운동 모두 확인
  console.log('\n=== 등 부위 활성 운동 ===\n');
  const backExercises = await prisma.exerciseTemplate.findMany({
    where: {
      bodyPart: { name: '등' },
      isActive: true
    },
    include: {
      exerciseEquipmentMappings: {
        include: { equipmentType: true }
      }
    }
  });

  backExercises.forEach(ex => {
    const equipment = ex.exerciseEquipmentMappings.map(m => m.equipmentType.name).join(', ');
    console.log(`  - ${ex.name} [${equipment}]`);
  });

  console.log(`\n총 ${backExercises.length}개 활성 운동`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
