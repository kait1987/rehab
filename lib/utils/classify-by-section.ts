import type { MergedExercise } from "@/types/body-part-merge";

/**
 * 섹션별 분류 결과
 */
export interface SectionClassification {
  warmup: MergedExercise[];
  main: MergedExercise[];
  cooldown: MergedExercise[];
}

/**
 * 운동을 섹션별로 분류
 * 
 * - warmup: 낮은 강도(1-2), 스트레칭 위주
 * - main: 메인 운동
 * - cooldown: 낮은 강도(1-2), 스트레칭 위주
 * 
 * @param exercises 병합된 운동 목록 (우선순위 점수로 정렬된 상태)
 * @returns 섹션별로 분류된 운동 목록
 */
export function classifyBySection(
  exercises: MergedExercise[]
): SectionClassification {
  // 낮은 강도 운동 필터링 (warmup, cooldown 후보)
  const lowIntensityExercises = exercises.filter(
    (ex) => !ex.intensityLevel || ex.intensityLevel <= 2
  );

  // 높은 강도 운동 (main 후보)
  const highIntensityExercises = exercises.filter(
    (ex) => ex.intensityLevel && ex.intensityLevel > 2
  );

  // Warmup: 낮은 강도 운동 중 상위 2-4개
  const warmupCount = Math.min(4, Math.max(2, Math.floor(lowIntensityExercises.length / 2)));
  const warmup = lowIntensityExercises
    .slice(0, warmupCount)
    .map((ex, index) => ({
      ...ex,
      section: 'warmup' as const,
      orderInSection: index + 1,
    }));

  // Main: 높은 강도 운동 + 남은 낮은 강도 운동
  const remainingLowIntensity = lowIntensityExercises.slice(warmupCount);
  const main = [...highIntensityExercises, ...remainingLowIntensity]
    .sort((a, b) => a.priorityScore - b.priorityScore)
    .map((ex, index) => ({
      ...ex,
      section: 'main' as const,
      orderInSection: index + 1,
    }));

  // Cooldown: 낮은 강도 운동 중 하위 2-3개 (warmup에 포함되지 않은 것들)
  const cooldownCount = Math.min(3, Math.max(2, remainingLowIntensity.length));
  const cooldownStart = Math.max(0, remainingLowIntensity.length - cooldownCount);
  const cooldown = remainingLowIntensity
    .slice(cooldownStart)
    .map((ex, index) => ({
      ...ex,
      section: 'cooldown' as const,
      orderInSection: index + 1,
    }));

  // Main에서 cooldown에 포함된 운동 제거
  const mainFiltered = main.filter(
    (ex) => !cooldown.some((c) => c.exerciseTemplateId === ex.exerciseTemplateId)
  );

  return {
    warmup,
    main: mainFiltered,
    cooldown,
  };
}

