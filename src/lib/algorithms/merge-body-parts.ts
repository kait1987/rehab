import { prisma } from "@/lib/prisma/client";
import { calculatePriorityScore } from "@/lib/utils/calculate-priority";
import { deduplicateExercises } from "@/lib/utils/deduplicate-exercises";
import { filterContraindications } from "@/lib/utils/filter-contraindications";
import { classifyBySection } from "@/lib/utils/classify-by-section";
import { distributeTime } from "@/lib/utils/distribute-time";
import { adjustDifficultyForUser } from "@/lib/algorithms/adjust-difficulty";
import { filterByDifficultyRange } from "@/lib/utils/filter-by-difficulty";
import { mapExperienceLevel } from "@/lib/utils/map-experience-level";
import type { ExperienceLevel } from "@/types/difficulty";
import type {
  MergeRequest,
  MergeResult,
  MergedExercise,
  BodyPartSelection,
} from "@/types/body-part-merge";

/**
 * pain_level_range와 사용자 painLevel 매칭
 *
 * @param painLevelRange 통증 정도 범위 ('1-2', '3-4', '5', 'all')
 * @param userPainLevel 사용자 통증 정도 (1-5)
 * @returns 매칭 여부
 */
function matchesPainLevelRange(
  painLevelRange: string | null | undefined,
  userPainLevel: number,
): boolean {
  if (!painLevelRange || painLevelRange === "all") {
    return true;
  }

  if (painLevelRange.includes("-")) {
    // 범위 형식: '1-2', '3-4'
    const [min, max] = painLevelRange.split("-").map(Number);
    return userPainLevel >= min && userPainLevel <= max;
  }

  // 단일 값: '5'
  const level = Number(painLevelRange);
  return userPainLevel === level;
}

/**
 * 다중 부위 병합 메인 함수
 *
 * 여러 부위의 추천 운동을 병합하여 최종 코스를 생성합니다.
 *
 * @param request 병합 요청
 * @param intensityAdjustment 강도 조정 (-1: 하향, 0: 유지, +1: 상향) - P2-F1-01
 * @returns 병합 결과
 */
