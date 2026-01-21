import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📊 Exercise Database Distribution Analysis\n");

  const total = await prisma.exerciseTemplate.count();
  console.log(`Total Exercises: ${total}\n`);

  // 1. Body Part Distribution
  console.log("--- By Body Part ---");
  const exercises = await prisma.exerciseTemplate.findMany({
    include: { bodyPart: true },
  });

  const byBodyPart: Record<string, number> = {};
  exercises.forEach((ex) => {
    const bpName = ex.bodyPart.name;
    byBodyPart[bpName] = (byBodyPart[bpName] || 0) + 1;
  });

  Object.entries(byBodyPart)
    .sort(([, a], [, b]) => b - a)
    .forEach(([name, count]) => {
      console.log(`${name.padEnd(10)}: ${count} exercises`);
    });

  // 2. Equipment Distribution
  console.log("\n--- By Equipment ---");
  // This requires a bit more query logic or fetching mappings
  const equipmentMappings = await prisma.exerciseEquipmentMapping.findMany({
    include: { equipmentType: true },
  });

  const byEquipment: Record<string, number> = {};
  equipmentMappings.forEach((m) => {
    const eqName = m.equipmentType.name;
    byEquipment[eqName] = (byEquipment[eqName] || 0) + 1;
  });

  Object.entries(byEquipment)
    .sort(([, a], [, b]) => b - a)
    .forEach(([name, count]) => {
      console.log(`${name.padEnd(10)}: ${count} exercises`);
    });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
