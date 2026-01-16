import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const bodyPartsToCheck = ["골반", "손목", "허리", "어깨", "무릎", "목"];
  const bodyParts = await prisma.bodyPart.findMany({
    where: { name: { in: bodyPartsToCheck } },
  });

  const equipments = await prisma.equipmentType.findMany({
    where: { name: { in: ["맨몸", "없음"] } },
  });
  const equipmentIds = equipments.map((e) => e.id);

  console.log("Body Part | Exercise Name | Intensity | Is Main Capable (>2)?");
  console.log("--- | --- | --- | ---");

  for (const bp of bodyParts) {
    const exercises = await prisma.exerciseTemplate.findMany({
      where: {
        bodyPartId: bp.id,
        isActive: true,
        exerciseEquipmentMappings: {
          some: {
            equipmentTypeId: { in: equipmentIds },
          },
        },
      },
      include: {
        bodyPartExerciseMappings: {
          where: { bodyPartId: bp.id },
        }, // To check if override exists
      },
    });

    if (exercises.length === 0) {
      console.log(`${bp.name} | (No Exercises) | - | -`);
      continue;
    }

    for (const ex of exercises) {
      // Check if mapping overrides intensity
      const mapping = ex.bodyPartExerciseMappings[0];
      const intensity = mapping?.intensityLevel ?? ex.intensityLevel ?? 0;

      const painRange = mapping?.painLevelRange ?? "all";

      console.log(
        `${bp.name} | ${ex.name} | ${intensity} | ${
          intensity > 2 ? "YES" : "NO"
        } | ${painRange}`,
      );
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
