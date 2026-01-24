/**
 * 디버그 스크립트: 코스 생성 전체 흐름 테스트
 */

const { execSync } = require("child_process");

// 먼저 빌드가 필요하므로 prisma client를 직접 사용
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Full course generation debug...\n");

  // 1. Find body part
  const bodyPart = await prisma.bodyPart.findFirst({
    where: { name: "허리" },
  });

  if (!bodyPart) {
    console.log("Body part not found");
    return;
  }

  // 2. Get mappings
  const mappings = await prisma.bodyPartExerciseMapping.findMany({
    where: {
      bodyPartId: bodyPart.id,
      isActive: true,
    },
    include: {
      exerciseTemplate: true,
    },
    orderBy: { priority: "asc" },
  });

  console.log("📦 Raw mappings:", mappings.length);

  // 3. Simulate classify-by-section logic
  const exercises = mappings.map((m) => ({
    exerciseTemplateId: m.exerciseTemplateId,
    exerciseTemplateName: m.exerciseTemplate.name,
    intensityLevel: m.intensityLevel,
    priorityScore: m.priority || 1,
    bodyPartIds: [bodyPart.id],
    section: undefined,
    orderInSection: 0,
    durationMinutes: 10,
    sets: 3,
    reps: 12,
  }));

  // Low intensity (warmup/cooldown candidates)
  const lowIntensity = exercises.filter(
    (ex) => !ex.intensityLevel || ex.intensityLevel <= 2,
  );
  const highIntensity = exercises.filter(
    (ex) => ex.intensityLevel && ex.intensityLevel > 2,
  );

  console.log("\n📊 Intensity classification:");
  console.log(`  Low (1-2): ${lowIntensity.length}`);
  console.log(`  High (3+): ${highIntensity.length}`);

  // Warmup allocation
  let warmupCount = 2;
  if (lowIntensity.length < 3) warmupCount = 1;
  warmupCount = Math.min(warmupCount, lowIntensity.length);

  const warmup = lowIntensity.slice(0, warmupCount);
  console.log(`\n🔥 Warmup: ${warmup.length} exercises`);

  // Remaining after warmup
  const remaining = lowIntensity.slice(warmupCount);
  console.log(`  Remaining low intensity: ${remaining.length}`);

  // Cooldown allocation
  let cooldownCount = 1;
  if (remaining.length >= 3) cooldownCount = 2;
  cooldownCount = Math.min(cooldownCount, remaining.length);

  const mainFromLow = remaining.slice(0, remaining.length - cooldownCount);
  const cooldown = remaining.slice(remaining.length - cooldownCount);

  console.log(`\n❄️ Cooldown: ${cooldown.length} exercises`);
  console.log(`  Main from low intensity: ${mainFromLow.length}`);

  // Main = high intensity + low intensity remainder
  const main = [...highIntensity, ...mainFromLow];
  console.log(
    `\n💪 Main: ${main.length} exercises (${highIntensity.length} high + ${mainFromLow.length} low)`,
  );

  // 4. Simulate time distribution for 60min
  console.log("\n⏱️ Time distribution simulation (60min):");
  console.log(`  Warmup target: 10min (${warmup.length} exercises)`);
  console.log(`  Cooldown target: 10min (${cooldown.length} exercises)`);
  console.log(`  Main target: 40min (${main.length} exercises)`);

  // Calculate actual main time
  let mainTime = 0;
  let exercisesUsed = 0;
  for (const ex of main) {
    const timeForThis = Math.min(20, Math.max(5, 40 - mainTime));
    if (40 - mainTime < 5) break;
    mainTime += timeForThis;
    exercisesUsed++;
    console.log(`    - ${ex.exerciseTemplateName}: ${timeForThis}min`);
    if (mainTime >= 40) break;
  }

  console.log(
    `\n  Main actual: ${mainTime}min with ${exercisesUsed}/${main.length} exercises`,
  );

  const totalActual = 10 + mainTime + 10;
  console.log(`\n📐 Total: ${totalActual}min (expected 60min)`);

  if (totalActual < 60) {
    console.log(`\n⚠️ SHORTFALL: ${60 - totalActual}min missing!`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
