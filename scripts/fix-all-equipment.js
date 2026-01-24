const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Adding "없음" equipment to all exercises...\n');

  // 1. Get "없음" equipment ID
  const noEquipment = await prisma.equipmentType.findFirst({
    where: { name: "없음" },
  });

  if (!noEquipment) {
    console.log('❌ "없음" equipment not found!');
    return;
  }

  console.log(`"없음" ID: ${noEquipment.id}\n`);

  // 2. Get all exercises
  const exercises = await prisma.exerciseTemplate.findMany({
    include: {
      exerciseEquipmentMappings: true,
    },
  });

  console.log(`Total exercises: ${exercises.length}`);

  // 3. Add "없음" to exercises that can be done without equipment
  // These include: mat exercises, bodyweight exercises, stretches
  let added = 0;
  let skipped = 0;

  for (const exercise of exercises) {
    // Check if already has "없음"
    const hasNoEquipment = exercise.exerciseEquipmentMappings.some(
      (m) => m.equipmentTypeId === noEquipment.id,
    );

    if (hasNoEquipment) {
      skipped++;
      continue;
    }

    // Check current equipment
    const currentEquipment = exercise.exerciseEquipmentMappings.map(
      (m) => m.equipmentTypeId,
    );

    // Get equipment names for this exercise
    const equipmentNames = await prisma.exerciseEquipmentMapping.findMany({
      where: { exerciseTemplateId: exercise.id },
      include: { equipmentType: true },
    });

    const names = equipmentNames.map((e) => e.equipmentType.name);

    // Add "없음" if exercise uses: 맨몸, 매트, 수건, or is a stretch
    const isBodyweightFriendly =
      names.some((n) => ["맨몸", "매트", "수건"].includes(n)) ||
      exercise.name.includes("스트레칭") ||
      exercise.name.includes("스트레치");

    if (isBodyweightFriendly || names.length === 0) {
      await prisma.exerciseEquipmentMapping.create({
        data: {
          exerciseTemplateId: exercise.id,
          equipmentTypeId: noEquipment.id,
        },
      });
      console.log(`✅ Added: ${exercise.name}`);
      added++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Added "없음": ${added}`);
  console.log(`   Already had "없음": ${skipped}`);
  console.log(`   Total: ${added + skipped}`);

  console.log("\n✅ Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
