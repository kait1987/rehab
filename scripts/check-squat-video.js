const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const squat = await prisma.exerciseTemplate.findFirst({
    where: { name: "스쿼트" },
  });

  if (squat) {
    console.log(`Squat video URL: ${squat.videoUrl}`);
  } else {
    console.log("Squat not found");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
