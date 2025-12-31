/**
 * Exercise Template 타입 정의
 * 
 * 재활 운동 템플릿의 JSON 입력 형식을 정의합니다.
 * 데이터베이스 업로드 전 JSON 파일에서 읽어올 때 사용하는 타입입니다.
 */

/**
 * 운동 템플릿 입력 타입
 * 
 * JSON 파일에서 읽어올 때 사용하는 형식입니다.
 * body_part_id와 equipment_type_id 대신 name을 사용하여
 * 업로드 시점에 UUID로 변환합니다.
 */
export interface ExerciseTemplateInput {
  /** 운동 이름 (필수) */
  name: string;
  
  /** 부위 이름 (body_parts.name 기준, 필수) */
  bodyPartName: string;
  
  /** 운동 설명 (선택) */
  description?: string;
  
  /** 강도 레벨 (1-4, 선택) */
  intensity_level?: number;
  
  /** 운동 시간 (분, 선택) */
  duration_minutes?: number;
  
  /** 반복 횟수 (선택) */
  reps?: number;
  
  /** 세트 수 (선택) */
  sets?: number;
  
  /** 휴식 시간 (초, 선택) */
  rest_seconds?: number;
  
  /** 난이도 점수 (1-10, 선택) */
  difficulty_score?: number;
  
  /** 금기사항 배열 (선택) */
  contraindications?: string[];
  
  /** 운동 지시사항 (선택) */
  instructions?: string;
  
  /** 주의사항 (선택) */
  precautions?: string;
  
  /** 사용 기구 이름 배열 (equipment_types.name 기준, 선택) */
  equipmentTypes?: string[];
}

/**
 * 검증 결과 타입
 */
export interface ValidationResult {
  /** 검증 성공 여부 */
  success: boolean;
  
  /** 에러 메시지 배열 */
  errors: string[];
  
  /** 경고 메시지 배열 */
  warnings?: string[];
}

