const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Comprehensive System Check\n");
  console.log("=".repeat(60));

  const issues = [];

  // 1. Equipment Types Check
  console.log("\n📦 1. Equipment Types");
  const equipmentTypes = await prisma.equipmentType.findMany();
  console.log(`   Total: ${equipmentTypes.length}`);
  equipmentTypes.forEach((eq) => console.log(`   - ${eq.name}`));

  const hasNoEquipment = equipmentTypes.some((eq) => eq.name === "없음");
  if (!hasNoEquipment) {
    issues.push('❌ "없음" equipment type missing');
  } else {
    console.log('   ✅ "없음" exists');
  }

  // 2. Body Parts Check
  console.log("\n📍 2. Body Parts");
  const bodyParts = await prisma.bodyPart.findMany();
  console.log(`   Total: ${bodyParts.length}`);

  // 3. Exercise Templates Check
  console.log("\n🏋️ 3. Exercise Templates");
  const exercises = await prisma.exerciseTemplate.findMany();
  console.log(`   Total: ${exercises.length}`);

  const withImage = exercises.filter((ex) => ex.imageUrl);
  console.log(`   With Image URL: ${withImage.length}`);

  if (withImage.length < exercises.length) {
    issues.push(
      `⚠️ ${exercises.length - withImage.length} exercises missing imageUrl`,
    );
  }

  // 4. Body Part Exercise Mappings Check
  console.log("\n🔗 4. Body Part Exercise Mappings");
  const mappings = await prisma.bodyPartExerciseMapping.findMany({
    where: { isActive: true },
    include: { bodyPart: true },
  });
  console.log(`   Active mappings: ${mappings.length}`);

  // Check each body part has exercises
  for (const bp of bodyParts) {
    const count = mappings.filter((m) => m.bodyPartId === bp.id).length;
    if (count === 0) {
      issues.push(`❌ Body part "${bp.name}" has 0 exercises`);
    } else if (count < 5) {
      issues.push(
        `⚠️ Body part "${bp.name}" has only ${count} exercises (recommend 5+)`,
      );
    }
  }

  // 5. Intensity Distribution
  console.log("\n📊 5. Intensity Distribution");
  const byIntensity = {};
  mappings.forEach((m) => {
    const level = m.intensityLevel || "null";
    byIntensity[level] = (byIntensity[level] || 0) + 1;
  });
  Object.entries(byIntensity).forEach(([level, count]) => {
    console.log(`   Level ${level}: ${count}`);
  });

  const lowIntensity = mappings.filter(
    (m) => !m.intensityLevel || m.intensityLevel <= 2,
  ).length;
  const highIntensity = mappings.filter(
    (m) => m.intensityLevel && m.intensityLevel > 2,
  ).length;
  console.log(`   Low (1-2, for warmup/cooldown): ${lowIntensity}`);
  console.log(`   High (3+, for main): ${highIntensity}`);

  // 6. Equipment Mappings per Body Part
  console.log('\n🛠️ 6. "없음" Equipment Coverage per Body Part');
  const noEquipmentType = equipmentTypes.find((eq) => eq.name === "없음");

  if (noEquipmentType) {
    for (const bp of bodyParts) {
      const bpMappings = await prisma.bodyPartExerciseMapping.findMany({
        where: { bodyPartId: bp.id, isActive: true },
        include: {
          exerciseTemplate: {
            include: {
              exerciseEquipmentMappings: true,
            },
          },
        },
      });

      const withNoEquipment = bpMappings.filter((m) =>
        m.exerciseTemplate.exerciseEquipmentMappings.some(
          (ee) => ee.equipmentTypeId === noEquipmentType.id,
        ),
      );

      const percentage =
        bpMappings.length > 0
          ? Math.round((withNoEquipment.length / bpMappings.length) * 100)
          : 0;

      console.log(
        `   ${bp.name}: ${withNoEquipment.length}/${bpMappings.length} (${percentage}%)`,
      );

      if (withNoEquipment.length === 0 && bpMappings.length > 0) {
        issues.push(`❌ "${bp.name}" has 0 exercises with "없음" equipment`);
      } else if (percentage < 50) {
        issues.push(`⚠️ "${bp.name}" has low "없음" coverage (${percentage}%)`);
      }
    }
  }

  // 7. Course Generation Simulation
  console.log("\n🎯 7. Course Generation Simulation (60min, 허리, 없음)");
  const backPart = bodyParts.find((bp) => bp.name === "허리");

  if (backPart && noEquipmentType) {
    const backMappings = await prisma.bodyPartExerciseMapping.findMany({
      where: { bodyPartId: backPart.id, isActive: true },
      include: {
        exerciseTemplate: {
          include: {
            exerciseEquipmentMappings: true,
          },
        },
      },
    });

    const withNoEquipment = backMappings.filter((m) =>
      m.exerciseTemplate.exerciseEquipmentMappings.some(
        (ee) => ee.equipmentTypeId === noEquipmentType.id,
      ),
    );

    const low = withNoEquipment.filter(
      (m) => !m.intensityLevel || m.intensityLevel <= 2,
    );
    const high = withNoEquipment.filter(
      (m) => m.intensityLevel && m.intensityLevel > 2,
    );

    console.log(`   Available exercises: ${withNoEquipment.length}`);
    console.log(`   Low intensity: ${low.length}`);
    console.log(`   High intensity: ${high.length}`);

    // Calculate expected times
    const warmupTime = 10;
    const cooldownTime = 10;
    const mainTime = 60 - warmupTime - cooldownTime;

    const warmupExercises = Math.min(2, low.length);
    const cooldownExercises = Math.min(
      1,
      Math.max(0, low.length - warmupExercises),
    );
    const mainExercises =
      high.length +
      Math.max(0, low.length - warmupExercises - cooldownExercises);

    const actualMainTime = Math.min(mainTime, mainExercises * 20);
    const totalTime = warmupTime + actualMainTime + cooldownTime;

    console.log(`\n   Expected distribution:`);
    console.log(`   - Warmup: ${warmupTime}min (${warmupExercises} exercises)`);
    console.log(`   - Main: ${actualMainTime}min (${mainExercises} exercises)`);
    console.log(
      `   - Cooldown: ${cooldownTime}min (${cooldownExercises} exercises)`,
    );
    console.log(`   - Total: ${totalTime}min`);

    if (totalTime < 60) {
      issues.push(`⚠️ 60min course may only generate ${totalTime}min for 허리`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 SUMMARY");
  console.log("=".repeat(60));

  if (issues.length === 0) {
    console.log("\n✅ All checks passed!");
  } else {
    console.log(`\n⚠️ Found ${issues.length} issues:\n`);
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  }

  return issues;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
