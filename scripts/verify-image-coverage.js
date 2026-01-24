const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.exerciseTemplate.count();
  const withImage = await prisma.exerciseTemplate.count({
    where: { imageUrl: { not: null } },
  });
  const withoutImage = await prisma.exerciseTemplate.count({
    where: { imageUrl: null },
  });

  console.log("📊 Exercise Image Summary:");
  console.log(`   Total exercises: ${total}`);
  console.log(`   With image: ${withImage}`);
  console.log(`   Without image: ${withoutImage}`);

  if (withoutImage > 0) {
    const missing = await prisma.exerciseTemplate.findMany({
      where: { imageUrl: null },
      select: { name: true },
    });
    console.log("\n❌ Exercises without images:");
    missing.forEach((e, i) => console.log(`   ${i + 1}. ${e.name}`));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
