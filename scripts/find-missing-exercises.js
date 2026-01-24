const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const EXERCISES_JSON_PATH = path.join(__dirname, "../n8n_exercises.json");

async function main() {
  console.log("🔍 Finding missing exercises...\n");

  const exercisesData = JSON.parse(
    fs.readFileSync(EXERCISES_JSON_PATH, "utf8"),
  );
  const dbExercises = await prisma.exerciseTemplate.findMany({
    select: { name: true },
  });

  const dbNames = new Set(dbExercises.map((e) => e.name));
  const missing = exercisesData.filter((item) => !dbNames.has(item.name));

  console.log(`📦 JSON: ${exercisesData.length} exercises`);
  console.log(`🗄️ DB: ${dbExercises.length} exercises`);
  console.log(`❌ Missing: ${missing.length} exercises\n`);

  if (missing.length > 0) {
    console.log("Missing exercises:");
    missing.forEach((item, i) => {
      console.log(`${i + 1}. ${item.name}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
