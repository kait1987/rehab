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

  // Warmup 시간 배분
  if (exercises.warmup.length > 0) {
    const warmupTimePerExercise = Math.min(
      timeConfig.maxWarmupCooldownTime,
      Math.max(
        timeConfig.minExerciseTime,
        timeConfig.warmupTime / exercises.warmup.length
      )
    );

    exercises.warmup.forEach((ex) => {
      const { sets, reps } = calculateSetsAndReps(
        ex.durationMinutes,
        warmupTimePerExercise,
        ex.sets,
        ex.reps,
        'warmup'
      );

      result.push({
        ...ex,
        durationMinutes: Math.round(warmupTimePerExercise * 10) / 10, // 소수점 1자리
        sets,
        reps,
      });
    });
  }

  // Main 시간 배분
  if (exercises.main.length > 0) {
    const mainTimePerExercise = Math.min(
      timeConfig.maxMainExerciseTime,
      Math.max(
        timeConfig.minExerciseTime,
        actualMainTime / exercises.main.length
      )
    );

    exercises.main.forEach((ex) => {
      const { sets, reps } = calculateSetsAndReps(
        ex.durationMinutes,
        mainTimePerExercise,
        ex.sets,
        ex.reps,
        'main'
      );

      result.push({
        ...ex,
        durationMinutes: Math.round(mainTimePerExercise * 10) / 10,
        sets,
        reps,
      });
    });
  }

  // Cooldown 시간 배분
  if (exercises.cooldown.length > 0) {
    const cooldownTimePerExercise = Math.min(
      timeConfig.maxWarmupCooldownTime,
      Math.max(
        timeConfig.minExerciseTime,
        timeConfig.cooldownTime / exercises.cooldown.length
      )
    );

    exercises.cooldown.forEach((ex) => {
      const { sets, reps } = calculateSetsAndReps(
        ex.durationMinutes,
        cooldownTimePerExercise,
        ex.sets,
        ex.reps,
        'cooldown'
      );

      result.push({
        ...ex,
        durationMinutes: Math.round(cooldownTimePerExercise * 10) / 10,
        sets,
        reps,
      });
    });
  }

  return result;
}

