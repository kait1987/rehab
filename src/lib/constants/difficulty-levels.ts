/**
 * 난이도 단계 상수 및 매핑
 *
 * "원리-적응-도움" 3단계 시스템의 상수와 매핑 규칙을 정의합니다.
 */

import type { DifficultyLevel, ExperienceLevel } from "@/types/difficulty";

/**
 * 난이도 단계별 difficulty_score 범위
 */
export const DIFFICULTY_SCORE_RANGES: Record<
  DifficultyLevel,
  { min: number; max: number }
> = {
  principle: { min: 1, max: 3 }, // 원리: 1-3
  adaptation: { min: 4, max: 7 }, // 적응: 4-7
  mastery: { min: 8, max: 10 }, // 도움: 8-10
};

/**
 * 난이도 단계별 한글 라벨
 */
export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  principle: "원리",
  adaptation: "적응",
  mastery: "도움",
};

/**
 * 난이도 단계별 설명
 */
export const DIFFICULTY_DESCRIPTIONS: Record<DifficultyLevel, string> = {
  principle:
    "기초 단계 - 재활 운동의 기본 원리 이해, 낮은 강도, 안전한 동작 위주",
  adaptation: "중급 단계 - 점진적 적응 및 강도 증가, 기본 동작의 변형",
  mastery: "고급 단계 - 고급 동작 및 독립적 수행, 높은 강도, 복합 동작",
};

/**
 * 경험 수준 → 기본 난이도 매핑
 */
export const EXPERIENCE_TO_DIFFICULTY: Record<
  ExperienceLevel,
  DifficultyLevel
> = {
  beginner: "principle", // 초보자 → 원리
  intermediate: "adaptation", // 중급자 → 적응
  advanced: "mastery", // 고급자 → 도움
};

/**
 * 통증 정도별 허용 난이도 범위
 */
export const PAIN_LEVEL_DIFFICULTY_RANGES: Record<
  number,
  { min: number; max: number }
> = {
  5: { min: 1, max: 5 }, // 통증 5점: 원리 ~ 초기 적응 허용 (Main 섹션 확보 위함)
  4: { min: 1, max: 7 }, // 통증 4점: 원리 + 적응 허용
  3: { min: 1, max: 10 }, // 통증 3점 이하: 모든 단계 허용
  2: { min: 1, max: 10 },
  1: { min: 1, max: 10 },
};

/**
 * 통증 정도별 난이도 비율 (기본)
 */
export const PAIN_LEVEL_DIFFICULTY_RATIOS: Record<
  number,
  { principle: number; adaptation: number; mastery: number }
> = {
  5: { principle: 100, adaptation: 0, mastery: 0 }, // 통증 5점: 원리 100%
  4: { principle: 50, adaptation: 50, mastery: 0 }, // 통증 4점: 원리 50%, 적응 50%
  3: { principle: 20, adaptation: 60, mastery: 20 }, // 통증 3점: 원리 20%, 적응 60%, 도움 20%
  2: { principle: 10, adaptation: 30, mastery: 60 }, // 통증 2점: 원리 10%, 적응 30%, 도움 60%
  1: { principle: 10, adaptation: 30, mastery: 60 }, // 통증 1점: 원리 10%, 적응 30%, 도움 60%
};

/**
 * 경험 수준별 기본 난이도 비율 (통증 3점 이하일 때)
 */
export const EXPERIENCE_DIFFICULTY_RATIOS: Record<
  ExperienceLevel,
  { principle: number; adaptation: number; mastery: number }
> = {
  beginner: { principle: 70, adaptation: 30, mastery: 0 }, // 초보자: 원리 70%, 적응 30%
  intermediate: { principle: 20, adaptation: 60, mastery: 20 }, // 중급자: 원리 20%, 적응 60%, 도움 20%
  advanced: { principle: 10, adaptation: 30, mastery: 60 }, // 고급자: 원리 10%, 적응 30%, 도움 60%
};

/**
 * difficulty_score가 특정 난이도 단계에 속하는지 확인
 *
 * @param score difficulty_score (1-10)
 * @param level 난이도 단계
 * @returns 속하는지 여부
 */
export function isDifficultyInRange(
  score: number,
  level: DifficultyLevel,
): boolean {
  const range = DIFFICULTY_SCORE_RANGES[level];
  return score >= range.min && score <= range.max;
}

/**
 * 경험 수준에 따른 기본 난이도 조회
 *
 * @param experienceLevel 경험 수준
 * @returns 기본 난이도 단계
 */
export function getDefaultDifficulty(
  experienceLevel: ExperienceLevel,
): DifficultyLevel {
  return EXPERIENCE_TO_DIFFICULTY[experienceLevel];
}
