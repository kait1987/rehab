import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const bodyParts = await prisma.bodyPart.findMany({
    where: { isActive: true },
  });
  const equipments = await prisma.equipmentType.findMany({
    where: { isActive: true },
  });

  console.log("Body Part | Equipment | Exercise Count");
  console.log("--- | --- | ---");

  for (const bp of bodyParts) {
    for (const eq of equipments) {
      if (eq.name === "없음") continue; // Skip 'None' as it's usually mapped with 'Bodyweight' or specific logic

      const count = await prisma.exerciseTemplate.count({
        where: {
          bodyPartId: bp.id,
          isActive: true,
          exerciseEquipmentMappings: {
            some: {
              equipmentTypeId: eq.id,
            },
          },
        },
      });

      if (count < 2) {
        // Highlight low coverage
        console.log(`${bp.name} | ${eq.name} | ${count} (LOW)`);
      }
    }
    // Check 'Bodyweight' specifically (Mapped as '맨몸' or '없음')
    const bodyweightCount = await prisma.exerciseTemplate.count({
      where: {
        bodyPartId: bp.id,
        isActive: true,
        exerciseEquipmentMappings: {
          some: {
            equipmentTypeId: {
              in: equipments
                .filter((e) => e.name === "맨몸" || e.name === "없음")
                .map((e) => e.id),
            },
          },
        },
      },
    });
    if (bodyweightCount < 2) {
      console.log(`${bp.name} | 맨몸/없음 | ${bodyweightCount} (CRITICAL LOW)`);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
