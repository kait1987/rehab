import { mergeBodyParts } from "../lib/algorithms/merge-body-parts";

console.log("Check Source:", mergeBodyParts.toString().substring(0, 200));
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const pelvis = await prisma.bodyPart.findFirst({ where: { name: "골반" } });
  const bodyweight = await prisma.equipmentType.findFirst({
    where: { name: "맨몸" },
  });

  if (!pelvis || !bodyweight) {
    console.error("Data missing");
    return;
  }

  const request = {
    bodyParts: [
      {
        bodyPartId: pelvis.id,
        bodyPartName: pelvis.name,
        painLevel: 5,
      },
    ],
    equipmentAvailable: [bodyweight.id],
    painLevel: 5,
    experienceLevel: "beginner" as const,
    totalDurationMinutes: 90 as const,
  };

  console.log("Running merge with:", JSON.stringify(request, null, 2));

  const result = await mergeBodyParts(request);

  console.log("Result Stats:", result.stats);
  console.log("Warnings:", result.warnings);
  console.log(
    "Exercises:",
    result.exercises.map(
      (e) =>
        `${e.exerciseTemplateName} [${e.section}] (Int: ${e.intensityLevel})`,
    ),
  );
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
