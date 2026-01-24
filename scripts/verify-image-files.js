const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const IMAGES_DIR = path.join(__dirname, "../public/images/exercises");

async function main() {
  console.log("🔍 Verifying image files exist for all exercises...\n");

  const exercises = await prisma.exerciseTemplate.findMany({
    select: { name: true, imageUrl: true },
  });

  let validCount = 0;
  let invalidCount = 0;
  const invalidExercises = [];

  for (const ex of exercises) {
    if (!ex.imageUrl) {
      invalidCount++;
      invalidExercises.push({ name: ex.name, reason: "No imageUrl" });
      continue;
    }

    // imageUrl is like "/images/exercises/filename.png.jpg"
    const filename = ex.imageUrl.replace("/images/exercises/", "");
    const fullPath = path.join(IMAGES_DIR, filename);

    if (fs.existsSync(fullPath)) {
      validCount++;
    } else {
      invalidCount++;
      invalidExercises.push({
        name: ex.name,
        reason: `File not found: ${filename}`,
      });
    }
  }

  console.log(`📊 Results:`);
  console.log(`   ✅ Valid (file exists): ${validCount}`);
  console.log(`   ❌ Invalid: ${invalidCount}`);

  if (invalidExercises.length > 0) {
    console.log("\n❌ Invalid exercises:");
    invalidExercises.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.reason}`);
    });
  } else {
    console.log("\n🎉 All exercises have valid image files!");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
