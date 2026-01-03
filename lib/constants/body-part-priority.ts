/**
 * 부위별 기본 우선순위 상수
 * 
 * 의학적 중요도와 재활 운동의 일반적 우선순위를 반영합니다.
 * 낮을수록 우선순위가 높습니다.
 */

/**
 * 부위별 기본 우선순위 (낮을수록 우선순위 높음)
 * 
 * 우선순위 결정 기준:
 * - 일상생활에 미치는 영향도
 * - 보행 및 기본 동작에 대한 중요도
 * - 재활 운동의 일반적 우선순위
 */
export const BODY_PART_BASE_PRIORITY: Record<string, number> = {
  '허리': 1,      // 가장 중요 (허리 통증은 일상생활에 큰 영향)
  '무릎': 2,      // 보행에 중요
  '어깨': 3,      // 상지 기능에 중요
  '목': 4,        // 경추 건강
  '손목': 5,      // 손 기능
  '발목': 5,      // 보행 안정성
  '팔꿈치': 6,     // 상지 기능
  '엉덩이': 6,    // 하지 안정성
  '등': 7,        // 전신 자세
  '가슴': 8,      // 호흡 및 자세
};

/**
 * 부위 기본 우선순위 조회
 * 
 * @param bodyPartName 부위 이름
 * @returns 기본 우선순위 (기본값: 10)
 */
export function getBodyPartBasePriority(bodyPartName: string): number {
  return BODY_PART_BASE_PRIORITY[bodyPartName] || 10;
}

