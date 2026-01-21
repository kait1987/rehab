const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    const exercises = await prisma.exerciseTemplate.findMany({
      select: { name: true, category: true, bodyPart: true },
      orderBy: { name: "asc" },
    });

    const outputPath = path.resolve(__dirname, "../all_exercises.json");
    fs.writeFileSync(outputPath, JSON.stringify(exercises, null, 2));
    console.log(
      `Successfully wrote ${exercises.length} exercises to ${outputPath}`,
    );
  } catch (error) {
    console.error("Error fetching exercises:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
