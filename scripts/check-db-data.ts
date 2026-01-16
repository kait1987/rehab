import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Body Parts ===");
  const bodyParts = await prisma.bodyPart.findMany({
    where: { isActive: true },
  });
  bodyParts.forEach((bp) => console.log(`${bp.id}: ${bp.name}`));

  console.log("\n=== Equipment Types ===");
  const equipments = await prisma.equipmentType.findMany({
    where: { isActive: true },
  });
  equipments.forEach((eq) => console.log(`${eq.id}: ${eq.name}`));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
