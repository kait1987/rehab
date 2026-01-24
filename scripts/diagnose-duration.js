const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Diagnosing course generation issue...\n");

  // Check intensity levels distribution
  const byIntensity = await prisma.$queryRaw`
    SELECT 
      bpem.intensity_level,
      COUNT(*)::int as count
    FROM body_part_exercise_mappings bpem
    WHERE bpem.is_active = true
    GROUP BY bpem.intensity_level
    ORDER BY bpem.intensity_level
  `;

  console.log("📊 Exercises by Intensity Level (from mappings):");
  console.log(byIntensity);

  // Check body parts with low intensity exercises
  const lowIntensity = await prisma.$queryRaw`
    SELECT 
      bp.name as body_part,
      COUNT(*)::int as low_intensity_count
    FROM body_part_exercise_mappings bpem
    JOIN body_parts bp ON bpem.body_part_id = bp.id
    WHERE bpem.is_active = true AND bpem.intensity_level <= 2
    GROUP BY bp.name
    ORDER BY low_intensity_count DESC
  `;

  console.log(
    "\n📊 Body Parts with Low Intensity (warmup/cooldown) Exercises:",
  );
  console.log(lowIntensity);

  // Check total exercises per body part
  const byBodyPart = await prisma.$queryRaw`
    SELECT 
      bp.name as body_part,
      COUNT(*)::int as total_exercises
    FROM body_part_exercise_mappings bpem
    JOIN body_parts bp ON bpem.body_part_id = bp.id
    WHERE bpem.is_active = true
    GROUP BY bp.name
    ORDER BY total_exercises DESC
  `;

  console.log("\n📊 Total Exercises per Body Part:");
  console.log(byBodyPart);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