export async function mergeBodyParts(
  request: MergeRequest,
  intensityAdjustment: number = 0,
): Promise<MergeResult> {
  const warnings: string[] = [];
  const bodyPartIds = request.bodyParts.map((bp) => bp.bodyPartId);

  // 0. 기구 ID -> Name 변환을 위한 맵 조회
  const allEquipment = await prisma.equipmentType.findMany();
  const equipmentMap = new Map(allEquipment.map((eq) => [eq.id, eq.name]));

  // 사용자 선택 기구 ID를 Name으로 변환
  const userEquipmentNames = (request.equipmentAvailable || [])
    .map((id) => equipmentMap.get(id))
    .filter((name): name is string => !!name); // 유효한 이름만 필터링

  // 1. 각 부위별 추천 운동 조회
  const mappings = await prisma.bodyPartExerciseMapping.findMany({
    where: {
      bodyPartId: { in: bodyPartIds },
      isActive: true,
    },
    include: {
      exerciseTemplate: {
        include: {
          exerciseEquipmentMappings: {
            include: { equipmentType: true },
          },
        },
      },
      bodyPart: true,
    },
    orderBy: [{ bodyPartId: "asc" }, { priority: "asc" }],
  });

  if (mappings.length === 0) {
    warnings.push("추천 운동을 찾을 수 없습니다. 기본 운동을 사용합니다.");
    return {
      exercises: [],
      totalDuration: request.totalDurationMinutes ?? 90,
      warnings,
    };
  }

  // 2. pain_level_range 필터링 및 우선순위 점수 계산
  const exercisesWithScores: MergedExercise[] = [];

  for (const mapping of mappings) {
    const bodyPart = request.bodyParts.find(
      (bp) => bp.bodyPartId === mapping.bodyPartId,
    );

    if (!bodyPart) continue;

    // ✅ 비활성 운동 필터링 (isActive: false인 운동 제외)
    if (!mapping.exerciseTemplate.isActive) {
      continue;
    }

    // pain_level_range 매칭 확인
    if (!matchesPainLevelRange(mapping.painLevelRange, bodyPart.painLevel)) {
      continue;
    }

    // 기구 필터링: 정확한 기구 매칭
    const exerciseEquipment =
      mapping.exerciseTemplate.exerciseEquipmentMappings.map(
        (eem) => eem.equipmentType.name,
      );

    // 사용자가 선택한 기구 Set (맨몸/없음은 동일 취급)
    const userEquipmentSet = new Set(userEquipmentNames);

    // "맨몸" 또는 "없음" 선택 시, 둘 다 허용
    const userWantsBodyweight =
      userEquipmentSet.has("맨몸") || userEquipmentSet.has("없음");
    if (userWantsBodyweight) {
      userEquipmentSet.add("맨몸");
      userEquipmentSet.add("없음");
    }

    // 운동 가능 조건 체크
    // 1. "맨몸" 또는 "없음"을 포함하는 운동 → 맨손으로 가능
    const isNoEquipmentExercise = exerciseEquipment.some(
      (eq) => eq === "맨몸" || eq === "없음",
    );

    // 2. 특정 기구 필요 → 사용자가 해당 기구를 모두 가지고 있어야 함
    //    (또는 "맨몸"/"없음"으로 대체 가능한 경우)
    const hasAllRequiredEquipment = exerciseEquipment.some(
      (eq) => eq === "맨몸" || eq === "없음" || userEquipmentSet.has(eq),
    );

    // 필터링: 맨손 운동이 아니고, 필요한 기구도 없으면 제외
    if (!isNoEquipmentExercise && !hasAllRequiredEquipment) {
      continue;
    }

    // 우선순위 점수 계산
    const priorityScore = calculatePriorityScore(
      bodyPart,
      mapping.priority,
      mapping.intensityLevel || 2,
    );

    exercisesWithScores.push({
      exerciseTemplateId: mapping.exerciseTemplateId,
      exerciseTemplateName: mapping.exerciseTemplate.name,
      bodyPartIds: [mapping.bodyPartId],
      priorityScore,
      section: "main", // 임시, 나중에 분류됨
      orderInSection: 0, // 임시, 나중에 설정됨
      durationMinutes: mapping.exerciseTemplate.durationMinutes || undefined,
      reps: mapping.exerciseTemplate.reps || undefined,
      sets: mapping.exerciseTemplate.sets || undefined,
      restSeconds: mapping.exerciseTemplate.restSeconds || undefined,
      intensityLevel:
        mapping.intensityLevel ||
        mapping.exerciseTemplate.intensityLevel ||
        undefined,
      difficultyScore: mapping.exerciseTemplate.difficultyScore || undefined,
      painLevelRange: mapping.painLevelRange || undefined,
      description: mapping.exerciseTemplate.description || undefined,
      instructions: mapping.exerciseTemplate.instructions || undefined,
      precautions: mapping.exerciseTemplate.precautions || undefined,
      imageUrl: mapping.exerciseTemplate.imageUrl || undefined,
      gifUrl: mapping.exerciseTemplate.gifUrl || undefined,
      videoUrl: mapping.exerciseTemplate.videoUrl || undefined,
    });
  }

  // 3. 난이도 자동 조절 및 필터링
  let filteredByDifficulty = exercisesWithScores;

  if (request.experienceLevel) {
    const experienceLevel: ExperienceLevel = mapExperienceLevel(
      request.experienceLevel,
    );
    const difficultyAdjustment = adjustDifficultyForUser({
      experienceLevel,
      painLevel: request.painLevel,
    });

    // 난이도 범위로 필터링
    filteredByDifficulty = filterByDifficultyRange(
      exercisesWithScores,
      difficultyAdjustment.allowedRange,
    );

    // 난이도 조정 사유가 있으면 경고 추가
    if (difficultyAdjustment.adjustmentReason) {
      warnings.push(difficultyAdjustment.adjustmentReason);
    }
  }

  // 4. 우선순위 점수로 정렬
  filteredByDifficulty.sort((a, b) => a.priorityScore - b.priorityScore);

  // 5. 중복 운동 제거 및 병합
  const deduplicated = deduplicateExercises(filteredByDifficulty);

  // 6. 금기 운동 필터링
  const contraindications = await prisma.bodyPartContraindication.findMany({
    where: {
      bodyPartId: { in: bodyPartIds },
      isActive: true,
    },
    include: {
      exerciseTemplate: true,
    },
  });

  const contraindicationData = contraindications.map((c) => ({
    exerciseTemplateId: c.exerciseTemplateId,
    exerciseTemplateName: c.exerciseTemplate.name,
    painLevelMin: c.painLevelMin,
    severity: c.severity as "warning" | "strict",
    reason: c.reason,
  }));

  const filterResult = filterContraindications(
    deduplicated,
    contraindicationData,
    request.painLevel,
  );

  // 7. 섹션별 분류
  const classified = classifyBySection(filterResult.exercises);

  // 8. 시간 배분
  const finalExercises = distributeTime(
    classified,
    request.totalDurationMinutes ?? 90,
  );

  // 9. 통계 계산
  const stats = {
    warmup: classified.warmup.length,
    main: classified.main.length,
    cooldown: classified.cooldown.length,
    byBodyPart: {} as Record<string, number>,
  };

  // 부위별 운동 개수 계산
  request.bodyParts.forEach((bp) => {
    stats.byBodyPart[bp.bodyPartName] = finalExercises.filter((ex) =>
      ex.bodyPartIds.includes(bp.bodyPartId),
    ).length;
  });

  // 총 시간 계산
  const totalDuration = finalExercises.reduce(
    (sum, ex) => sum + (ex.durationMinutes || 0),
    0,
  );

  return {
    exercises: finalExercises,
    totalDuration: Math.round(totalDuration),
    warnings: warnings.length > 0 ? warnings : undefined,
    stats,
  };
}
