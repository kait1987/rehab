const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== 등 운동 intensity 확인 ===\n');

  const exercises = await prisma.exerciseTemplate.findMany({
    where: {
      bodyPart: { name: '등' },
      isActive: true
    },
    select: {
      name: true,
      intensityLevel: true
    }
  });

  console.log('활성 등 운동:');
  exercises.forEach(ex => {
    let section = 'unknown';
    if (ex.intensityLevel === 1) section = 'warmup/cooldown';
    else if (ex.intensityLevel === 2) section = 'warmup/main';
    else if (ex.intensityLevel >= 3) section = 'main';
    console.log(`  ${ex.name}: intensity=${ex.intensityLevel} → ${section}`);
  });

  const mainExercises = exercises.filter(e => e.intensityLevel >= 3);
  console.log(`\n메인 운동 (intensity >= 3): ${mainExercises.length}개`);

  if (mainExercises.length === 0) {
    console.log('\n⚠️  등 부위에 메인 운동이 없습니다! 추가 필요.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
