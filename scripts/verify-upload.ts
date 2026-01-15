import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 최신 등록된 운동 데이터 확인 중...");

  // 최근 생성된 순서로 5개 조회
  const latestExercises = await prisma.exerciseTemplate.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      bodyPart: true, // 부위 정보도 같이 확인
    },
  });

  console.log(`\n총 ${latestExercises.length}개의 최신 데이터 조회 결과:`);
  console.log(
    "----------------------------------------------------------------",
  );

  latestExercises.forEach((ex, index) => {
    console.log(`[${index + 1}] ${ex.name}`);
    console.log(`    - ID: ${ex.id}`);
    console.log(`    - 부위: ${ex.bodyPart.name}`);
    console.log(`    - 생성일: ${ex.createdAt.toLocaleString()}`);
    console.log(`    - 난이도(Score): ${ex.difficultyScore}`);
    console.log(`    - 강도(Level): ${ex.intensityLevel}`);
    console.log(
      "----------------------------------------------------------------",
    );
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
