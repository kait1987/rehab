import type { ExperienceLevel } from "@/types/difficulty";

/**
 * 사용자 입력 경험 수준을 표준화
 * 
 * PRD.md의 "평소 운동 빈도" 질문 응답을 표준화된 ExperienceLevel로 변환합니다.
 * 
 * @param input 사용자 입력 (한글 또는 영문)
 * @returns 표준화된 경험 수준
 */
export function mapExperienceLevel(input: string | null | undefined): ExperienceLevel {
  if (!input) {
    return 'beginner'; // 기본값
  }

  const normalized = input.toLowerCase().trim();

  // 영문 코드값 매핑 (pain-check-modal 폼에서 전송)
  if (normalized === 'rarely') {
    return 'beginner';
  }
  if (normalized === 'weekly_1_2') {
    return 'intermediate';
  }
  if (normalized === 'weekly_3_plus') {
    return 'advanced';
  }

  // 한글 매핑
  if (
    normalized.includes('거의 안') ||
    normalized.includes('안 함') ||
    normalized.includes('없음') ||
    normalized === 'beginner' ||
    normalized === '초보'
  ) {
    return 'beginner';
  }

  // 중급 매핑
  if (
    normalized.includes('주1') ||
    normalized.includes('주 1') ||
    normalized.includes('주1-2') ||
    normalized.includes('주 1-2') ||
    normalized.includes('주1~2') ||
    normalized.includes('주 1~2') ||
    normalized === 'intermediate' ||
    normalized === '중급'
  ) {
    return 'intermediate';
  }

  // 고급 매핑
  if (
    normalized.includes('주3') ||
    normalized.includes('주 3') ||
    normalized.includes('주3회 이상') ||
    normalized.includes('주 3회 이상') ||
    normalized.includes('주3 이상') ||
    normalized.includes('주 3 이상') ||
    normalized === 'advanced' ||
    normalized === '고급' ||
    normalized === '경험자'
  ) {
    return 'advanced';
  }

  // 기본값: beginner
  return 'beginner';
}

/**
 * 경험 수준 한글 라벨
 */
export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  beginner: '초보자',
  intermediate: '중급자',
  advanced: '고급자',
};

/**
 * 경험 수준 설명
 */
export const EXPERIENCE_LEVEL_DESCRIPTIONS: Record<ExperienceLevel, string> = {
  beginner: '거의 안 함 - 운동 경험이 거의 없는 사용자',
  intermediate: '주1-2회 - 주 1-2회 운동하는 사용자',
  advanced: '주3회 이상 - 주 3회 이상 운동하는 경험자',
};

