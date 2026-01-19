import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const exercises = await prisma.exerciseTemplate.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });

  console.log("=== Exercise Names ===");
  exercises.forEach((ex) => console.log(ex.name));
  console.log("======================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
