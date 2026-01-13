/**
 * P3-AI-06: 루틴 자동 수정 엔진
 * 
 * DetectedIssue + UserPreferences를 기반으로 코스 생성 요청을 조정합니다.
 */

import type { DetectedIssue } from '@/lib/utils/detect-exercise-issues';
import type { UserPreferences } from '@/lib/utils/analyze-user-preferences';

export interface RoutineAdjustmentInput {
  /** 감지된 이슈 목록 */
  issues: DetectedIssue[];
  /** 사용자 선호도 */
  preferences: UserPreferences;
  /** 현재 요청된 부위 */
  requestedBodyParts: Array<{ bodyPartId: string; bodyPartName: string; painLevel: number }>;
}

export interface RoutineAdjustment {
  type: 'add_body_part' | 'remove_exercise' | 'swap_exercise' | 'adjust_intensity';
  reason: string;
  bodyPartId?: string;
  bodyPartName?: string;
  exerciseId?: string;
  alternativeId?: string;
}

export interface RoutineAdjustmentResult {
  /** 조정 목록 */
  adjustments: RoutineAdjustment[];
  /** 경고 메시지 (사용자에게 표시) */
  warnings: string[];
  /** 강도 조정량 (-1, 0, +1) */
  intensityAdjustment: number;
  /** 조정된 부위 목록 */
  adjustedBodyParts: Array<{ bodyPartId: string; bodyPartName: string; painLevel: number }>;
  /** 회피할 운동 ID 목록 */
  avoidExerciseIds: string[];
}

/**
 * 루틴 자동 수정 메인 함수
 */
export function autoAdjustRoutine(
  input: RoutineAdjustmentInput
): RoutineAdjustmentResult {
  const adjustments: RoutineAdjustment[] = [];
  const warnings: string[] = [];
  let intensityAdjustment = 0;
  const adjustedBodyParts = [...input.requestedBodyParts];
  const avoidExerciseIds: string[] = [];

  const { issues, preferences } = input;

  // 1. missing_body_part 처리: 누락된 부위 추가
  for (const issue of issues.filter(i => i.type === 'missing_body_part')) {
    if (issue.bodyPartId && issue.bodyPartName) {
      // 이미 요청에 포함되어 있는지 확인
      const exists = adjustedBodyParts.some(bp => bp.bodyPartId === issue.bodyPartId);
      if (!exists) {
        adjustedBodyParts.push({
          bodyPartId: issue.bodyPartId,
          bodyPartName: issue.bodyPartName,
          painLevel: 3 // 기본값
        });
        adjustments.push({
          type: 'add_body_part',
          reason: issue.message,
          bodyPartId: issue.bodyPartId,
          bodyPartName: issue.bodyPartName
        });
        warnings.push(`${issue.bodyPartName} 부위가 자동으로 추가되었습니다.`);
      }
    }
  }

  // 2. low_completion 처리: 해당 운동 회피
  for (const issue of issues.filter(i => i.type === 'low_completion')) {
    if (issue.exerciseId) {
      avoidExerciseIds.push(issue.exerciseId);
      adjustments.push({
        type: 'remove_exercise',
        reason: issue.message,
        exerciseId: issue.exerciseId
      });
      warnings.push(`${issue.exerciseName || issue.exerciseId} 운동이 제외되었습니다 (완수율 낮음).`);
    }
  }

  // 3. pain_increase 처리: 강도 하향
  const painIssues = issues.filter(i => i.type === 'pain_increase');
  if (painIssues.length > 0) {
    const hasCritical = painIssues.some(i => i.severity === 'critical');
    intensityAdjustment -= hasCritical ? 2 : 1;
    adjustments.push({
      type: 'adjust_intensity',
      reason: painIssues[0].message
    });
    warnings.push('운동 후 통증이 증가하고 있어 강도를 낮춥니다.');
  }

  // 4. 회피 운동 추가 (preferences 기반)
  for (const avoided of preferences.avoidedExercises) {
    if (!avoidExerciseIds.includes(avoided.exerciseId)) {
      avoidExerciseIds.push(avoided.exerciseId);
      adjustments.push({
        type: 'remove_exercise',
        reason: `스킵율 ${Math.round(avoided.skipRate * 100)}%`,
        exerciseId: avoided.exerciseId
      });
    }
  }

  // 5. 선호 운동 활용 (향후 확장: 선호 운동 우선순위 상향)
  // TODO: 선호 운동 우선순위 로직 추가

  // 6. imbalance 처리: 정보 메시지만 (심각하지 않음)
  const imbalanceIssues = issues.filter(i => i.type === 'imbalance');
  if (imbalanceIssues.length > 0) {
    warnings.push(imbalanceIssues[0].message);
  }

  // 강도 조정 범위 제한 (-2 ~ +1)
  intensityAdjustment = Math.max(-2, Math.min(1, intensityAdjustment));

  return {
    adjustments,
    warnings,
    intensityAdjustment,
    adjustedBodyParts,
    avoidExerciseIds
  };
}

/**
 * MergeRequest에 조정 결과 적용
 */
export function applyAdjustmentsToRequest<T extends {
  bodyParts: Array<{ bodyPartId: string; bodyPartName: string; painLevel: number }>;
}>(
  request: T,
  adjustmentResult: RoutineAdjustmentResult
): T & { _avoidExerciseIds?: string[] } {
  return {
    ...request,
    bodyParts: adjustmentResult.adjustedBodyParts,
    _avoidExerciseIds: adjustmentResult.avoidExerciseIds
  };
}
