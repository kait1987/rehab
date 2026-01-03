import {
  DIFFICULTY_SCORE_RANGES,
  DIFFICULTY_LABELS,
  DIFFICULTY_DESCRIPTIONS,
  isDifficultyInRange,
} from "@/lib/constants/difficulty-levels";
import type { DifficultyClassification, DifficultyLevel } from "@/types/difficulty";

/**
 * difficulty_score를 3단계 난이도로 분류
 * 
 * @param score difficulty_score (1-10)
 * @returns 난이도 분류 결과
 */
export function classifyDifficulty(
  score: number
): DifficultyClassification {
  // 범위 검증
  if (score < 1 || score > 10) {
    throw new Error(`difficulty_score는 1-10 범위여야 합니다. (입력: ${score})`);
  }

  // 정수 검증
  if (!Number.isInteger(score)) {
    throw new Error(`difficulty_score는 정수여야 합니다. (입력: ${score})`);
  }

  // 난이도 단계 결정
  let level: DifficultyLevel;

  if (isDifficultyInRange(score, 'principle')) {
    level = 'principle';
  } else if (isDifficultyInRange(score, 'adaptation')) {
    level = 'adaptation';
  } else if (isDifficultyInRange(score, 'mastery')) {
    level = 'mastery';
  } else {
    // 경계값 처리 (3-4, 7-8 사이)
    // 기본적으로 낮은 단계로 분류
    if (score <= 3.5) {
      level = 'principle';
    } else if (score <= 7.5) {
      level = 'adaptation';
    } else {
      level = 'mastery';
    }
  }

  return {
    level,
    score,
    label: DIFFICULTY_LABELS[level],
    description: DIFFICULTY_DESCRIPTIONS[level],
  };
}

/**
 * 여러 difficulty_score를 한 번에 분류
 * 
 * @param scores difficulty_score 배열
 * @returns 난이도 분류 결과 배열
 */
export function classifyDifficulties(
  scores: number[]
): DifficultyClassification[] {
  return scores.map((score) => classifyDifficulty(score));
}

