/**
 * @file parse-operating-hours.ts
 * @description 운영시간 파싱 유틸리티
 * 
 * 네이버 API 응답의 description 필드에서 운영시간 정보를 추출합니다.
 * 
 * 주요 기능:
 * - description 필드에서 운영시간 파싱
 * - 24시간 헬스장 감지
 * - 다양한 시간 형식 지원
 * - 요일별 키워드 우선순위 파싱 (주말, 공휴일, 평일 등)
 * - 브레이크 타임 처리 (notes 필드에 저장)
 * - 자정 넘김 운영시간 처리
 * - 파싱 실패 시 기본값 반환
 */

import type { OperatingHours, OperatingHoursInput, DayOfWeek } from '@/types/operating-hours';
import { DEFAULT_OPERATING_HOURS, TWENTY_FOUR_HOURS, isValidTimeFormat } from '@/lib/constants/operating-hours';

/**
 * description 필드에서 운영시간 정보 파싱
 * 
 * @param description 네이버 API 응답의 description 필드
 * @returns 파싱된 운영시간 배열 (파싱 실패 시 기본값 반환)
 * 
 * @example
 * parseOperatingHoursFromDescription("운영시간: 09:00~22:00")
 * // [{ dayOfWeek: 0, openTime: "09:00", closeTime: "22:00", isClosed: false }, ...]
 * 
 * parseOperatingHoursFromDescription("24시간 운영")
 * // 24시간 운영시간 반환
 */
export function parseOperatingHoursFromDescription(
  description?: string
): OperatingHours[] {
  if (!description || typeof description !== 'string') {
    return DEFAULT_OPERATING_HOURS;
  }

  const normalizedDescription = description.trim();

  // 1. 24시간 헬스장 감지
  if (is24HoursGym(normalizedDescription)) {
    return TWENTY_FOUR_HOURS;
  }

  // 2. 브레이크 타임 추출 (운영시간과 구분)
  const breakTimeInfo = extractBreakTime(normalizedDescription);
  const descriptionWithoutBreakTime = breakTimeInfo.cleanedDescription;

  // 3. 시간 패턴 추출
  const timePattern = extractTimePattern(descriptionWithoutBreakTime);
  if (!timePattern) {
    return DEFAULT_OPERATING_HOURS;
  }

  // 4. 자정 넘김 처리
  const processedTimePattern = handleMidnightCrossing(timePattern);

  // 5. 요일별 키워드 우선순위 파싱
  const daySpecificHours = parseDaySpecificHoursWithPriority(
    descriptionWithoutBreakTime,
    processedTimePattern,
    breakTimeInfo.notes
  );
  if (daySpecificHours.length > 0) {
    return daySpecificHours;
  }

  // 6. 전체 요일 동일하게 적용
  return createOperatingHoursForAllDays(processedTimePattern, breakTimeInfo.notes);
}

/**
 * 24시간 헬스장인지 확인
 * 
 * @param description description 필드
 * @returns 24시간 헬스장 여부
 */
function is24HoursGym(description: string): boolean {
  const patterns = [
    /24시간/,
    /24시/,
    /24\s*시간/,
    /24\s*hr/,
    /24\s*hour/i,
    /상시\s*운영/,
    /24시간\s*운영/,
    /24시간\s*영업/,
  ];

  return patterns.some((pattern) => pattern.test(description));
}

/**
 * description에서 시간 패턴 추출
 * 
 * @param description description 필드
 * @returns 추출된 시간 패턴 { openTime, closeTime } 또는 null
 */
