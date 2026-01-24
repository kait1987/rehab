const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Looking for similar exercise names in DB...\n");

  const keywords = ["시티드", "차일드", "어깨", "힙 플렉서", "발목", "손목"];

  for (const keyword of keywords) {
    console.log(`\n🔎 Searching: "${keyword}"`);
    const results = await prisma.exerciseTemplate.findMany({
      where: {
        name: { contains: keyword },
      },
      select: { id: true, name: true },
    });

    if (results.length > 0) {
      results.forEach((r) => console.log(`   Found: ${r.name}`));
    } else {
      console.log(`   No matches found`);
    }
  }

  // Also check for 'Stretch', 'Lunge', 'Row' type exercises
  console.log('\n\n🔎 Searching: "스트레칭"');
  const stretches = await prisma.exerciseTemplate.findMany({
    where: {
      name: { contains: "스트레칭" },
    },
    select: { name: true },
  });
  stretches.forEach((r) => console.log(`   ${r.name}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
