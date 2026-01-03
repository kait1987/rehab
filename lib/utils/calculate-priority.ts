import { getBodyPartBasePriority } from "@/lib/constants/body-part-priority";
import type { BodyPartSelection } from "@/types/body-part-merge";

/**
 * 우선순위 점수 계산
 * 
 * 우선순위 점수 공식:
 * (통증 정도 × 100) + (부위 기본 우선순위 × 10) - (운동 강도 × 1) + (매핑 priority × 0.1)
 * 
 * 낮을수록 우선순위가 높습니다.
 * 
 * @param bodyPart 부위 선택 정보
 * @param mappingPriority 매핑의 priority (body_part_exercise_mappings.priority)
 * @param intensityLevel 운동 강도 (1-4, 기본값: 2)
 * @returns 우선순위 점수 (낮을수록 우선순위 높음)
 */
export function calculatePriorityScore(
  bodyPart: BodyPartSelection,
  mappingPriority: number,
  intensityLevel: number = 2
): number {
  // 통증 정도 가중치 (× 100)
  const painWeight = bodyPart.painLevel * 100;
  
  // 부위 기본 우선순위 가중치 (× 10)
  const bodyPartBasePriority = getBodyPartBasePriority(bodyPart.bodyPartName) * 10;
  
  // 운동 강도 페널티 (× 1, 낮을수록 좋음)
  const intensityPenalty = intensityLevel * 1;
  
  // 매핑 우선순위 가중치 (× 0.1)
  const mappingPriorityWeight = mappingPriority * 0.1;
  
  // 선택 순서 가중치 (향후 확장, × 0.01)
  const selectionOrderWeight = (bodyPart.selectionOrder || 0) * 0.01;
  
  return (
    painWeight +
    bodyPartBasePriority -
    intensityPenalty +
    mappingPriorityWeight +
    selectionOrderWeight
  );
}

