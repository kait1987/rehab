import { PrismaClient } from "@prisma/client";
import { mergeBodyParts } from "../src/lib/algorithms/merge-body-parts";
import { MergedExercise } from "../src/types/body-part-merge";

const prisma = new PrismaClient({
  log: ["error", "warn"], // Only log errors and warnings, not queries
});

import fs from "fs";
import path from "path";

// ... existing code ...

const TEST_ITERATIONS = 50; // 테스트 횟수
const DURATIONS = [60, 90, 120] as const;

interface FailureLog {
  iteration: number;
  params: {
    duration: number;
    bodyParts: string[];
    equipment: string[];
  };
  reason: string;
}

async function main() {
  console.log(`🚀 코스 생성 퍼즈 테스트 시작 (${TEST_ITERATIONS}회 반복)...`);

  // 1. 데이터 로드
  const bodyParts = await prisma.bodyPart.findMany({
    where: { isActive: true },
  });
  const equipments = await prisma.equipmentType.findMany({
    where: { isActive: true },
  });

  if (bodyParts.length === 0 || equipments.length === 0) {
    console.error("❌ 데이터베이스에 부위 또는 기구 데이터가 없습니다.");
    return;
  }

  const failures: FailureLog[] = [];
  let passedCount = 0;

  for (let i = 0; i < TEST_ITERATIONS; i++) {
    // 2. 랜덤 파라미터 생성
    const duration = DURATIONS[Math.floor(Math.random() * DURATIONS.length)];

    // 랜덤 부위 (1~3개)
    const numBodyParts = Math.floor(Math.random() * 3) + 1;
    const selectedBodyParts = shuffle(bodyParts).slice(0, numBodyParts);

    // 랜덤 기구 (없음/맨몸 포함 1~5개)
    const numEquipments = Math.floor(Math.random() * 5) + 1;
    const selectedEquipments = shuffle(equipments).slice(0, numEquipments);

    // 맨몸은 항상 포함 (현실적 시나리오)
    if (
      !selectedEquipments.some((e) => e.name === "맨몸" || e.name === "없음")
    ) {
      const bodyweight = equipments.find(
        (e) => e.name === "맨몸" || e.name === "없음",
      );
      if (bodyweight) selectedEquipments.push(bodyweight);
    }

    const mergeRequest = {
      bodyParts: selectedBodyParts.map((bp) => ({
        bodyPartId: bp.id,
        painLevel: 5,
        bodyPartName: bp.name,
      })),
      equipmentAvailable: selectedEquipments.map((e) => e.name), // mergeBodyParts expects Names
      painLevel: 5,
      experienceLevel: "beginner" as const,
      totalDurationMinutes: duration,
    };

    try {
      // 3. 코스 생성 실행
      const result = await mergeBodyParts(mergeRequest);

      // 4. 검증 (Validation)
      const exercises = result.exercises;
      const warmup = exercises.filter((e) => e.section === "warmup");
      const main = exercises.filter((e) => e.section === "main");
      const cooldown = exercises.filter((e) => e.section === "cooldown");

      const errors: string[] = [];

      // 4-1. 섹션 누락 검사
      if (warmup.length === 0) errors.push("Warmup 섹션이 빔");
      if (main.length === 0) errors.push("Main 섹션이 빔");
      if (cooldown.length === 0) errors.push("Cooldown 섹션이 빔");

      // 4-2. 쿨다운 개수/시간 검사
      // 90/120분인 경우 쿨다운 15분 필수 -> 운동 개수가 적으면 시간은 맞지만 개수가 1개일 수 있음 (OK)
      const cooldownTime = cooldown.reduce(
        (sum, e) => sum + (e.durationMinutes || 0),
        0,
      );
      if (duration >= 90 && cooldownTime < 15)
        errors.push(
          `90/120분 코스인데 쿨다운 시간이 부족함 (${cooldownTime}분)`,
        );
      if (duration === 60 && cooldownTime < 10)
        errors.push(`60분 코스인데 쿨다운 시간이 부족함 (${cooldownTime}분)`);

      // 4-3. 웜업 세트/횟수 검사
      const invalidWarmup = warmup.find(
        (e) => (e.sets || 0) > 2 || (e.reps || 0) > 12,
      );
      if (invalidWarmup)
        errors.push(
          `웜업 세트/횟수 초과 발견: ${invalidWarmup.exerciseTemplateName} (${invalidWarmup.sets}세트 ${invalidWarmup.reps}회)`,
        );

      // 4-4. 총 시간 오차 검사 (허용범위 ±5분)
      const totalTime = result.totalDuration; // mergeBodyParts returns totalDuration
      if (Math.abs(totalTime - duration) > 5) {
        errors.push(
          `총 시간 오차 큼: 목표 ${duration}분 vs 실제 ${totalTime}분`,
        );
      }

      if (errors.length > 0) {
        failures.push({
          iteration: i + 1,
          params: {
            duration,
            bodyParts: selectedBodyParts.map((b) => b.name),
            equipment: selectedEquipments.map((e) => e.name),
          },
          reason: errors.join(", "),
        });
        process.stdout.write("F");
      } else {
        passedCount++;
        process.stdout.write(".");
      }
    } catch (error) {
      failures.push({
        iteration: i + 1,
        params: {
          duration,
          bodyParts: selectedBodyParts.map((b) => b.name),
          equipment: selectedEquipments.map((e) => e.name),
        },
        reason: `CRASH: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
      process.stdout.write("E");
    }
  }

  console.log("\n\n📊 테스트 결과");
  console.log(`성공: ${passedCount} / ${TEST_ITERATIONS}`);
  console.log(`실패: ${failures.length} / ${TEST_ITERATIONS}`);

  if (failures.length > 0) {
    console.log("\n❌ 실패 케이스 상세:");
    failures.forEach((f) => {
      console.log(`\n[Iteration ${f.iteration}] ${f.reason}`);
      console.log(`  Duration: ${f.params.duration}분`);
      console.log(`  BodyParts: ${f.params.bodyParts.join(", ")}`);
      console.log(`  Equipment: ${f.params.equipment.join(", ")}`);
    });

    const failureLogPath = path.join(process.cwd(), "fuzz_failures.json");
    fs.writeFileSync(failureLogPath, JSON.stringify(failures, null, 2));
    console.log(`\n💾 실패 로그가 ${failureLogPath}에 저장되었습니다.`);
  } else {
    console.log("\n✨ 모든 랜덤 시나리오 통과!");
  }
}

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