function extractTimePattern(description: string): { openTime: string; closeTime: string } | null {
  // 다양한 구분자 지원: ~, -, ~, 부터, 까지
  const patterns = [
    // "09:00~22:00" 형식
    /(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})/,
    // "09:00-22:00" 형식
    /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/,
    // "09:00 ~ 22:00" 형식 (공백 포함)
    /(\d{1,2}:\d{2})\s+~\s+(\d{1,2}:\d{2})/,
    // "09:00부터 22:00까지" 형식
    /(\d{1,2}:\d{2})\s*부터\s*(\d{1,2}:\d{2})\s*까지/,
    // "09:00에서 22:00까지" 형식
    /(\d{1,2}:\d{2})\s*에서\s*(\d{1,2}:\d{2})\s*까지/,
    // "09시~22시" 형식 (분 없음)
    /(\d{1,2})\s*시\s*~\s*(\d{1,2})\s*시/,
    // "09:00 ~ 22:00" 형식 (다양한 공백)
    /(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})/,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      let openTime = match[1];
      let closeTime = match[2];

      // "09시" 형식을 "09:00" 형식으로 변환
      if (!openTime.includes(':')) {
        openTime = `${openTime.padStart(2, '0')}:00`;
      }
      if (!closeTime.includes(':')) {
        closeTime = `${closeTime.padStart(2, '0')}:00`;
      }

      // 시간 형식 검증
      if (isValidTimeFormat(openTime) && isValidTimeFormat(closeTime)) {
        return { openTime, closeTime };
      }
    }
  }

  return null;
}

/**
 * 요일별 키워드 감지 및 매핑
 * 
 * @param description description 필드
 * @returns 감지된 요일 키워드 정보
 */
function detectDayKeywords(description: string): {
  specificDays: Map<DayOfWeek, { openTime?: string; closeTime?: string }>;
  weekdayDays: DayOfWeek[];
  weekendDays: DayOfWeek[];
  allDays: boolean;
} {
  const specificDays = new Map<DayOfWeek, { openTime?: string; closeTime?: string }>();
  let weekdayDays: DayOfWeek[] = [];
  let weekendDays: DayOfWeek[] = [];
  let allDays = false;

  // 특정 요일 키워드 감지 (우선순위 높음)
  const dayKeywords: Array<{ pattern: RegExp; days: DayOfWeek[] }> = [
    { pattern: /일요일|일\s*요일/g, days: [0] },
    { pattern: /월요일|월\s*요일/g, days: [1] },
    { pattern: /화요일|화\s*요일/g, days: [2] },
    { pattern: /수요일|수\s*요일/g, days: [3] },
    { pattern: /목요일|목\s*요일/g, days: [4] },
    { pattern: /금요일|금\s*요일/g, days: [5] },
    { pattern: /토요일|토\s*요일/g, days: [6] },
  ];

  for (const { pattern, days } of dayKeywords) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      const dayTimePattern = extractTimePatternForDay(description, match.index || 0);
      for (const day of days) {
        if (!specificDays.has(day)) {
          specificDays.set(day, dayTimePattern || {});
        }
      }
    }
  }

  // 평일/주중 키워드 감지
  if (/평일|주중/.test(description)) {
    weekdayDays = [1, 2, 3, 4, 5];
  }

  // 주말 키워드 감지
  if (/주말/.test(description)) {
    weekendDays = [0, 6];
  }

  // 매일 키워드 감지
  if (/매일|매\s*일/.test(description)) {
    allDays = true;
  }

  return { specificDays, weekdayDays, weekendDays, allDays };
}

/**
 * 브레이크 타임 추출
 * 
 * @param description description 필드
 * @returns 브레이크 타임 정보 및 정리된 description
 */
function extractBreakTime(description: string): {
  notes?: string;
  cleanedDescription: string;
} {
  const breakTimePatterns = [
    /브레이크\s*[:：]\s*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})/i,
    /휴게\s*[:：]\s*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})/i,
    /점심시간\s*[:：]\s*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})/i,
    /휴식시간\s*[:：]\s*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})/i,
    /브레이크\s*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})/i,
    /휴게\s*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})/i,
  ];

  let breakTimeNotes: string[] = [];
  let cleanedDescription = description;

  for (const pattern of breakTimePatterns) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      const startTime = match[1];
      const endTime = match[2];
      if (isValidTimeFormat(startTime) && isValidTimeFormat(endTime)) {
        breakTimeNotes.push(`브레이크: ${startTime}~${endTime}`);
        // 브레이크 타임 부분을 description에서 제거 (운영시간 파싱 방해 방지)
        cleanedDescription = cleanedDescription.replace(match[0], '');
      }
    }
  }

  return {
    notes: breakTimeNotes.length > 0 ? breakTimeNotes.join(', ') : undefined,
    cleanedDescription: cleanedDescription.trim(),
  };
}

