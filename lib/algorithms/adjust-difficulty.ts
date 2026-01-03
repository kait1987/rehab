import {
  getDefaultDifficulty,
  PAIN_LEVEL_DIFFICULTY_RANGES,
  PAIN_LEVEL_DIFFICULTY_RATIOS,
  EXPERIENCE_DIFFICULTY_RATIOS,
} from "@/lib/constants/difficulty-levels";
import { mapExperienceLevel } from "@/lib/utils/map-experience-level";
import type {
  DifficultyLevel,
  DifficultyRange,
  DifficultyRatio,
  DifficultyAdjustmentInput,
  DifficultyAdjustmentResult,
  ExperienceLevel,
} from "@/types/difficulty";

/**
 * 통증 정도에 따른 난이도 조정
 * 
 * @param baseLevel 기본 난이도 (경험 수준에서 결정)
 * @param painLevel 통증 정도 (1-5)
 * @returns 조정된 난이도
 */
function adjustLevelByPain(
  baseLevel: DifficultyLevel,
  painLevel: number
): DifficultyLevel {
  // 통증 5점: 강제로 원리 단계
  if (painLevel === 5) {
    return 'principle';
  }

  // 통증 4점: 도움 → 적응으로 하향
  if (painLevel === 4 && baseLevel === 'mastery') {
    return 'adaptation';
  }

  // 통증 3점 이하는 조정 없음
  return baseLevel;
}

/**
 * 통증 정도에 따른 허용 난이도 범위 계산
 * 
 * @param painLevel 통증 정도 (1-5)
 * @returns 허용 난이도 범위
 */
function getAllowedRange(painLevel: number): DifficultyRange {
  const range = PAIN_LEVEL_DIFFICULTY_RANGES[painLevel];
  if (!range) {
    // 기본값: 모든 범위 허용
    return { min: 1, max: 10 };
  }
  return range;
}

/**
 * 목표 난이도에 따른 허용 범위 조정
 * 
 * @param targetLevel 목표 난이도
 * @param baseRange 기본 허용 범위
 * @returns 조정된 허용 범위
 */
function adjustRangeByTargetLevel(
  targetLevel: DifficultyLevel,
  baseRange: DifficultyRange
): DifficultyRange {
  // 통증이 낮아서 모든 범위가 허용되는 경우, 목표 난이도에 맞춰 조정
  if (baseRange.min === 1 && baseRange.max === 10) {
    switch (targetLevel) {
      case 'principle':
        return { min: 1, max: 4 }; // 원리 중심, 적응 일부 포함
      case 'adaptation':
        return { min: 1, max: 8 }; // 적응 중심, 원리/도움 일부 포함
      case 'mastery':
        return { min: 4, max: 10 }; // 도움 중심, 적응 일부 포함
    }
  }

  return baseRange;
}

/**
 * 난이도 비율 계산
 * 
 * @param targetLevel 목표 난이도
 * @param painLevel 통증 정도 (1-5)
 * @returns 난이도별 비율
 */
function calculateDifficultyRatio(
  targetLevel: DifficultyLevel,
  painLevel: number
): DifficultyRatio {
  // 통증이 높으면 통증 기반 비율 사용
  if (painLevel >= 4) {
    return PAIN_LEVEL_DIFFICULTY_RATIOS[painLevel];
  }

  // 통증이 낮으면 경험 수준 기반 비율 사용
  // targetLevel에서 experienceLevel 역추적
  const experienceLevel = Object.entries({
    principle: 'beginner',
    adaptation: 'intermediate',
    mastery: 'advanced',
  }).find(([level]) => level === targetLevel)?.[1] as ExperienceLevel | undefined;

  if (experienceLevel) {
    return EXPERIENCE_DIFFICULTY_RATIOS[experienceLevel];
  }

  // 기본값: 적응 중심
  return { principle: 20, adaptation: 60, mastery: 20 };
}

/**
 * 난이도 자동 조절
 * 
 * 사용자의 경험 수준과 통증 정도를 고려하여 적절한 난이도를 결정합니다.
 * 
 * @param input 난이도 조절 입력
 * @returns 난이도 조절 결과
 */
export function adjustDifficultyForUser(
  input: DifficultyAdjustmentInput
): DifficultyAdjustmentResult {
  // 1. 경험 수준 표준화
  const experienceLevel: ExperienceLevel =
    input.experienceLevel === 'beginner' ||
    input.experienceLevel === 'intermediate' ||
    input.experienceLevel === 'advanced'
      ? input.experienceLevel
      : mapExperienceLevel(input.experienceLevel as string);

  // 2. 기본 난이도 결정
  const baseLevel = getDefaultDifficulty(experienceLevel);

  // 3. 통증 정도에 따른 조정
  const targetLevel = adjustLevelByPain(baseLevel, input.painLevel);

  // 4. 허용 가능한 난이도 범위 계산
  const baseRange = getAllowedRange(input.painLevel);
  const allowedRange = adjustRangeByTargetLevel(targetLevel, baseRange);

  // 5. 난이도별 비율 계산
  const ratio = calculateDifficultyRatio(targetLevel, input.painLevel);

  // 6. 조정 사유 생성
  let adjustmentReason: string | undefined;
  if (input.painLevel === 5) {
    adjustmentReason = '통증이 심하여 안전을 위해 원리 단계로 제한됩니다.';
  } else if (input.painLevel === 4 && baseLevel === 'mastery') {
    adjustmentReason = '통증이 높아 도움 단계에서 적응 단계로 조정되었습니다.';
  } else if (targetLevel !== baseLevel) {
    adjustmentReason = `통증 정도에 따라 난이도가 조정되었습니다. (${baseLevel} → ${targetLevel})`;
  }

  return {
    targetLevel,
    allowedRange,
    ratio,
    adjustmentReason,
  };
}

/**
 * 목표 난이도 계산 (간단한 버전)
 * 
 * @param experienceLevel 경험 수준
 * @param painLevel 통증 정도 (1-5)
 * @returns 목표 난이도
 */
export function calculateTargetDifficulty(
  experienceLevel: ExperienceLevel,
  painLevel: number
): DifficultyLevel {
  const baseLevel = getDefaultDifficulty(experienceLevel);
  return adjustLevelByPain(baseLevel, painLevel);
}

/**
 * 허용 가능한 난이도 범위 조회
 * 
 * @param experienceLevel 경험 수준
 * @param painLevel 통증 정도 (1-5)
 * @returns 허용 난이도 범위
 */
export function getDifficultyRange(
  experienceLevel: ExperienceLevel,
  painLevel: number
): DifficultyRange {
  const baseLevel = getDefaultDifficulty(experienceLevel);
  const targetLevel = adjustLevelByPain(baseLevel, painLevel);
  const baseRange = getAllowedRange(painLevel);
  return adjustRangeByTargetLevel(targetLevel, baseRange);
}

