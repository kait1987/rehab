import type { MergedExercise } from "@/types/body-part-merge";

/**
 * 금기 운동 필터링 결과
 */
export interface FilterResult {
  /** 필터링된 운동 목록 */
  exercises: MergedExercise[];
  /** 제외된 운동 ID 목록 */
  excludedExerciseIds: string[];
  /** 경고 메시지 목록 */
  warnings: string[];
}

/**
 * 금기 운동 필터링
 * 
 * 사용자의 통증 정도와 금기 운동 조건을 비교하여
 * 제외해야 할 운동을 필터링합니다.
 * 
 * @param exercises 병합된 운동 목록
 * @param contraindications 금기 운동 정보 (exercise_template_id와 pain_level_min, severity 포함)
 * @param userPainLevel 사용자 통증 정도 (1-5)
 * @returns 필터링된 운동 목록과 경고 메시지
 */
export function filterContraindications(
  exercises: MergedExercise[],
  contraindications: Array<{
    exerciseTemplateId: string;
    exerciseTemplateName: string;
    painLevelMin: number | null;
    severity: 'warning' | 'strict';
    reason?: string | null;
  }>,
  userPainLevel: number
): FilterResult {
  const excludedExerciseIds = new Set<string>();
  const warnings: string[] = [];

  // 금기 운동을 exercise_template_id로 매핑
  const contraindicationMap = new Map(
    contraindications.map((c) => [c.exerciseTemplateId, c])
  );

  // 각 운동에 대해 금기 여부 확인
  const filteredExercises = exercises.filter((exercise) => {
    const contraindication = contraindicationMap.get(exercise.exerciseTemplateId);

    if (!contraindication) {
      // 금기 운동이 아님
      return true;
    }

    // pain_level_min이 NULL이면 항상 금기
    if (contraindication.painLevelMin === null) {
      if (contraindication.severity === 'strict') {
        excludedExerciseIds.add(exercise.exerciseTemplateId);
        return false;
      } else {
        // warning인 경우 경고만 표시
        warnings.push(
          `경고: ${contraindication.exerciseTemplateName}은(는) ${contraindication.reason || '금기 운동입니다'}.`
        );
        return true;
      }
    }

    // 사용자 통증 정도가 pain_level_min 이상이면 금기
    if (userPainLevel >= contraindication.painLevelMin) {
      if (contraindication.severity === 'strict') {
        excludedExerciseIds.add(exercise.exerciseTemplateId);
        return false;
      } else {
        // warning인 경우 경고만 표시
        warnings.push(
          `경고: 통증 정도가 ${contraindication.painLevelMin} 이상일 때 ${contraindication.exerciseTemplateName}은(는) ${contraindication.reason || '주의가 필요합니다'}.`
        );
        return true;
      }
    }

    // 통증 정도가 낮아서 금기가 아님
    return true;
  });

  return {
    exercises: filteredExercises,
    excludedExerciseIds: Array.from(excludedExerciseIds),
    warnings,
  };
}

