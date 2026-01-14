const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const squat = await prisma.exerciseTemplate.findFirst({
    where: { name: "스쿼트" },
  });

  if (squat) {
    await prisma.exerciseTemplate.update({
      where: { id: squat.id },
      data: { videoUrl: "U3Hh0Ue-Hxs" }, // Squat tutorial video ID
    });
    console.log(`Updated Squat video URL to U3Hh0Ue-Hxs`);
  } else {
    console.log("Squat not found");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
