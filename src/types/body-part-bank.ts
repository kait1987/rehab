/**
 * 부위 Bank 관련 타입 정의
 * 
 * 부위별 추천 운동 매핑 및 금기 운동 정의를 위한 JSON 입력 형식을 정의합니다.
 */

/**
 * 부위별 추천 운동 매핑 입력 타입
 * JSON 파일에서 읽어올 때 사용하는 형식입니다.
 * body_part_id와 exercise_template_id 대신 name을 사용하여
 * 업로드 시점에 UUID로 변환합니다.
 */
export interface BodyPartExerciseMappingInput {
  /** 부위 이름 (body_parts.name 기준, 필수) */
  bodyPartName: string;
  /** 운동 템플릿 이름 (exercise_templates.name 기준, 필수) */
  exerciseTemplateName: string;
  /** 우선순위 (낮을수록 우선순위 높음, 필수) */
  priority: number;
  /** 권장 강도 레벨 (1-4, 선택) */
  intensity_level?: number;
  /** 통증 정도 범위 (예: '1-2', '3-4', '5', 'all', 선택) */
  pain_level_range?: string;
  /** 활성화 여부 (선택, 기본값 true) */
  is_active?: boolean;
}

/**
 * 부위별 금기 운동 입력 타입
 * JSON 파일에서 읽어올 때 사용하는 형식입니다.
 * body_part_id와 exercise_template_id 대신 name을 사용하여
 * 업로드 시점에 UUID로 변환합니다.
 */
export interface BodyPartContraindicationInput {
  /** 부위 이름 (body_parts.name 기준, 필수) */
  bodyPartName: string;
  /** 운동 템플릿 이름 (exercise_templates.name 기준, 필수) */
  exerciseTemplateName: string;
  /** 최소 통증 정도 (이 이상일 때 금기, NULL이면 항상 금기, 선택) */
  pain_level_min?: number;
  /** 금기 사유 (선택) */
  reason?: string;
  /** 금기 심각도 ('warning' | 'strict', 선택, 기본값 'warning') */
  severity?: 'warning' | 'strict';
  /** 활성화 여부 (선택, 기본값 true) */
  is_active?: boolean;
}

/**
 * 부위 Bank 전체 입력 타입
 * 특정 부위에 대한 추천 운동 및 금기 운동 목록을 포함합니다.
 */
export interface BodyPartBankInput {
  /** 부위 이름 (body_parts.name 기준, 필수) */
  bodyPartName: string;
  /** 추천 운동 매핑 목록 */
  recommended: BodyPartExerciseMappingInput[];
  /** 금기 운동 목록 */
  contraindications: BodyPartContraindicationInput[];
}

/**
 * 검증 결과 타입 (재사용)
 */
export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings?: string[];
}

