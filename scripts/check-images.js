const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const exercises = await prisma.exerciseTemplate.findMany({
    select: {
      name: true,
      imageUrl: true,
      englishName: true,
    },
    take: 10,
  });

  console.log("Exercise Template Samples:");
  exercises.forEach((e) => {
    console.log(
      `Name: ${e.name}, ImageURL: ${e.imageUrl}, EnglishName: ${e.englishName}`,
    );
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
