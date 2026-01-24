const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Testing with user settings: 허리, pain=3, 맨몸\n");

  // 1. Find body part
  const bodyPart = await prisma.bodyPart.findFirst({
    where: { name: "허리" },
  });

  if (!bodyPart) {
    console.log("Body part not found");
    return;
  }

  // 2. Find "없음" equipment
  const noEquipment = await prisma.equipmentType.findFirst({
    where: { name: "없음" },
  });

  console.log(`Body Part: ${bodyPart.name}`);
  console.log(
    `Equipment "없음": ${noEquipment ? noEquipment.id : "NOT FOUND"}\n`,
  );

  // 3. Get mappings
  const mappings = await prisma.bodyPartExerciseMapping.findMany({
    where: {
      bodyPartId: bodyPart.id,
      isActive: true,
    },
    include: {
      exerciseTemplate: {
        include: {
          exerciseEquipmentMappings: {
            include: { equipmentType: true },
          },
        },
      },
    },
    orderBy: { priority: "asc" },
  });

  console.log(`Total exercises for 허리: ${mappings.length}\n`);

  // 4. Filter by equipment (없음 = bodyweight)
  const bodyweightExercises = mappings.filter((m) => {
    const equipmentNames = m.exerciseTemplate.exerciseEquipmentMappings.map(
      (ee) => ee.equipmentType.name,
    );
    return equipmentNames.includes("없음");
  });

  console.log(
    `Exercises with "없음" equipment: ${bodyweightExercises.length}\n`,
  );

  if (bodyweightExercises.length === 0) {
    console.log("⚠️ NO BODYWEIGHT EXERCISES for 허리!");
    console.log("This is why the course is short!\n");

    // List what equipment each exercise needs
    console.log("Equipment required for each exercise:");
    mappings.forEach((m) => {
      const equipmentNames = m.exerciseTemplate.exerciseEquipmentMappings.map(
        (ee) => ee.equipmentType.name,
      );
      console.log(
        `  - ${m.exerciseTemplate.name}: [${equipmentNames.join(", ")}]`,
      );
    });
  } else {
    // Check intensity distribution
    const low = bodyweightExercises.filter(
      (m) => !m.intensityLevel || m.intensityLevel <= 2,
    );
    const high = bodyweightExercises.filter(
      (m) => m.intensityLevel && m.intensityLevel > 2,
    );

    console.log("Intensity distribution (bodyweight only):");
    console.log(`  Low (warmup/cooldown): ${low.length}`);
    console.log(`  High (main): ${high.length}\n`);

    console.log("Bodyweight exercises:");
    bodyweightExercises.forEach((m) => {
      console.log(
        `  - ${m.exerciseTemplate.name} (intensity: ${m.intensityLevel || "null"})`,
      );
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
