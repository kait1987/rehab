const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Simulating 60-min course generation...\n");

  // Find a body part (e.g., 허리)
  const bodyPart = await prisma.bodyPart.findFirst({
    where: { name: "허리" },
  });

  if (!bodyPart) {
    console.log("Body part not found");
    return;
  }

  console.log(`Body Part: ${bodyPart.name} (${bodyPart.id})\n`);

  // Get mappings
  const mappings = await prisma.bodyPartExerciseMapping.findMany({
    where: {
      bodyPartId: bodyPart.id,
      isActive: true,
    },
    include: {
      exerciseTemplate: true,
    },
    orderBy: { priority: "asc" },
  });

  console.log(`Total exercises for ${bodyPart.name}: ${mappings.length}\n`);

  // Classify by intensity
  const lowIntensity = mappings.filter(
    (m) => !m.intensityLevel || m.intensityLevel <= 2,
  );
  const highIntensity = mappings.filter(
    (m) => m.intensityLevel && m.intensityLevel > 2,
  );

  console.log(`Low intensity (1-2): ${lowIntensity.length}`);
  console.log(`High intensity (3+): ${highIntensity.length}\n`);

  // For 60min course: warmup=10, cooldown=10, main=40
  // Main can have max 20min per exercise
  // So we need at least 2-3 main exercises

  console.log("Expected time distribution for 60min:");
  console.log("  Warmup: 10min (1-2 exercises)");
  console.log("  Main: 40min (need 2-3 exercises @ 15-20min each)");
  console.log("  Cooldown: 10min (1 exercise)");

  console.log("\n📊 Available:");
  console.log(`  For Warmup/Cooldown (low intensity): ${lowIntensity.length}`);
  console.log(`  For Main (high intensity): ${highIntensity.length}`);

  if (highIntensity.length < 2) {
    console.log("\n⚠️ PROBLEM: Not enough high-intensity exercises for main!");
    console.log(
      "   Main time needs 2-3 exercises but only have " + highIntensity.length,
    );
    console.log("   This will cause short course duration!");
  }

  // List exercises
  console.log("\n📋 High Intensity Exercises:");
  highIntensity.forEach((m) => {
    console.log(
      `  - ${m.exerciseTemplate.name} (intensity: ${m.intensityLevel})`,
    );
  });

  console.log("\n📋 Low Intensity Exercises:");
  lowIntensity.forEach((m) => {
    console.log(
      `  - ${m.exerciseTemplate.name} (intensity: ${m.intensityLevel || "null"})`,
    );
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
