import type { MergedExercise } from "@/types/body-part-merge";

/**
 * 중복 운동 제거 및 병합
 * 
 * 같은 exercise_template_id를 가진 운동들을 하나로 병합합니다.
 * 여러 부위에 적용되는 운동은 bodyPartIds 배열에 모든 부위를 포함합니다.
 * 우선순위 점수는 가장 높은 우선순위(가장 낮은 점수)를 사용합니다.
 * 
 * @param exercises 병합할 운동 목록
 * @returns 중복이 제거된 운동 목록
 */
export function deduplicateExercises(
  exercises: MergedExercise[]
): MergedExercise[] {
  // exercise_template_id를 키로 그룹화
  const exerciseMap = new Map<string, MergedExercise>();

  for (const exercise of exercises) {
    const existing = exerciseMap.get(exercise.exerciseTemplateId);

    if (!existing) {
      // 새로운 운동 추가
      exerciseMap.set(exercise.exerciseTemplateId, {
        ...exercise,
        bodyPartIds: [...exercise.bodyPartIds],
      });
    } else {
      // 기존 운동과 병합
      // bodyPartIds 병합 (중복 제거)
      const mergedBodyPartIds = Array.from(
        new Set([...existing.bodyPartIds, ...exercise.bodyPartIds])
      );

      // 우선순위 점수는 가장 높은 우선순위(가장 낮은 점수) 사용
      const bestPriorityScore = Math.min(
        existing.priorityScore,
        exercise.priorityScore
      );

      // 다른 속성들은 첫 번째 운동의 값을 우선 사용
      exerciseMap.set(exercise.exerciseTemplateId, {
        ...existing,
        bodyPartIds: mergedBodyPartIds,
        priorityScore: bestPriorityScore,
        // intensityLevel, painLevelRange 등은 첫 번째 값 유지
      });
    }
  }

  return Array.from(exerciseMap.values());
}

