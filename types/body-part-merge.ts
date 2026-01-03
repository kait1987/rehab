/**
 * 다중 부위 병합 관련 타입 정의
 * 
 * 사용자가 여러 부위를 선택했을 때, 각 부위별 추천 운동을 병합하여
 * 최종 코스를 생성하는 데 사용하는 타입들을 정의합니다.
 */

/**
 * 부위별 선택 정보
 */
export interface BodyPartSelection {
  /** 부위 ID (UUID) */
  bodyPartId: string;
  /** 부위 이름 */
  bodyPartName: string;
  /** 통증 정도 (1-5, 5가 가장 심함) */
  painLevel: number;
  /** 사용자가 선택한 순서 (선택적, 향후 확장) */
  selectionOrder?: number;
}

/**
 * 병합 요청 입력
 */
export interface MergeRequest {
  /** 선택된 부위 목록 */
  bodyParts: BodyPartSelection[];
  /** 전체 통증 정도 (최대값 또는 평균, 1-5) */
  painLevel: number;
  /** 사용 가능한 기구 목록 */
  equipmentAvailable: string[];
  /** 운동 경험 수준 (선택) */
  experienceLevel?: string;
  /** 총 운동 시간 (60, 90, 120분) */
  totalDurationMinutes?: 60 | 90 | 120;
}

/**
 * 병합된 운동 정보
 */
export interface MergedExercise {
  /** 운동 템플릿 ID */
  exerciseTemplateId: string;
  /** 운동 템플릿 이름 */
  exerciseTemplateName: string;
  /** 이 운동이 적용되는 부위 ID 목록 */
  bodyPartIds: string[];
  /** 최종 우선순위 점수 (낮을수록 우선순위 높음) */
  priorityScore: number;
  /** 섹션 (warmup, main, cooldown) */
  section: 'warmup' | 'main' | 'cooldown';
  /** 섹션 내 순서 */
  orderInSection: number;
  /** 운동 시간 (분) */
  durationMinutes?: number;
  /** 반복 횟수 */
  reps?: number;
  /** 세트 수 */
  sets?: number;
  /** 휴식 시간 (초) */
  restSeconds?: number;
  /** 강도 레벨 (1-4) */
  intensityLevel?: number;
  /** 난이도 점수 (1-10) */
  difficultyScore?: number;
  /** 통증 정도 범위 */
  painLevelRange?: string;
  /** 운동 설명 */
  description?: string;
  /** 운동 지시사항 */
  instructions?: string;
  /** 주의사항 */
  precautions?: string;
}

/**
 * 병합 결과
 */
export interface MergeResult {
  /** 병합된 운동 목록 */
  exercises: MergedExercise[];
  /** 총 예상 시간 (분) */
  totalDuration: number;
  /** 경고 메시지 (선택) */
  warnings?: string[];
  /** 부위별 운동 개수 통계 */
  stats?: {
    warmup: number;
    main: number;
    cooldown: number;
    byBodyPart: Record<string, number>;
  };
}

