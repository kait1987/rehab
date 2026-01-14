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
    warmupTime: 15,
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
  warmupTime: 15,
  mainTime: 60, // 90분 코스 기준, 실제로는 계산됨
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
 * 세트/횟수 자동 계산
 *
 * 운동 시간이 변경되면 sets와 reps를 비례적으로 조정합니다.
 *
 * @param originalDuration 원래 운동 시간 (분)
 * @param newDuration 새로운 운동 시간 (분)
 * @param originalSets 원래 세트 수 (없으면 기본값 사용)
 * @param originalReps 원래 반복 횟수 (없으면 기본값 사용)
 * @param section 섹션 (warmup, main, cooldown)
 * @returns 조정된 sets와 reps
 */
function calculateSetsAndReps(
  originalDuration: number | undefined,
  newDuration: number,
  originalSets: number | undefined,
  originalReps: number | undefined,
  section: "warmup" | "main" | "cooldown",
): SetsAndRepsResult {
  // 기본값 가져오기
  const defaultValues = DEFAULT_SETS_REPS_BY_SECTION[section];
  const baseSets = originalSets ?? defaultValues.sets;
  const baseReps = originalReps ?? defaultValues.reps;

  // 원래 시간이 없거나 0이면 기본값 반환
  if (!originalDuration || originalDuration === 0) {
    return {
      sets: baseSets,
      reps: baseReps,
    };
  }

  // 시간 비율 계산
  const timeRatio = newDuration / originalDuration;

  // 비례적으로 조정 (너무 급격한 증가 방지를 위해 제곱근 사용)
  // 예: 시간이 4배 늘어나면 세트는 2배만 증가
  const scaleFactor = Math.sqrt(timeRatio);

  let adjustedSets = Math.round(baseSets * scaleFactor);
  let adjustedReps = Math.round(baseReps * scaleFactor);

  // 최소값 보장
  adjustedSets = Math.max(1, adjustedSets);
  adjustedReps = Math.max(5, adjustedReps);

  // 최대값 제한 (안전상)
  // 사용자 피드백 반영: 10세트는 너무 많음 -> 5세트로 제한
  adjustedSets = Math.min(5, adjustedSets);
  adjustedReps = Math.min(20, adjustedReps);

  return {
    sets: adjustedSets,
    reps: adjustedReps,
  };
}

/**
 * 시간 배분
 *
 * totalDurationMinutes에 맞춰 각 운동의 duration, sets, reps를 조정합니다.
 * 우선순위가 높은 운동부터 시간을 배분합니다.
 *
 * @param exercises 섹션별로 분류된 운동 목록
 * @param totalDurationMinutes 총 운동 시간 (60, 90, 120분)
 * @param config 시간 배분 설정 (선택)
 * @returns 시간이 배분된 운동 목록
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
  // 총 시간에 따른 기본 시간 배분 가져오기
  const durationConfig = TIME_DISTRIBUTION_BY_DURATION[totalDurationMinutes];
  const timeConfig = {
    ...DEFAULT_TIME_CONFIG,
    warmupTime: config.warmupTime ?? durationConfig.warmupTime,
    cooldownTime: config.cooldownTime ?? durationConfig.cooldownTime,
    ...config,
  };

  // Main 시간 계산 (총 시간 - warmup - cooldown)
  const calculatedMainTime =
    totalDurationMinutes - timeConfig.warmupTime - timeConfig.cooldownTime;
  const actualMainTime = Math.max(calculatedMainTime, 30); // 최소 30분

  const result: MergedExercise[] = [];

  // Helper function to repeat exercises to fill time
  const repeatExercisesToFillTime = (
    exerciseList: MergedExercise[],
    targetTime: number,
    maxTimePerExercise: number,
    section: "warmup" | "main" | "cooldown",
  ): MergedExercise[] => {
    if (exerciseList.length === 0) return [];

    const sectionResult: MergedExercise[] = [];
    let accumulatedTime = 0;
    let exerciseIndex = 0;
    let orderCounter = 0;

    // Keep adding exercises until we reach target time
    while (accumulatedTime < targetTime) {
      const sourceExercise = exerciseList[exerciseIndex % exerciseList.length];
      const remainingTime = targetTime - accumulatedTime;

      // Calculate time for this exercise
      const timeForThisExercise = Math.min(
        maxTimePerExercise,
        Math.max(timeConfig.minExerciseTime, remainingTime),
      );

      // Skip if remaining time is too small
      if (
        remainingTime < timeConfig.minExerciseTime &&
        sectionResult.length > 0
      ) {
        break;
      }

      const { sets, reps } = calculateSetsAndReps(
        sourceExercise.durationMinutes,
        timeForThisExercise,
        sourceExercise.sets,
        sourceExercise.reps,
        section,
      );

      sectionResult.push({
        ...sourceExercise,
        section, // 섹션 속성을 명시적으로 설정
        orderInSection: orderCounter,
        durationMinutes: Math.round(timeForThisExercise * 10) / 10,
        sets,
        reps,
      });

      accumulatedTime += timeForThisExercise;
      exerciseIndex++;
      orderCounter++;

      // Safety limit: prevent infinite loops
      if (orderCounter > 20) break;
    }

    return sectionResult;
  };

  // Warmup 시간 배분 (반복하여 시간 채우기)
  const warmupExercises = repeatExercisesToFillTime(
    exercises.warmup,
    timeConfig.warmupTime,
    timeConfig.maxWarmupCooldownTime,
    "warmup",
  );
  result.push(...warmupExercises);

  // Main 시간 배분 (반복하여 시간 채우기)
  const mainExercises = repeatExercisesToFillTime(
    exercises.main,
    actualMainTime,
    timeConfig.maxMainExerciseTime,
    "main",
  );
  result.push(...mainExercises);

  // Cooldown 시간 배분 (반복하여 시간 채우기)
  // 🆕 Cooldown 강제 보장 로직
  let cooldownSource = exercises.cooldown;

  // 1. Cooldown 후보가 없으면 Warmup 중 강도 낮은 운동(intensityLevel <= 2) 재사용
  if (cooldownSource.length === 0) {
    cooldownSource = exercises.warmup.filter(
      (ex) => (ex.intensityLevel || 0) <= 2,
    );
  }

  // 2. 그래도 없으면 Warmup 전체 재사용
  if (cooldownSource.length === 0) {
    cooldownSource = exercises.warmup;
  }

  // 3. 최후의 수단: 하드코딩된 전신 스트레칭 (데이터베이스 의존성 제거)
  if (cooldownSource.length === 0) {
    cooldownSource = [
      {
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
      },
    ];
  }

  const cooldownExercises = repeatExercisesToFillTime(
    cooldownSource,
    timeConfig.cooldownTime,
    timeConfig.maxWarmupCooldownTime,
    "cooldown",
  );
  result.push(...cooldownExercises);

  return result;
}
