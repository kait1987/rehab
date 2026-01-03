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
  const timeConfig = { ...DEFAULT_TIME_CONFIG, ...config };

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
      result.push({
        ...ex,
        durationMinutes: Math.round(warmupTimePerExercise * 10) / 10, // 소수점 1자리
        // sets, reps는 기본값 유지 또는 비례 조정
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
      result.push({
        ...ex,
        durationMinutes: Math.round(mainTimePerExercise * 10) / 10,
        // sets, reps는 기본값 유지 또는 비례 조정
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
      result.push({
        ...ex,
        durationMinutes: Math.round(cooldownTimePerExercise * 10) / 10,
        // sets, reps는 기본값 유지 또는 비례 조정
      });
    });
  }

  return result;
}

