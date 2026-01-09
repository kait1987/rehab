/**
 * 잘못된 기구 매핑 수정 스크립트
 * 
 * 랫 풀다운, 시티드 로우 등 헬스장 기구가 필요한 운동을
 * DB에서 비활성화하거나 삭제합니다.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 헬스장 기구 필요 운동 (집에서 하기 어려운 운동)
const GYM_ONLY_EXERCISES = [
  '랫 풀다운',
  '시티드 로우',
  '체스트 프레스', // 벤치 필요
  // 필요시 더 추가
];

async function main() {
  console.log('🔧 잘못된 기구 매핑 수정 시작...\n');

  for (const exerciseName of GYM_ONLY_EXERCISES) {
    const exercise = await prisma.exerciseTemplate.findFirst({
      where: { name: exerciseName },
    });

    if (!exercise) {
      console.log(`⏭️ [${exerciseName}] 없음, 건너뜀`);
      continue;
    }

    // 운동 비활성화
    await prisma.exerciseTemplate.update({
      where: { id: exercise.id },
      data: { isActive: false },
    });

    console.log(`✅ [${exerciseName}] 비활성화됨`);
  }

  console.log('\n📊 현재 활성화된 등 운동:');
  const backExercises = await prisma.exerciseTemplate.findMany({
    where: {
      bodyPart: { name: '등' },
      isActive: true,
    },
    select: { name: true },
  });
  backExercises.forEach((e) => console.log(`  - ${e.name}`));

  console.log('\n✅ 수정 완료!');
}

main()
  .catch((e) => {
    console.error('❌ 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