/**
 * 자정 넘김 운영시간 처리
 * 
 * @param timePattern 시간 패턴
 * @returns 처리된 시간 패턴 (자정 넘김인 경우 notes 추가)
 */
function handleMidnightCrossing(
  timePattern: { openTime: string; closeTime: string }
): { openTime: string; closeTime: string; notes?: string } {
  const openMinutes = timeToMinutes(timePattern.openTime);
  const closeMinutes = timeToMinutes(timePattern.closeTime);

  // 종료 시간이 시작 시간보다 작으면 자정 넘김
  if (openMinutes > closeMinutes) {
    return {
      ...timePattern,
      notes: `${timePattern.openTime}~${timePattern.closeTime} (자정 넘김)`,
    };
  }

  return timePattern;
}

/**
 * 분 단위로 변환 (내부 헬퍼 함수)
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * 요일별 운영시간 파싱 (우선순위 로직 강화)
 * 
 * 우선순위: 특정 요일 키워드 > 평일/주말 > 매일 > 기본값
 * 
 * @param description description 필드
 * @param defaultTimePattern 기본 시간 패턴
 * @param breakTimeNotes 브레이크 타임 notes
 * @returns 요일별 운영시간 배열
 */
function parseDaySpecificHoursWithPriority(
  description: string,
  defaultTimePattern: { openTime: string; closeTime: string; notes?: string },
  breakTimeNotes?: string
): OperatingHours[] {
  const { specificDays, weekdayDays, weekendDays, allDays } = detectDayKeywords(description);
  const hours: OperatingHours[] = [];
  const processedDays = new Set<DayOfWeek>();

  // 1. 특정 요일 키워드가 있으면 우선 적용 (최우선)
  for (const [day, timePattern] of specificDays.entries()) {
    if (!processedDays.has(day)) {
      const finalTimePattern = timePattern.openTime && timePattern.closeTime
        ? timePattern
        : defaultTimePattern;
      
      const notes: string[] = [];
      if (defaultTimePattern.notes) notes.push(defaultTimePattern.notes);
      if (breakTimeNotes) notes.push(breakTimeNotes);

      hours.push({
        dayOfWeek: day,
        openTime: finalTimePattern.openTime ?? null,
        closeTime: finalTimePattern.closeTime ?? null,
        isClosed: false,
        notes: notes.length > 0 ? notes.join(', ') : null,
      });
      processedDays.add(day);
    }
  }

  // 2. 평일/주중 키워드 적용
  for (const day of weekdayDays) {
    if (!processedDays.has(day)) {
      const notes: string[] = [];
      if (defaultTimePattern.notes) notes.push(defaultTimePattern.notes);
      if (breakTimeNotes) notes.push(breakTimeNotes);

      hours.push({
        dayOfWeek: day,
        openTime: defaultTimePattern.openTime,
        closeTime: defaultTimePattern.closeTime,
        isClosed: false,
        notes: notes.length > 0 ? notes.join(', ') : null,
      });
      processedDays.add(day);
    }
  }

  // 3. 주말 키워드 적용
  for (const day of weekendDays) {
    if (!processedDays.has(day)) {
      const notes: string[] = [];
      if (defaultTimePattern.notes) notes.push(defaultTimePattern.notes);
      if (breakTimeNotes) notes.push(breakTimeNotes);

      hours.push({
        dayOfWeek: day,
        openTime: defaultTimePattern.openTime,
        closeTime: defaultTimePattern.closeTime,
        isClosed: false,
        notes: notes.length > 0 ? notes.join(', ') : null,
      });
      processedDays.add(day);
    }
  }

  // 4. 매일 키워드가 있으면 나머지 요일 모두 적용
  if (allDays) {
    for (let day = 0; day < 7; day++) {
      if (!processedDays.has(day as DayOfWeek)) {
        const notes: string[] = [];
        if (defaultTimePattern.notes) notes.push(defaultTimePattern.notes);
        if (breakTimeNotes) notes.push(breakTimeNotes);

        hours.push({
          dayOfWeek: day as DayOfWeek,
          openTime: defaultTimePattern.openTime,
          closeTime: defaultTimePattern.closeTime,
          isClosed: false,
          notes: notes.length > 0 ? notes.join(', ') : null,
        });
        processedDays.add(day as DayOfWeek);
      }
    }
  }

  // 5. 특정 요일이 처리되었지만 모든 요일이 아닌 경우, 나머지 요일은 기본값 사용
  if (hours.length > 0 && hours.length < 7 && !allDays) {
    for (let day = 0; day < 7; day++) {
      if (!processedDays.has(day as DayOfWeek)) {
        const notes: string[] = [];
        if (defaultTimePattern.notes) notes.push(defaultTimePattern.notes);
        if (breakTimeNotes) notes.push(breakTimeNotes);

        hours.push({
          dayOfWeek: day as DayOfWeek,
          openTime: defaultTimePattern.openTime,
          closeTime: defaultTimePattern.closeTime,
          isClosed: false,
          notes: notes.length > 0 ? notes.join(', ') : null,
        });
      }
    }
  }

  return hours.length > 0 ? hours : [];
}

