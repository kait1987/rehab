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
 * 중복 제거 규칙:
 * - 전체 섹션에서 동일 exerciseTemplateId는 딱 1번만 존재
 * - 우선순위: main > warmup > cooldown
 *
 * @param exercises 병합된 운동 목록 (우선순위 점수로 정렬된 상태)
 * @returns 섹션별로 분류된 운동 목록
 */
export function classifyBySection(
  exercises: MergedExercise[],
): SectionClassification {
  // 낮은 강도 운동 필터링 (warmup, cooldown 후보)
  const lowIntensityExercises = exercises.filter(
    (ex) => !ex.intensityLevel || ex.intensityLevel <= 2,
  );

  // 높은 강도 운동 (main 후보)
  const highIntensityExercises = exercises.filter(
    (ex) => ex.intensityLevel && ex.intensityLevel > 2,
  );

  // Warmup: 낮은 강도 운동 중 상위 2-4개
  const warmupCount = Math.min(
    4,
    Math.max(2, Math.floor(lowIntensityExercises.length / 2)),
  );
  const warmupRaw = lowIntensityExercises
    .slice(0, warmupCount)
    .map((ex, index) => ({
      ...ex,
      section: "warmup" as const,
      orderInSection: index + 1,
    }));

  // Main: 높은 강도 운동 + 남은 낮은 강도 운동
  const remainingLowIntensity = lowIntensityExercises.slice(warmupCount);
  const mainRaw = [...highIntensityExercises, ...remainingLowIntensity]
    .sort((a, b) => a.priorityScore - b.priorityScore)
    .map((ex, index) => ({
      ...ex,
      section: "main" as const,
      orderInSection: index + 1,
    }));

  // Cooldown: 저강도 운동 중 최소 1개 보장
  // warmup에서 일부를 빌려와서라도 cooldown 확보
  let cooldownRaw: (MergedExercise & {
    section: "cooldown";
    orderInSection: number;
  })[] = [];

  if (remainingLowIntensity.length >= 2) {
    // 남은 저강도가 2개 이상이면 마지막 2개를 cooldown으로
    cooldownRaw = remainingLowIntensity.slice(-2).map((ex, index) => ({
      ...ex,
      section: "cooldown" as const,
      orderInSection: index + 1,
    }));
  } else if (remainingLowIntensity.length === 1) {
    // 1개면 그것을 cooldown으로
    cooldownRaw = remainingLowIntensity.slice(-1).map((ex, index) => ({
      ...ex,
      section: "cooldown" as const,
      orderInSection: index + 1,
    }));
  } else if (lowIntensityExercises.length > 0) {
    // remainingLowIntensity가 0이면 전체 저강도에서 마지막 1개 빌려옴
    // (warmup과 중복될 수 있지만 cooldown 확보가 더 중요)
    cooldownRaw = [lowIntensityExercises[lowIntensityExercises.length - 1]].map(
      (ex, index) => ({
        ...ex,
        section: "cooldown" as const,
        orderInSection: index + 1,
      }),
    );
  }
  // else: 저강도 운동이 전혀 없으면 distribute-time의 fallback에 의존

  // ============================================
  // 전체 섹션 중복 제거 (메인 우선순위)
  // 우선순위: main > warmup > cooldown
  // ============================================
  const used = new Set<string>();

  // 1. Main 먼저 처리 (최우선)
  const mainFiltered = mainRaw.filter((ex) => {
    const id = ex.exerciseTemplateId;
    if (!id || used.has(id)) return false;
    used.add(id);
    return true;
  });

  // 2. Warmup 처리 (main에 없는 것만)
  const warmupFiltered = warmupRaw.filter((ex) => {
    const id = ex.exerciseTemplateId;
    if (!id || used.has(id)) return false;
    used.add(id);
    return true;
  });

  // 3. Cooldown 처리 (main, warmup에 없는 것만)
  const cooldownFiltered = cooldownRaw.filter((ex) => {
    const id = ex.exerciseTemplateId;
    if (!id || used.has(id)) return false;
    used.add(id);
    return true;
  });

  // orderInSection 재할당
  const warmup = warmupFiltered.map((ex, index) => ({
    ...ex,
    orderInSection: index + 1,
  }));

  const main = mainFiltered.map((ex, index) => ({
    ...ex,
    orderInSection: index + 1,
  }));

  const cooldown = cooldownFiltered.map((ex, index) => ({
    ...ex,
    orderInSection: index + 1,
  }));

  return {
    warmup,
    main,
    cooldown,
  };
}

/**
 * 이미 분류된 섹션에서 중복 제거 (메인 우선순위)
 *
 * 테스트 및 외부 호출용 유틸리티 함수
 *
 * @param sections 이미 분류된 섹션 객체
 * @returns 중복이 제거된 섹션 객체
 */
export function deduplicateSections(
  sections: SectionClassification,
): SectionClassification {
  const used = new Set<string>();

  // 1. Main 먼저 처리 (최우선)
  const main = sections.main
    .filter((ex) => {
      const id = ex.exerciseTemplateId;
      if (!id || used.has(id)) return false;
      used.add(id);
      return true;
    })
    .map((ex, index) => ({
      ...ex,
      orderInSection: index + 1,
    }));

  // 2. Warmup 처리 (main에 없는 것만)
  const warmup = sections.warmup
    .filter((ex) => {
      const id = ex.exerciseTemplateId;
      if (!id || used.has(id)) return false;
      used.add(id);
      return true;
    })
    .map((ex, index) => ({
      ...ex,
      orderInSection: index + 1,
    }));

  // 3. Cooldown 처리 (main, warmup에 없는 것만)
  const cooldown = sections.cooldown
    .filter((ex) => {
      const id = ex.exerciseTemplateId;
      if (!id || used.has(id)) return false;
      used.add(id);
      return true;
    })
    .map((ex, index) => ({
      ...ex,
      orderInSection: index + 1,
    }));

  return { warmup, main, cooldown };
}
