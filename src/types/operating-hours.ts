/**
 * @file operating-hours.ts
 * @description 운영시간 관련 타입 정의
 * 
 * 헬스장 운영시간 정보를 표현하기 위한 TypeScript 타입들을 정의합니다.
 * DB 스키마(gym_operating_hours)와 일치하도록 설계되었습니다.
 */

/**
 * 요일 타입 (0: 일요일, 1: 월요일, ..., 6: 토요일)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * 운영시간 정보
 * 
 * 요일별 운영시간을 나타냅니다.
 * DB의 gym_operating_hours 테이블과 일치합니다.
 * 
 * 브레이크 타임 처리:
 * - 브레이크 타임(휴게시간, 점심시간 등)은 별도 필드가 없으며,
 *   notes 필드에 저장됩니다.
 * - 예시: "브레이크: 15:00~17:00", "점심시간: 12:00-13:00"
 * - 자정 넘김 운영시간도 notes 필드에 명시할 수 있습니다.
 *   예시: "22:00~02:00 (자정 넘김)"
 */
export interface OperatingHours {
  /** 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일) */
  dayOfWeek: DayOfWeek;
  /** 오픈 시간 (HH:mm 형식, 예: "09:00") */
  openTime?: string;
  /** 마감 시간 (HH:mm 형식, 예: "22:00") */
  closeTime?: string;
  /** 휴무일 여부 */
  isClosed: boolean;
  /** 
   * 특이사항
   * - 브레이크 타임 정보: "브레이크: 15:00~17:00", "점심시간: 12:00-13:00" 등
   * - 자정 넘김 운영시간: "22:00~02:00 (자정 넘김)" 등
   * - 기타 운영시간 관련 메모
   */
  notes?: string;
}

/**
 * 운영시간 입력 데이터
 * 
 * 파싱된 운영시간 정보를 DB에 저장하기 전의 형태입니다.
 * 
 * 브레이크 타임 처리:
 * - 브레이크 타임 정보는 notes 필드에 저장됩니다.
 * - DB 스키마에 isBreakTime 필드가 없으므로 notes 필드를 활용합니다.
 */
export interface OperatingHoursInput {
  /** 요일 */
  dayOfWeek: DayOfWeek;
  /** 오픈 시간 */
  openTime?: string;
  /** 마감 시간 */
  closeTime?: string;
  /** 휴무일 여부 */
  isClosed?: boolean;
  /** 
   * 특이사항
   * - 브레이크 타임 정보 저장용
   * - 자정 넘김 운영시간 명시용
   */
  notes?: string;
}

/**
 * 영업 상태 정보
 * 
 * 현재 시간 기준 영업중 여부 및 관련 정보를 포함합니다.
 */
export interface OperatingHoursStatus {
  /** 영업중 여부 */
  isOpen: boolean;
  /** 다음 영업 시작 시간 (휴무 중일 때만 제공) */
  nextOpenTime?: {
    /** 다음 영업 시작 날짜 */
    date: Date;
    /** 다음 영업 시작 시간 (HH:mm 형식) */
    time: string;
    /** 다음 영업 요일 */
    dayOfWeek: DayOfWeek;
  };
  /** 오늘 운영시간 정보 */
  currentDayHours?: OperatingHours;
  /** 현재 시간 */
  currentTime: Date;
  /** 현재 요일 */
  currentDayOfWeek: DayOfWeek;
}

