const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Fixing remaining body parts: 발목, 팔\n");

  const noEquipment = await prisma.equipmentType.findFirst({
    where: { name: "없음" },
  });

  if (!noEquipment) {
    console.log('❌ "없음" equipment not found!');
    return;
  }

  // Get body parts with low coverage
  const bodyParts = await prisma.bodyPart.findMany({
    where: { name: { in: ["발목", "팔"] } },
  });

  let totalAdded = 0;

  for (const bp of bodyParts) {
    console.log(`\n📍 ${bp.name}:`);

    // Get all exercises for this body part
    const mappings = await prisma.bodyPartExerciseMapping.findMany({
      where: { bodyPartId: bp.id, isActive: true },
      include: {
        exerciseTemplate: {
          include: {
            exerciseEquipmentMappings: {
              include: { equipmentType: true },
            },
          },
        },
      },
    });

    for (const mapping of mappings) {
      const hasNoEquipment =
        mapping.exerciseTemplate.exerciseEquipmentMappings.some(
          (ee) => ee.equipmentTypeId === noEquipment.id,
        );

      if (!hasNoEquipment) {
        // Add "없음" mapping
        await prisma.exerciseEquipmentMapping.create({
          data: {
            exerciseTemplateId: mapping.exerciseTemplateId,
            equipmentTypeId: noEquipment.id,
          },
        });

        const currentEquipment =
          mapping.exerciseTemplate.exerciseEquipmentMappings
            .map((ee) => ee.equipmentType.name)
            .join(", ");

        console.log(
          `   ✅ Added: ${mapping.exerciseTemplate.name} (was: ${currentEquipment || "none"})`,
        );
        totalAdded++;
      }
    }
  }

  console.log(`\n📊 Total added: ${totalAdded}`);
  console.log("✅ Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
