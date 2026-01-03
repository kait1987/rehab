/**
 * 운동 난이도 관련 타입 정의
 * 
 * "원리-적응-도움" 3단계 난이도 시스템을 위한 타입들을 정의합니다.
 */

/**
 * 난이도 단계
 * 
 * - principle: 원리 (기초 단계, difficulty_score 1-3)
 * - adaptation: 적응 (중급 단계, difficulty_score 4-7)
 * - mastery: 도움 (고급 단계, difficulty_score 8-10)
 */
export type DifficultyLevel = 'principle' | 'adaptation' | 'mastery';

/**
 * 사용자 경험 수준
 * 
 * PRD.md의 "평소 운동 빈도" 질문에 대한 응답:
 * - beginner: "거의 안 함"
 * - intermediate: "주1-2회"
 * - advanced: "주3회 이상"
 */
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * 난이도 분류 결과
 */
export interface DifficultyClassification {
  /** 난이도 단계 */
  level: DifficultyLevel;
  /** difficulty_score (1-10) */
  score: number;
  /** 한글 라벨 */
  label: string;
  /** 설명 */
  description: string;
}

/**
 * 난이도 범위
 */
export interface DifficultyRange {
  /** 최소 difficulty_score */
  min: number;
  /** 최대 difficulty_score */
  max: number;
}

/**
 * 난이도별 비율
 */
export interface DifficultyRatio {
  /** 원리 단계 비율 (0-100) */
  principle: number;
  /** 적응 단계 비율 (0-100) */
  adaptation: number;
  /** 도움 단계 비율 (0-100) */
  mastery: number;
}

/**
 * 난이도 자동 조절 입력
 */
export interface DifficultyAdjustmentInput {
  /** 사용자 경험 수준 */
  experienceLevel: ExperienceLevel;
  /** 통증 정도 (1-5) */
  painLevel: number;
  /** 운동 이력 (선택적, 향후 확장) */
  exerciseHistory?: {
    /** 완료한 코스 개수 */
    completedCourses: number;
    /** 마지막 완료일 */
    lastCompletedDate?: Date;
    /** 평균 완료 난이도 */
    averageDifficulty?: number;
  };
}

/**
 * 난이도 자동 조절 결과
 */
export interface DifficultyAdjustmentResult {
  /** 목표 난이도 단계 */
  targetLevel: DifficultyLevel;
  /** 허용 가능한 난이도 범위 */
  allowedRange: DifficultyRange;
  /** 난이도별 비율 */
  ratio: DifficultyRatio;
  /** 조정 사유 (선택) */
  adjustmentReason?: string;
}

