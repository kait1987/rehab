import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🕵️ Auditing Exercise Content Quality...\n");

  const allExercises = await prisma.exerciseTemplate.findMany();
  const total = allExercises.length;

  let shortDesc = 0;
  let missingInstr = 0;
  let missingPrecaut = 0;
  let lowQualityCount = 0;

  console.log(`Analyzing ${total} exercises...`);

  for (const ex of allExercises) {
    let issues = [];

    // 1. 설명이 너무 짧거나 기본값인지 확인
    if (
      !ex.description ||
      ex.description.length < 10 ||
      ex.description.includes("운동입니다")
    ) {
      shortDesc++;
      issues.push("Short/Default Description");
    }

    // 2. 운동 방법(Instructions) 누락 확인
    if (!ex.instructions || ex.instructions.length < 5) {
      missingInstr++;
      issues.push("Missing Instructions");
    }

    // 3. 주의사항(Precautions) 누락 확인
    if (!ex.precautions || ex.precautions.length < 5) {
      missingPrecaut++;
      issues.push("Missing Precautions");
    }

    if (issues.length > 0) {
      lowQualityCount++;
      // 샘플 출력 (처음 5개만)
      if (lowQualityCount <= 5) {
        console.log(`\n⚠️  [${ex.name}]: ${issues.join(", ")}`);
        if (ex.description) console.log(`    Desc: "${ex.description}"`);
      }
    }
  }

  console.log(`\n================================`);
  console.log(`📊 Quality Audit Results`);
  console.log(`================================`);
  console.log(`Total Exercises: ${total}`);
  console.log(
    `Needs Improvement: ${lowQualityCount} (${((lowQualityCount / total) * 100).toFixed(1)}%)`,
  );
  console.log(`- Poor/Default Descriptions: ${shortDesc}`);
  console.log(`- Missing Instructions: ${missingInstr}`);
  console.log(`- Missing Precautions: ${missingPrecaut}`);

  if (lowQualityCount > 0) {
    console.log(
      `\n💡 Suggestion: Use AI to enrich descriptions, instructions, and precautions for these exercises.`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
