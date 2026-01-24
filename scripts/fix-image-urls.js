const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const EXERCISES_JSON_PATH = path.join(__dirname, "../n8n_exercises.json");
const IMAGES_DIR = path.join(__dirname, "../public/images/exercises");

async function main() {
  console.log("🖼️ Fixing Exercise Image URLs...");

  // 1. Read JSON Data
  if (!fs.existsSync(EXERCISES_JSON_PATH)) {
    console.error("❌ n8n_exercises.json not found");
    return;
  }
  const exercisesData = JSON.parse(
    fs.readFileSync(EXERCISES_JSON_PATH, "utf8"),
  );
  console.log(`📦 Loaded ${exercisesData.length} exercises from JSON.`);

  // 2. Read DB Data
  const dbExercises = await prisma.exerciseTemplate.findMany();
  console.log(`🗄️ Loaded ${dbExercises.length} exercises from DB.`);

  // Track processed exercises to avoid duplicates
  const processedNames = new Set();

  let updatedCount = 0;
  let notFoundCount = 0;
  let skippedDuplicateCount = 0;
  let skippedNoDbMatchCount = 0;

  for (const item of exercisesData) {
    // Skip if already processed (duplicate in JSON)
    if (processedNames.has(item.name)) {
      console.log(`⚠️ Skipped duplicate in JSON: ${item.name}`);
      skippedDuplicateCount++;
      continue;
    }
    processedNames.add(item.name);

    // Find matching DB record
    const dbExercise = dbExercises.find((e) => e.name === item.name);

    if (!dbExercise) {
      console.log(`⚠️ DB record not found for: ${item.name}`);
      skippedNoDbMatchCount++;
      continue;
    }

    // Check file existence
    const filenameBase = item.filename; // e.g., "name.png"
    let targetFilename = null;

    // Check various extensions
    const potentialPaths = [
      filenameBase,
      filenameBase + ".jpg", // .png.jpg
      filenameBase.replace(".png", ".jpg"), // .jpg instead of .png
      filenameBase.replace(".png", ".jpeg"),
    ];

    for (const p of potentialPaths) {
      if (fs.existsSync(path.join(IMAGES_DIR, p))) {
        targetFilename = p;
        break;
      }
    }

    if (targetFilename) {
      const imageUrl = `/images/exercises/${targetFilename}`;

      // Update DB
      await prisma.exerciseTemplate.update({
        where: { id: dbExercise.id },
        data: { imageUrl: imageUrl },
      });
      console.log(`✅ Updated: ${item.name} -> ${imageUrl}`);
      updatedCount++;
    } else {
      console.log(
        `❌ Image file not found for: ${item.name} (Tried: ${potentialPaths.join(", ")})`,
      );
      notFoundCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Updated: ${updatedCount}`);
  console.log(`   - Missing Images: ${notFoundCount}`);
  console.log(`   - Skipped (Duplicate in JSON): ${skippedDuplicateCount}`);
  console.log(`   - Skipped (No DB Match): ${skippedNoDbMatchCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
