const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Fixing equipment mappings...\n");

  // 1. Check all equipment types
  const allEquipment = await prisma.equipmentType.findMany();
  console.log("📋 All equipment types:");
  allEquipment.forEach((eq) => {
    console.log(`  - ${eq.name} (${eq.id})`);
  });

  // 2. Check if "없음" equipment exists
  let noEquipment = allEquipment.find((eq) => eq.name === "없음");

  if (!noEquipment) {
    console.log('\nCreating "없음" equipment...');
    noEquipment = await prisma.equipmentType.create({
      data: {
        name: "없음",
      },
    });
    console.log(`Created: ${noEquipment.id}\n`);
  } else {
    console.log(`\n"없음" already exists: ${noEquipment.id}\n`);
  }

  // 3. Find "맨몸" equipment
  const bodyweight = allEquipment.find((eq) => eq.name === "맨몸");
  console.log(`"맨몸" equipment: ${bodyweight ? bodyweight.id : "NOT FOUND"}`);

  // 4. Find exercises that have "맨몸" and also add "없음" to them
  if (bodyweight && noEquipment) {
    const exercisesWithBodyweight =
      await prisma.exerciseEquipmentMapping.findMany({
        where: { equipmentTypeId: bodyweight.id },
        select: { exerciseTemplateId: true },
      });

    console.log(`\n운동 with "맨몸": ${exercisesWithBodyweight.length}`);

    let added = 0;
    for (const mapping of exercisesWithBodyweight) {
      const exists = await prisma.exerciseEquipmentMapping.findFirst({
        where: {
          exerciseTemplateId: mapping.exerciseTemplateId,
          equipmentTypeId: noEquipment.id,
        },
      });

      if (!exists) {
        await prisma.exerciseEquipmentMapping.create({
          data: {
            exerciseTemplateId: mapping.exerciseTemplateId,
            equipmentTypeId: noEquipment.id,
          },
        });
        added++;
      }
    }
    console.log(`Added "없음" mapping to ${added} bodyweight exercises`);
  }

  // 5. Also add "없음" to exercises that have "매트"
  const matEquipment = allEquipment.find((eq) => eq.name === "매트");

  if (matEquipment && noEquipment) {
    const exercisesWithMat = await prisma.exerciseEquipmentMapping.findMany({
      where: { equipmentTypeId: matEquipment.id },
      select: { exerciseTemplateId: true },
    });

    console.log(`\n운동 with "매트": ${exercisesWithMat.length}`);

    let added = 0;
    for (const mapping of exercisesWithMat) {
      const exists = await prisma.exerciseEquipmentMapping.findFirst({
        where: {
          exerciseTemplateId: mapping.exerciseTemplateId,
          equipmentTypeId: noEquipment.id,
        },
      });

      if (!exists) {
        await prisma.exerciseEquipmentMapping.create({
          data: {
            exerciseTemplateId: mapping.exerciseTemplateId,
            equipmentTypeId: noEquipment.id,
          },
        });
        added++;
      }
    }
    console.log(`Added "없음" mapping to ${added} mat exercises`);
  }

  console.log("\n✅ Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
