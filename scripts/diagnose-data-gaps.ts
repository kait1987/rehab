import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 운동 데이터 진단 시작...");

  // 1. 모든 부위 조회
  const bodyParts = await prisma.bodyPart.findMany({
    orderBy: { name: "asc" },
  });

  console.log(
    `\n총 ${bodyParts.length}개 부위 발견: ${bodyParts
      .map((b) => b.name)
      .join(", ")}`,
  );
  console.log(
    "\n----------------------------------------------------------------",
  );
  console.log(
    "부위명".padEnd(10) +
      "| 총개수".padEnd(8) +
      "| 강도1(저)".padEnd(10) +
      "| 강도2(중)".padEnd(10) +
      "| 강도3(고)".padEnd(10) +
      "| 강도4(초고)".padEnd(12) +
      "| 상태",
  );
  console.log(
    "----------------------------------------------------------------",
  );

  const gaps: string[] = [];

  for (const bp of bodyParts) {
    // 해당 부위의 매핑된 운동들 조회 (isActive: true 인 것만)
    const mappings = await prisma.bodyPartExerciseMapping.findMany({
      where: {
        bodyPartId: bp.id,
        isActive: true,
        exerciseTemplate: {
          isActive: true,
        },
      },
      include: {
        exerciseTemplate: true,
      },
    });

    const total = mappings.length;
    const intensityCounts = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      others: 0,
    };

    mappings.forEach((m) => {
      const level = m.intensityLevel || m.exerciseTemplate.intensityLevel || 0;
      if (level >= 1 && level <= 4) {
        intensityCounts[level as 1 | 2 | 3 | 4]++;
      } else {
        intensityCounts.others++;
      }
    });

    // 진단 로직
    // 1. 총 개수 부족 (최소 5개는 있어야 코스 구성 원활)
    // 2. 저강도(1-2) 부족 (웜업/쿨다운 불가)
    // 3. 고강도(3-4) 부족 (메인 운동 불가)
    let status = "✅ 양호";
    const lowIntensity = intensityCounts[1] + intensityCounts[2];
    const highIntensity = intensityCounts[3] + intensityCounts[4];

    if (total < 5) {
      status = "❌ 절대 부족";
      gaps.push(`${bp.name}: 전체 운동 부족 (현재 ${total}개)`);
    } else if (lowIntensity < 2) {
      status = "⚠️ 웜업 부족";
      gaps.push(
        `${bp.name}: 저강도(웜업/쿨다운) 운동 부족 (현재 ${lowIntensity}개)`,
      );
    } else if (highIntensity < 2) {
      status = "⚠️ 메인 부족";
      gaps.push(`${bp.name}: 고강도(메인) 운동 부족 (현재 ${highIntensity}개)`);
    }

    console.log(
      bp.name.padEnd(10) +
        `| ${total}`.padEnd(8) +
        `| ${intensityCounts[1]}`.padEnd(10) +
        `| ${intensityCounts[2]}`.padEnd(10) +
        `| ${intensityCounts[3]}`.padEnd(10) +
        `| ${intensityCounts[4]}`.padEnd(12) +
        `| ${status}`,
    );
  }

  console.log(
    "----------------------------------------------------------------",
  );
  console.log("\n📋 진단 요약:");
  if (gaps.length === 0) {
    console.log("모든 부위의 데이터가 충분합니다! 🎉");
  } else {
    console.log(`총 ${gaps.length}개의 부족 항목이 발견되었습니다.`);
    gaps.forEach((gap) => console.log(`- ${gap}`));
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
