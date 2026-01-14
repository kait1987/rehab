const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const exercises = await prisma.exerciseTemplate.findMany({
    where: {
      name: {
        in: ["90-90 스트레칭", "서서 골반 회전", "스탠딩 힙 서클", "레그 스윙"],
      },
    },
    select: { name: true, difficultyScore: true, intensityLevel: true },
  });

  console.log(exercises);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
