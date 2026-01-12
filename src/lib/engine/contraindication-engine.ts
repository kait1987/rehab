/**
 * ENG-S3-02: Contraindication Engine
 * 
 * 금기 조건을 체크하고 제외할 운동을 결정하는 엔진
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 입력 타입
export interface ContraindicationCheckInput {
  templateId: string;
  bodyPartId: string;
  painLevel: number;
  condition?: '급성' | '만성' | '수술후' | null;
}

// 결과 타입
export interface ContraindicationResult {
  isExcluded: boolean;
  reason?: string;
  severity: 'soft' | 'hard';
  alternativeTemplateIds?: string[];
}

// 배치 체크 입력
export interface BatchContraindicationInput {
  templateIds: string[];
  bodyPartId: string;
  painLevel: number;
  condition?: '급성' | '만성' | '수술후' | null;
}

// 배치 체크 결과
export interface BatchContraindicationResult {
  excludedTemplateIds: string[];
  warningTemplateIds: string[];
  exclusionReasons: Record<string, string>;
  alternatives: Record<string, string[]>;
}

/**
 * 단일 운동에 대한 금기 조건 체크
 */
export async function checkContraindication(
  input: ContraindicationCheckInput
): Promise<ContraindicationResult> {
  const { templateId, bodyPartId, painLevel, condition } = input;

  // 금기 조건 조회
  const contraindications = await prisma.bodyPartContraindication.findMany({
    where: {
      exerciseTemplateId: templateId,
      bodyPartId: bodyPartId,
      isActive: true,
      // 통증 레벨 범위 체크
      OR: [
        { painLevelMin: null }, // 모든 통증 레벨에 적용
        { painLevelMin: { lte: painLevel } }
      ]
    }
  });

  if (contraindications.length === 0) {
    return { isExcluded: false, severity: 'soft' };
  }

  // 가장 심각한 금기 조건 찾기
  const hardContra = contraindications.find(c => c.severity === 'hard');
  
  if (hardContra) {
    // 조건 매칭 체크
    if (condition && hardContra.condition && hardContra.condition !== condition) {
      // 조건이 맞지 않으면 soft로 처리
      return {
        isExcluded: false,
        reason: hardContra.reason || '주의 필요',
        severity: 'soft'
      };
    }

    // 대체 운동 찾기
    const alternatives = await findAlternativeExercises(templateId, bodyPartId, painLevel);

    return {
      isExcluded: true,
      reason: hardContra.reason || '이 운동은 현재 상태에서 권장되지 않습니다.',
      severity: 'hard',
      alternativeTemplateIds: alternatives
    };
  }

  // soft 금기만 있는 경우
  const softContra = contraindications[0];
  return {
    isExcluded: false,
    reason: softContra.reason || '주의하여 수행하세요.',
    severity: 'soft'
  };
}

/**
 * 여러 운동에 대한 금기 조건 배치 체크
 */
export async function checkContraindicationsBatch(
  input: BatchContraindicationInput
): Promise<BatchContraindicationResult> {
  const { templateIds, bodyPartId, painLevel, condition } = input;

  const excludedTemplateIds: string[] = [];
  const warningTemplateIds: string[] = [];
  const exclusionReasons: Record<string, string> = {};
  const alternatives: Record<string, string[]> = {};

  for (const templateId of templateIds) {
    const result = await checkContraindication({
      templateId,
      bodyPartId,
      painLevel,
      condition
    });

    if (result.isExcluded) {
      excludedTemplateIds.push(templateId);
      if (result.reason) {
        exclusionReasons[templateId] = result.reason;
      }
      if (result.alternativeTemplateIds) {
        alternatives[templateId] = result.alternativeTemplateIds;
      }
    } else if (result.severity === 'soft' && result.reason) {
      warningTemplateIds.push(templateId);
      exclusionReasons[templateId] = result.reason;
    }
  }

  return {
    excludedTemplateIds,
    warningTemplateIds,
    exclusionReasons,
    alternatives
  };
}

/**
 * 대체 운동 찾기
 */
async function findAlternativeExercises(
  excludedTemplateId: string,
  bodyPartId: string,
  painLevel: number
): Promise<string[]> {
  // 제외된 운동과 같은 부위의 다른 운동 찾기
  const alternatives = await prisma.exerciseTemplate.findMany({
    where: {
      bodyPartId,
      isActive: true,
      id: { not: excludedTemplateId },
      // 낮은 강도 우선
      intensityLevel: { lte: Math.max(1, 3 - Math.floor(painLevel / 2)) }
    },
    select: { id: true },
    take: 3
  });

  return alternatives.map(a => a.id);
}

/**
 * 코스 생성 시 금기 조건 필터링
 */
export async function filterContraindicatedExercises(
  exercises: { id: string; templateId: string }[],
  bodyPartId: string,
  painLevel: number,
  condition?: '급성' | '만성' | '수술후' | null
): Promise<{
  filtered: { id: string; templateId: string }[];
  excluded: { id: string; templateId: string; reason: string }[];
}> {
  const filtered: { id: string; templateId: string }[] = [];
  const excluded: { id: string; templateId: string; reason: string }[] = [];

  for (const exercise of exercises) {
    const result = await checkContraindication({
      templateId: exercise.templateId,
      bodyPartId,
      painLevel,
      condition
    });

    if (result.isExcluded) {
      excluded.push({
        ...exercise,
        reason: result.reason || '금기 조건에 해당'
      });
    } else {
      filtered.push(exercise);
    }
  }

  return { filtered, excluded };
}

export default {
  checkContraindication,
  checkContraindicationsBatch,
  filterContraindicatedExercises
};
