import type { MergedExercise } from "@/types/body-part-merge";

/**
 * 시간 배분 설정
 */
export interface TimeDistributionConfig {
  /** Warmup 시간 (분) */
  warmupTime: number;
  /** Main 시간 (분) */
  mainTime: number;
  /** Cooldown 시간 (분) */
  cooldownTime: number;
  /** 운동당 최소 시간 (분) */
  minExerciseTime: number;
  /** Main 운동당 최대 시간 (분) */
  maxMainExerciseTime: number;
  /** Warmup/Cooldown 운동당 최대 시간 (분) */
  maxWarmupCooldownTime: number;
}

/**
 * 총 시간별 시간 배분 설정
 */
const TIME_DISTRIBUTION_BY_DURATION: Record<
  60 | 90 | 120,
  {
    warmupTime: number;
    cooldownTime: number;
  }
> = {
  60: {
    warmupTime: 10,
    cooldownTime: 10,
  },
  90: {
    warmupTime: 12,
    cooldownTime: 15,
  },
  120: {
    warmupTime: 15,
    cooldownTime: 15,
  },
};

/**
 * 기본 시간 배분 설정
 */
const DEFAULT_TIME_CONFIG: TimeDistributionConfig = {
  warmupTime: 12,
  mainTime: 60,
  cooldownTime: 15,
  minExerciseTime: 5,
  maxMainExerciseTime: 20,
  maxWarmupCooldownTime: 10,
};

/**
 * 섹션별 기본 sets/reps 설정
 */
const DEFAULT_SETS_REPS_BY_SECTION = {
  warmup: { sets: 1, reps: 10 },
  main: { sets: 2, reps: 12 },
  cooldown: { sets: 1, reps: 10 },
} as const;

/**
 * 세트/횟수 계산 결과
 */
interface SetsAndRepsResult {
  sets: number;
  reps: number;
}

/**
 * 세트/횟수 자동 계산 (Strict Logic)
 *
 * - sets 최대 5
 * - reps 최대 20
 * - Math.sqrt 스케일링 적용
 */
function calculateSetsAndReps(
  originalDuration: number | undefined,
  newDuration: number,
  originalSets: number | undefined,
  originalReps: number | undefined,
  section: "warmup" | "main" | "cooldown",
): SetsAndRepsResult {
  const defaultValues = DEFAULT_SETS_REPS_BY_SECTION[section];
  const baseSets = originalSets ?? defaultValues.sets;
  const baseReps = originalReps ?? defaultValues.reps;

  if (!originalDuration || originalDuration === 0) {
    return { sets: baseSets, reps: baseReps };
  }

  // 시간 비율 계산
  const timeRatio = newDuration / originalDuration;

  // 제곱근 스케일링 적용 (완만한 증가)
  const scaleFactor = Math.sqrt(timeRatio);

  let adjustedSets = Math.round(baseSets * scaleFactor);
  let adjustedReps = Math.round(baseReps * scaleFactor);

  // 최소값 보장
  adjustedSets = Math.max(1, adjustedSets);
  adjustedReps = Math.max(5, adjustedReps);

  // 최대값 제한 (Strict Limit)
  adjustedSets = Math.min(5, adjustedSets);
  adjustedReps = Math.min(20, adjustedReps);

  return {
    sets: adjustedSets,
    reps: adjustedReps,
  };
}

/**
 * 시간 배분 (Strict Logic)
 *
 * 1. 웜업: 5/10/15분 고정, 최대 2개 운동
 * 2. 쿨다운: 5분 선예약, 필수 1개 보장
 * 3. 메인: 남은 시간 배분
 */