/**
 * 특정 위치 근처의 시간 패턴 추출
 * 
 * @param description description 필드
 * @param position 검색 시작 위치
 * @returns 추출된 시간 패턴 또는 null
 */
function extractTimePatternForDay(
  description: string,
  position: number
): { openTime: string; closeTime: string } | null {
  // 위치 근처 100자 내에서 시간 패턴 검색
  const start = Math.max(0, position - 50);
  const end = Math.min(description.length, position + 100);
  const substring = description.substring(start, end);

  return extractTimePattern(substring);
}

/**
 * 모든 요일에 동일한 운영시간 생성
 * 
 * @param timePattern 시간 패턴
 * @param breakTimeNotes 브레이크 타임 notes
 * @returns 운영시간 배열
 */
function createOperatingHoursForAllDays(
  timePattern: { openTime: string; closeTime: string; notes?: string },
  breakTimeNotes?: string
): OperatingHours[] {
  const hours: OperatingHours[] = [];
  const notes: string[] = [];
  if (timePattern.notes) notes.push(timePattern.notes);
  if (breakTimeNotes) notes.push(breakTimeNotes);

  for (let day = 0; day < 7; day++) {
    hours.push({
      dayOfWeek: day as DayOfWeek,
      openTime: timePattern.openTime,
      closeTime: timePattern.closeTime,
      isClosed: false,
      notes: notes.length > 0 ? notes.join(', ') : undefined,
    });
  }

  return hours;
}

/**
 * 기본 운영시간 생성
 * 
 * @returns 기본 운영시간 배열
 */
export function createDefaultOperatingHours(): OperatingHours[] {
  return DEFAULT_OPERATING_HOURS;
}

/**
 * 네이버 API 응답에서 운영시간 정보 정규화
 * 
 * @param raw 네이버 API 원본 응답
 * @returns 정규화된 운영시간 배열
 */
export function normalizeOperatingHours(raw: any): OperatingHours[] {
  // description 필드에서 파싱 시도
  if (raw.description) {
    const parsed = parseOperatingHoursFromDescription(raw.description);
    if (parsed.length > 0) {
      return parsed;
    }
  }

  // 파싱 실패 시 기본값 반환
  return DEFAULT_OPERATING_HOURS;
}

