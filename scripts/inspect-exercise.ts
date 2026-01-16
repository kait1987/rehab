import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const exerciseName = "브릿지 (Glute Bridge)";
  const exercise = await prisma.exerciseTemplate.findFirst({
    where: { name: exerciseName },
    include: {
      exerciseEquipmentMappings: {
        include: { equipmentType: true },
      },
      bodyPartExerciseMappings: {
        include: { bodyPart: true },
      },
      bodyPart: true,
    },
  });

  if (!exercise) {
    console.log(`Exercise '${exerciseName}' not found.`);
    return;
  }

  console.log(`Exercise: ${exercise.name}`);
  console.log(`Difficulty Score: ${exercise.difficultyScore}`);
  console.log(`Intensity Level: ${exercise.intensityLevel}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