export function distributeTime(
  exercises: {
    warmup: MergedExercise[];
    main: MergedExercise[];
    cooldown: MergedExercise[];
  },
  totalDurationMinutes: 60 | 90 | 120,
  config: Partial<TimeDistributionConfig> = {},
): MergedExercise[] {
  // 1. 설정 로드
  const durationConfig = TIME_DISTRIBUTION_BY_DURATION[totalDurationMinutes];
  const rawWarmupTarget = config.warmupTime ?? durationConfig.warmupTime;

  // 2. 웜업 목표 시간 산정 (5분 단위 반올림 + Clamp 5~15)
  // 예: 12분 -> 10분, 8분 -> 10분, 3분 -> 5분, 18분 -> 15분
  const warmupTarget = Math.min(
    15,
    Math.max(5, Math.round(rawWarmupTarget / 5) * 5),
  );

  // 3. 쿨다운 선예약 (5분)
  const cooldownReserve = 5;

  // 4. 메인 목표 시간
  const mainTarget = totalDurationMinutes - warmupTarget - cooldownReserve;

  const result: MergedExercise[] = [];
  let orderCounter = 0;

  // ==================================================================================
  // [Warmup Generation] Strict Rules: Max 2 items, Fixed durations
  // ==================================================================================
  if (exercises.warmup.length > 0) {
    // 1번째 웜업
    const firstWarmupDuration = warmupTarget === 5 ? 5 : 10;
    const firstExercise = exercises.warmup[0];
    const { sets: sets1, reps: reps1 } = calculateSetsAndReps(
      firstExercise.durationMinutes,
      firstWarmupDuration,
      firstExercise.sets,
      firstExercise.reps,
      "warmup",
    );
    result.push({
      ...firstExercise,
      section: "warmup",
      orderInSection: orderCounter++,
      durationMinutes: firstWarmupDuration,
      sets: sets1,
      reps: reps1,
    });

    // 2번째 웜업 (목표가 15분일 때만 5분 추가)
    if (warmupTarget === 15 && exercises.warmup.length > 1) {
      const secondExercise = exercises.warmup[1]; // 다른 운동 사용 권장
      const { sets: sets2, reps: reps2 } = calculateSetsAndReps(
        secondExercise.durationMinutes,
        5,
        secondExercise.sets,
        secondExercise.reps,
        "warmup",
      );
      result.push({
        ...secondExercise,
        section: "warmup",
        orderInSection: orderCounter++,
        durationMinutes: 5,
        sets: sets2,
        reps: reps2,
      });
    }
  }

  // ==================================================================================
  // [Main Generation] Fill remaining time
  // ==================================================================================
  let accumulatedMainTime = 0;
  let mainIndex = 0;

  // 메인 운동이 없으면 경고(실제로는 merge 단계에서 처리됨)
  if (exercises.main.length > 0) {
    while (accumulatedMainTime < mainTarget) {
      const sourceExercise = exercises.main[mainIndex % exercises.main.length];
      const remainingTime = mainTarget - accumulatedMainTime;

      // 이번 운동에 할당할 시간
      let timeForThisExercise = Math.min(
        20, // maxMainExerciseTime
        Math.max(5, remainingTime), // minExerciseTime
      );

      // 남은 시간이 5분 미만이면 루프 종료 (마지막 운동에 합치거나 버림)
      // 여기서는 버림 정책 (쿨다운 확보가 더 중요)
      if (remainingTime < 5) break;

      // 만약 남은 시간이 5~9분 사이라면, 그냥 남은 시간 다 씀
      if (remainingTime < 10) {
        timeForThisExercise = remainingTime;
      }

      const { sets, reps } = calculateSetsAndReps(
        sourceExercise.durationMinutes,
        timeForThisExercise,
        sourceExercise.sets,
        sourceExercise.reps,
        "main",
      );

      result.push({
        ...sourceExercise,
        section: "main",
        orderInSection: orderCounter++,
        durationMinutes: timeForThisExercise,
        sets,
        reps,
      });

      accumulatedMainTime += timeForThisExercise;
      mainIndex++;

      if (mainIndex > 20) break; // Safety break
    }
  }

  // ==================================================================================
  // [Cooldown Generation] Guarantee 1 item (5 min)
  // ==================================================================================
  let cooldownSource = exercises.cooldown[0];

  // 쿨다운 후보가 없으면 웜업(저강도) 재사용
  if (!cooldownSource && exercises.warmup.length > 0) {
    cooldownSource =
      exercises.warmup.find((ex) => (ex.intensityLevel || 0) <= 2) ||
      exercises.warmup[0];
  }

  // 그래도 없으면 하드코딩
  if (!cooldownSource) {
    cooldownSource = {
      exerciseTemplateId: "fallback-stretch",
      exerciseTemplateName: "전신 스트레칭",
      bodyPartIds: [],
      priorityScore: 0,
      section: "cooldown",
      orderInSection: 0,
      durationMinutes: 5,
      sets: 1,
      reps: 1,
      intensityLevel: 1,
      difficultyScore: 1,
      description: "편안한 자세로 전신을 이완합니다.",
      instructions: "호흡을 깊게 하며 몸의 긴장을 풉니다.",
      precautions: "통증이 없는 범위 내에서 진행합니다.",
    };
  }

  // 쿨다운 1개 강제 추가 (5분)
  // *참고: 쿨다운을 더 늘리고 싶으면 여기서 로직 추가 가능하지만,
  // 요구사항은 "최소 1개, 5분 항상 보장"이므로 1개만 확실히 넣음.
  const { sets: cdSets, reps: cdReps } = calculateSetsAndReps(
    cooldownSource.durationMinutes,
    cooldownReserve,
    cooldownSource.sets,
    cooldownSource.reps,
    "cooldown",
  );

  result.push({
    ...cooldownSource,
    section: "cooldown",
    orderInSection: orderCounter++,
    durationMinutes: cooldownReserve,
    sets: cdSets,
    reps: cdReps,
  });

  // ==================================================================================
  // [Safety Checks]
  // ==================================================================================
  const finalWarmupTime = result
    .filter((e) => e.section === "warmup")
    .reduce((s, e) => s + e.durationMinutes, 0);
  const finalCooldownTime = result
    .filter((e) => e.section === "cooldown")
    .reduce((s, e) => s + e.durationMinutes, 0);
  const finalTotalTime = result.reduce((s, e) => s + e.durationMinutes, 0);

  if (finalWarmupTime > 15) {
    console.error(
      `[DistributeTime Error] Warmup exceeded 15m: ${finalWarmupTime}m`,
    );
    // 필요시 throw new Error("Warmup time limit exceeded");
  }
  if (finalWarmupTime === 20) {
    throw new Error("CRITICAL: Warmup time is 20m (Strictly Forbidden)");
  }
  if (finalCooldownTime < 5) {
    throw new Error("CRITICAL: Cooldown time missing or less than 5m");
  }

  // 총 시간이 목표보다 많이 초과되면 마지막 메인 운동을 줄임 (Optional)
  if (finalTotalTime > totalDurationMinutes) {
    // 간단한 보정 로직: 초과분만큼 메인에서 뺌 (구현 생략 가능, 현재 로직상 크게 초과 안함)
  }

  return result;
}
