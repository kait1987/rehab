/**
 * ENG-S4-02: Difficulty Engine
 * 
 * 사용자 상태 기반 자동 난이도 조절 엔진
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 입력 타입
export interface DifficultyInput {
  userId?: string;
  selectedBodyParts: string[];
  painLevels: Record<string, number>;  // bodyPartId -> painLevel
  userRehabPhase?: 'initial' | 'recovery' | 'strengthening';
}

// 출력 타입
export interface DifficultyOutput {
  recommendedIntensity: 1 | 2 | 3 | 4 | 5;
  adjustmentReason: string;
  adjustments: {
    repsMultiplier: number;      // 0.5 ~ 1.5
    setsMultiplier: number;      // 0.5 ~ 1.5
    restMultiplier: number;      // 0.8 ~ 1.5
    durationMultiplier: number;  // 0.7 ~ 1.3
  };
  warnings: string[];
}

// 재활 단계별 기본 설정
const PHASE_CONFIG = {
  initial: {
    maxIntensity: 2,
    repsMultiplier: 0.7,
    setsMultiplier: 0.8,
    restMultiplier: 1.3,
    durationMultiplier: 0.8
  },
  recovery: {
    maxIntensity: 3,
    repsMultiplier: 1.0,
    setsMultiplier: 1.0,
    restMultiplier: 1.0,
    durationMultiplier: 1.0
  },
  strengthening: {
    maxIntensity: 4,
    repsMultiplier: 1.2,
    setsMultiplier: 1.1,
    restMultiplier: 0.8,
    durationMultiplier: 1.1
  }
};

// 통증 레벨별 조정
const PAIN_ADJUSTMENTS = {
  1: { intensityMod: 1, repsMod: 1.2, restMod: 0.9 },   // 거의 없음
  2: { intensityMod: 0, repsMod: 1.0, restMod: 1.0 },   // 약간
  3: { intensityMod: 0, repsMod: 0.9, restMod: 1.1 },   // 중간
  4: { intensityMod: -1, repsMod: 0.7, restMod: 1.3 },  // 심함
  5: { intensityMod: -2, repsMod: 0.5, restMod: 1.5 }   // 매우 심함
};

/**
 * 난이도 계산
 */
export async function calculateDifficulty(
  input: DifficultyInput
): Promise<DifficultyOutput> {
  const { userId, painLevels, userRehabPhase } = input;
  
  const warnings: string[] = [];
  let phase: 'initial' | 'recovery' | 'strengthening' = userRehabPhase || 'initial';
  let fitnessLevel = 2; // 기본값

  // 사용자 프로필 조회
  if (userId) {
    const profile = await prisma.userFitnessProfile.findUnique({
      where: { userId }
    });

    if (profile) {
      fitnessLevel = profile.fitnessLevel;
      phase = profile.rehabPhase as 'initial' | 'recovery' | 'strengthening';
      
      // 완료율이 낮으면 경고
      if (profile.avgCompletionRate && profile.avgCompletionRate < 0.5) {
        warnings.push('최근 코스 완료율이 낮습니다. 난이도를 낮추는 것을 권장합니다.');
      }
    }
  }

  // 평균 통증 레벨 계산
  const painValues = Object.values(painLevels);
  const avgPain = painValues.length > 0 
    ? painValues.reduce((a, b) => a + b, 0) / painValues.length 
    : 2;
  const maxPain = painValues.length > 0 ? Math.max(...painValues) : 2;

  // 기본 설정 가져오기
  const phaseConfig = PHASE_CONFIG[phase];
  const painAdjust = PAIN_ADJUSTMENTS[Math.min(5, Math.round(avgPain)) as 1|2|3|4|5];

  // 권장 강도 계산
  let baseIntensity = Math.min(fitnessLevel, phaseConfig.maxIntensity);
  let recommendedIntensity = Math.max(1, Math.min(5, baseIntensity + painAdjust.intensityMod)) as 1|2|3|4|5;

  // 최대 통증이 4 이상이면 강도 제한
  if (maxPain >= 4) {
    recommendedIntensity = Math.min(recommendedIntensity, 2) as 1|2|3|4|5;
    warnings.push('통증이 심한 부위가 있어 강도를 제한합니다.');
  }

  // Multiplier 계산
  const adjustments = {
    repsMultiplier: clamp(phaseConfig.repsMultiplier * painAdjust.repsMod, 0.5, 1.5),
    setsMultiplier: clamp(phaseConfig.setsMultiplier, 0.5, 1.5),
    restMultiplier: clamp(phaseConfig.restMultiplier * painAdjust.restMod, 0.8, 1.5),
    durationMultiplier: clamp(phaseConfig.durationMultiplier, 0.7, 1.3)
  };

  // 조정 이유 생성
  const reasons: string[] = [];
  reasons.push(`재활 단계: ${getPhaseLabel(phase)}`);
  if (avgPain >= 3) {
    reasons.push(`평균 통증 ${avgPain.toFixed(1)}로 인해 강도 조정`);
  }
  if (fitnessLevel !== 2) {
    reasons.push(`피트니스 레벨 ${fitnessLevel}`);
  }

  return {
    recommendedIntensity,
    adjustmentReason: reasons.join(', '),
    adjustments,
    warnings
  };
}

/**
 * 운동에 난이도 조정 적용
 */
export function applyDifficultyAdjustments(
  exercise: { reps?: number; sets?: number; restSeconds?: number; durationMinutes?: number },
  adjustments: DifficultyOutput['adjustments']
): { reps: number; sets: number; restSeconds: number; durationMinutes: number } {
  return {
    reps: Math.round((exercise.reps || 10) * adjustments.repsMultiplier),
    sets: Math.round((exercise.sets || 3) * adjustments.setsMultiplier),
    restSeconds: Math.round((exercise.restSeconds || 30) * adjustments.restMultiplier),
    durationMinutes: Math.round((exercise.durationMinutes || 5) * adjustments.durationMultiplier)
  };
}

// 헬퍼 함수
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getPhaseLabel(phase: string): string {
  switch (phase) {
    case 'initial': return '초기 단계';
    case 'recovery': return '회복 단계';
    case 'strengthening': return '강화 단계';
    default: return phase;
  }
}

export default {
  calculateDifficulty,
  applyDifficultyAdjustments
};
