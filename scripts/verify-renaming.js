const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 DB 변경 사항 검증 중...");

  const targetNames = [
    "견갑거근 스트레칭 (Levator Scapulae)",
    "흉쇄유돌근 스트레칭 (SCM)",
    "발목 밀기 (Plantarflexion)",
  ];

  for (const name of targetNames) {
    const exercise = await prisma.exerciseTemplate.findFirst({
      where: { name: name },
    });

    if (exercise) {
      console.log(`✅ 확인됨: "${exercise.name}" (ID: ${exercise.id})`);
    } else {
      console.error(`❌ 찾을 수 없음: "${name}"`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
