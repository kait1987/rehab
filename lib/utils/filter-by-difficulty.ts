import type { MergedExercise } from "@/types/body-part-merge";
import type { DifficultyLevel, DifficultyRange } from "@/types/difficulty";
import { DIFFICULTY_SCORE_RANGES } from "@/lib/constants/difficulty-levels";

/**
 * 난이도별 운동 필터링 옵션
 */
export interface FilterByDifficultyOptions {
  /** 경계값 허용 여부 (예: 적응 단계에서 원리 단계 운동도 일부 포함) */
  allowBoundary?: boolean;
  /** 경계값 허용 범위 (난이도 단계 수) */
  boundaryRange?: number;
}

/**
 * 운동 목록을 난이도별로 필터링
 * 
 * @param exercises 병합된 운동 목록
 * @param targetLevel 목표 난이도 단계
 * @param options 필터링 옵션
 * @returns 필터링된 운동 목록
 */
export function filterByDifficulty(
  exercises: MergedExercise[],
  targetLevel: DifficultyLevel,
  options: FilterByDifficultyOptions = {}
): MergedExercise[] {
  const { allowBoundary = false, boundaryRange = 1 } = options;
  const range = DIFFICULTY_SCORE_RANGES[targetLevel];

  return exercises.filter((exercise) => {
    // difficultyScore 사용 (기본값 5)
    const difficultyScore = exercise.difficultyScore || 5;

    // 기본 범위 체크
    if (difficultyScore >= range.min && difficultyScore <= range.max) {
      return true;
    }

    // 경계값 허용 옵션이 켜져 있으면
    if (allowBoundary) {
      // 한 단계 위/아래도 허용
      if (targetLevel === 'principle') {
        // 원리 단계: 적응 단계 하위도 허용
        return difficultyScore <= range.max + boundaryRange;
      } else if (targetLevel === 'adaptation') {
        // 적응 단계: 원리/도움 단계 경계값 허용
        return (
          (difficultyScore >= range.min - boundaryRange && difficultyScore < range.min) ||
          (difficultyScore > range.max && difficultyScore <= range.max + boundaryRange)
        );
      } else if (targetLevel === 'mastery') {
        // 도움 단계: 적응 단계 상위도 허용
        return difficultyScore >= range.min - boundaryRange;
      }
    }

    return false;
  });
}

/**
 * 난이도 범위로 운동 필터링
 * 
 * @param exercises 병합된 운동 목록
 * @param range 난이도 범위
 * @returns 필터링된 운동 목록
 */
export function filterByDifficultyRange(
  exercises: MergedExercise[],
  range: DifficultyRange
): MergedExercise[] {
  return exercises.filter((exercise) => {
    // difficultyScore 사용 (기본값 5)
    const difficultyScore = exercise.difficultyScore || 5;
    
    return difficultyScore >= range.min && difficultyScore <= range.max;
  });
}

