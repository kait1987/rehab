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

  // 1. Warmup: 낮은 강도 운동 중 할당
  // 총 개수가 적을 경우 Warmup을 1개로 제한하여 Main/Cooldown 확보
  let warmupCount = 2;
  if (lowIntensityExercises.length < 3) {
    warmupCount = 1;
  }
  warmupCount = Math.min(warmupCount, lowIntensityExercises.length);

  const warmupRaw = lowIntensityExercises
    .slice(0, warmupCount)
    .map((ex, index) => ({
      ...ex,
      section: "warmup" as const,
      orderInSection: index + 1,
    }));

  // 2. 나머지를 Main과 Cooldown에 배분
  // 우선순위: Cooldown 최소 1개 확보 -> 나머지 Main -> Cooldown 추가
  const remainingAfterWarmup = lowIntensityExercises.slice(warmupCount);

  const cooldownRaw: (MergedExercise & {
    section: "cooldown";
    orderInSection: number;
  })[] = [];
  const lowIntensityForMain: MergedExercise[] = [];

  // Cooldown에 넣을 후보 (마지막 운동들)
  let cooldownCount = 1;
  if (remainingAfterWarmup.length >= 3) {
    cooldownCount = 2;
  }
  // 남은 게 없으면 0
  cooldownCount = Math.min(cooldownCount, remainingAfterWarmup.length);

  // Main에 넣을 것 (Warmup과 Cooldown 사이)
  const mainCount = remainingAfterWarmup.length - cooldownCount;

  if (mainCount > 0) {
    lowIntensityForMain.push(...remainingAfterWarmup.slice(0, mainCount));
  }

  // Cooldown 할당
  if (cooldownCount > 0) {
    const cooldownCandidates = remainingAfterWarmup.slice(mainCount); // 뒤에서부터 가져옴
    cooldownRaw.push(
      ...cooldownCandidates.map((ex, index) => ({
        ...ex,
        section: "cooldown" as const,
        orderInSection: index + 1,
      })),
    );
  } else if (lowIntensityExercises.length > 0 && warmupRaw.length > 0) {
    // 정말 부족해서 Warmup만 잡힌 경우, Warmup 마지막 것을 Cooldown으로 복사?
    // 아니면 그냥 둠 (Main도 비고 Cooldown도 비면 에러지만, 여기선 최선 다함)
    // 기존 로직: lowIntensityExercises 전체에서 빌려오기 (중복 허용)
    // 하지만 deduplicateSections에서 제거되므로 의미 없음.
    // 여기서는 최대한 분배에 집중.
  }

  // 3. Main 결정
  const mainRaw = [...highIntensityExercises, ...lowIntensityForMain]
    .sort((a, b) => a.priorityScore - b.priorityScore)
    .map((ex, index) => ({
      ...ex,
      section: "main" as const,
      orderInSection: index + 1,
    }));

  // ============================================
  // 전체 섹션 중복 제거 (메인 우선순위)
  // 우선순위: main > warmup > cooldown
  // *단, Cooldown 확보를 위해 '빌려온' 경우(cooldownTakeCount === 0)에는
  // 중복 제거시 Cooldown이 사라질 수 있음.
  // 이를 방지하기 위해, 만약 Cooldown이 텅 비면 안되므로 예외 처리가 필요할 수 있으나,
  // 일반적인 케이스(운동 충분)는 위 로직으로 해결됨.
  // ============================================
  const used = new Set<string>();

  // 1. Main 먼저 처리
  const mainFiltered = mainRaw.filter((ex) => {
    const id = ex.exerciseTemplateId;
    if (!id || used.has(id)) return false;
    used.add(id);
    return true;
  });

  // 2. Warmup 처리
  const warmupFiltered = warmupRaw.filter((ex) => {
    const id = ex.exerciseTemplateId;
    if (!id || used.has(id)) return false;
    used.add(id);
    return true;
  });

  // 3. Cooldown 처리
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
