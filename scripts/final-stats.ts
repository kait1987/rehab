import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const t = await p.exerciseTemplate.count();
  const d = await p.exerciseTemplate.count({
    where: { description: { not: null } },
  });
  const i = await p.exerciseTemplate.count({
    where: { instructions: { not: null } },
  });
  const pr = await p.exerciseTemplate.count({
    where: { precautions: { not: null } },
  });

  console.log("=== Final Content Stats ===");
  console.log(`Total Exercises: ${t}`);
  console.log(`With Description: ${d} (${((d / t) * 100).toFixed(0)}%)`);
  console.log(`With Instructions: ${i} (${((i / t) * 100).toFixed(0)}%)`);
  console.log(`With Precautions: ${pr} (${((pr / t) * 100).toFixed(0)}%)`);
}

main().finally(() => p.$disconnect());
