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
const TIME_DISTRIBUTION_BY_DURATION: Record<60 | 90 | 120, {
  warmupTime: number;
  cooldownTime: number;
}> = {
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
  section: 'warmup' | 'main' | 'cooldown'
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

  // 비례적으로 조정
  let adjustedSets = Math.round(baseSets * timeRatio);
  let adjustedReps = Math.round(baseReps * timeRatio);

  // 최소값 보장
  adjustedSets = Math.max(1, adjustedSets);
  adjustedReps = Math.max(5, adjustedReps);

  // 최대값 제한 (안전상)
  adjustedSets = Math.min(10, adjustedSets);
  adjustedReps = Math.min(50, adjustedReps);

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
  config: Partial<TimeDistributionConfig> = {}
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

  // Helper function to calculate how many exercises needed for target time
  const calculateExerciseCount = (
    targetTime: number,
    maxTimePerExercise: number,
    minTimePerExercise: number
  ): number => {
    // At minimum, use minTimePerExercise per exercise to calculate max count
    return Math.ceil(targetTime / Math.max(minTimePerExercise, 5));
  };

  // Helper function to repeat exercises to fill time
  const repeatExercisesToFillTime = (
    exerciseList: MergedExercise[],
    targetTime: number,
    maxTimePerExercise: number,
    section: 'warmup' | 'main' | 'cooldown'
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
        Math.max(timeConfig.minExerciseTime, remainingTime)
      );

      // Skip if remaining time is too small
      if (remainingTime < timeConfig.minExerciseTime && sectionResult.length > 0) {
        break;
      }

      const { sets, reps } = calculateSetsAndReps(
        sourceExercise.durationMinutes,
        timeForThisExercise,
        sourceExercise.sets,
        sourceExercise.reps,
        section
      );

      sectionResult.push({
        ...sourceExercise,
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
    'warmup'
  );
  result.push(...warmupExercises);

  // Main 시간 배분 (반복하여 시간 채우기)
  const mainExercises = repeatExercisesToFillTime(
    exercises.main,
    actualMainTime,
    timeConfig.maxMainExerciseTime,
    'main'
  );
  result.push(...mainExercises);

  // Cooldown 시간 배분 (반복하여 시간 채우기)
  const cooldownExercises = repeatExercisesToFillTime(
    exercises.cooldown,
    timeConfig.cooldownTime,
    timeConfig.maxWarmupCooldownTime,
    'cooldown'
  );
  result.push(...cooldownExercises);

  return result;
}

