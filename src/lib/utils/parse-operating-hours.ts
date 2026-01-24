/**
 * @file parse-operating-hours.ts
 * @description 운영시간 파싱 유틸리티 (Phase 2 재구현)
 *
 * 네이버 API 응답의 description 필드에서 운영시간 정보를 추출합니다.
 *
 * 핵심 설계 원칙:
 * 1. 실패 안전: 파싱 실패 시 항상 기본값 반환 (앱이 죽지 않음)
 * 2. 요일 우선순위: 전체(매일) > 평일/주말 > 특정 요일 순으로 덮어쓰기
 * 3. Map 기반 덮어쓰기: 요일별로 Map에 저장하여 우선순위 적용
 * 4. 자정 넘김 처리: closeTime < openTime인 경우 다음날로 간주
 * 5. 브레이크 타임: notes 필드에 저장 (파싱 결과에는 포함하지 않음)
 */

import type { OperatingHours, DayOfWeek } from "@/types/operating-hours";
import {
  DEFAULT_OPERATING_HOURS,
  TWENTY_FOUR_HOURS,
  isValidTimeFormat,
} from "@/lib/constants/operating-hours";

/**
 * description 필드에서 운영시간 정보 파싱
 *
 * @param description 네이버 API 응답의 description 필드
 * @returns 파싱된 운영시간 배열 (요일별 7개 고정, 파싱 실패 시 기본값 반환)
 *
 * @example
 * parseOperatingHoursFromDescription("운영시간: 09:00~22:00")
 * // [{ dayOfWeek: 0, openTime: "09:00", closeTime: "22:00", isClosed: false }, ...]
 *
 * parseOperatingHoursFromDescription("24시간 연중무휴")
 * // 24시간 운영시간 반환
 */
export function parseOperatingHoursFromDescription(
  description?: string,
): OperatingHours[] {
  // 실패 안전 장치: 입력이 없거나 유효하지 않으면 기본값 반환
  if (!description || typeof description !== "string") {
    return DEFAULT_OPERATING_HOURS;
  }

  const normalizedDescription = description.trim();

  // 1️⃣ 24시간 헬스장 감지 (최우선)
  if (is24HoursGym(normalizedDescription)) {
    return TWENTY_FOUR_HOURS;
  }

  // 2️⃣ 브레이크 타임 추출 (운영시간 파싱과 분리)
  const breakTimeInfo = extractBreakTime(normalizedDescription);
  const descriptionWithoutBreakTime = breakTimeInfo.cleanedDescription;

  // 3️⃣ 시간 패턴 추출
  const timePattern = extractTimePattern(descriptionWithoutBreakTime);
  if (!timePattern) {
    // 시간 패턴을 찾지 못하면 기본값 반환
    return DEFAULT_OPERATING_HOURS;
  }

  // 4️⃣ 자정 넘김 처리
  const processedTimePattern = handleMidnightCrossing(timePattern);

  // 5️⃣ 요일별 우선순위 파싱 (Map 기반 덮어쓰기)
  const { dayHoursMap, hasExplicitDayRange } =
    parseDaySpecificHoursWithPriority(
      descriptionWithoutBreakTime,
      processedTimePattern,
      breakTimeInfo.notes,
    );

  // 6️⃣ 7개 요일 모두 채우기
  // - 요일 범위가 명시적으로 지정된 경우: 명시되지 않은 요일은 isClosed: true
  // - "매일" 키워드가 있거나 요일 지정이 없는 경우: 모든 요일 기본 시간 패턴 사용
  return createCompleteOperatingHours(
    dayHoursMap,
    processedTimePattern,
    breakTimeInfo.notes,
    hasExplicitDayRange,
  );
}

/**
 * 1️⃣ 24시간 헬스장인지 확인
 *
 * 키워드: 24시간, 연중무휴
 * 결과: 00:00 ~ 23:59, isClosed = false
 *
 * @param description description 필드
 * @returns 24시간 헬스장 여부
 */
function is24HoursGym(description: string): boolean {
  const patterns = [
    /24시간/,
    /24시/,
    /24\s*시간/,
    /24\s*hr/i,
    /24\s*hour/i,
    /상시\s*운영/,
    /24시간\s*운영/,
    /24시간\s*영업/,
    /연중무휴/,
    /연중\s*무휴/,
  ];

  return patterns.some((pattern) => pattern.test(description));
}

/**
 * 3️⃣ description에서 시간 패턴 추출
 *
 * HH:mm 형식만 허용
 * 10:00 - 22:00, 10시~22시 모두 대응
 * 잘못된 형식은 무시하고 null 반환
 *
 * @param description description 필드
 * @returns 추출된 시간 패턴 { openTime, closeTime } 또는 null
 */
function extractTimePattern(
  description: string,
): { openTime: string; closeTime: string } | null {
  // 다양한 구분자 지원: ~, -, 부터, 까지
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
      if (!openTime.includes(":")) {
        openTime = `${openTime.padStart(2, "0")}:00`;
      }
      if (!closeTime.includes(":")) {
        closeTime = `${closeTime.padStart(2, "0")}:00`;
      }

      // 시간 형식 검증 (HH:mm 형식만 허용)
      if (isValidTimeFormat(openTime) && isValidTimeFormat(closeTime)) {
        return { openTime, closeTime };
      }
    }
  }

  return null;
}

/**
 * 5️⃣ 브레이크 타임 추출
 *
 * 정규식으로 분리
 * notes 필드에 저장 (파싱 결과에는 포함하지 않음)
 *
 * @param description description 필드
 * @returns 브레이크 타임 정보 및 정리된 description
 */
function extractBreakTime(description: string): {
  notes?: string | null;
  cleanedDescription: string;
} {
  const breakTimePatterns = [
    /브레이크\s*[:：]\s*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})/gi,
    /휴게\s*[:：]\s*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})/gi,
    /점심시간\s*[:：]\s*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})/gi,
    /휴식시간\s*[:：]\s*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})/gi,
    /브레이크\s*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})/gi,
    /휴게\s*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})/gi,
    /중식시간\s*[:：]\s*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})/gi,
  ];

  const breakTimeNotes: string[] = [];
  let cleanedDescription = description;

  // 패턴 기반 브레이크 타임 추출
  for (const pattern of breakTimePatterns) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      const startTime = match[1];
      const endTime = match[2];
      if (isValidTimeFormat(startTime) && isValidTimeFormat(endTime)) {
        breakTimeNotes.push(`브레이크: ${startTime}~${endTime}`);
        // 브레이크 타임 부분을 description에서 제거 (운영시간 파싱 방해 방지)
        cleanedDescription = cleanedDescription.replace(match[0], "");
      }
    }
  }

  // 괄호 안의 브레이크타임 텍스트 추출 (예: "(브레이크타임 12:00~13:00)")
  const bracketPatterns = [
    /\([^)]*브레이크[^)]*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})[^)]*\)/gi,
    /\([^)]*브레이크타임[^)]*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})[^)]*\)/gi,
    /\([^)]*휴게[^)]*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})[^)]*\)/gi,
    /\([^)]*점심[^)]*(\d{1,2}:\d{2})\s*[~-]\s*(\d{1,2}:\d{2})[^)]*\)/gi,
  ];

  for (const pattern of bracketPatterns) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      const startTime = match[1];
      const endTime = match[2];
      if (isValidTimeFormat(startTime) && isValidTimeFormat(endTime)) {
        // 괄호 안의 전체 텍스트를 notes에 저장
        const bracketText = match[0].replace(/[()]/g, "").trim();
        if (!breakTimeNotes.some((note) => note.includes(bracketText))) {
          breakTimeNotes.push(bracketText);
        }
        // 괄호 부분을 description에서 제거
        cleanedDescription = cleanedDescription.replace(match[0], "");
      }
    }
  }

  return {
    notes: breakTimeNotes.length > 0 ? breakTimeNotes.join(", ") : null,
    cleanedDescription: cleanedDescription.trim(),
  };
}

/**
 * 4️⃣ 자정 넘김 운영시간 처리
 *
 * 예: 18:00 ~ 02:00
 * closeTime이 openTime보다 작으면 "다음날"로 간주
 * notes 필드에 명시
 *
 * @param timePattern 시간 패턴
 * @returns 처리된 시간 패턴 (자정 넘김인 경우 notes 추가)
 */
function handleMidnightCrossing(timePattern: {
  openTime: string;
  closeTime: string;
}): { openTime: string; closeTime: string; notes?: string | null } {
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
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * 2️⃣ 요일별 키워드 감지 및 매핑
 *
 * 우선순위: 전체(매일) > 평일/주말 > 특정 요일
 * Map 기반 덮어쓰기 구조 사용
 *
 * @param description description 필드
 * @param defaultTimePattern 기본 시간 패턴
 * @param breakTimeNotes 브레이크 타임 notes
 * @returns 요일별 운영시간 Map 및 명시적 요일 범위 지정 여부
 */
function parseDaySpecificHoursWithPriority(
  description: string,
  defaultTimePattern: {
    openTime: string;
    closeTime: string;
    notes?: string | null;
  },
  breakTimeNotes?: string | null,
): {
  dayHoursMap: Map<DayOfWeek, OperatingHours>;
  hasExplicitDayRange: boolean;
} {
  const dayHoursMap = new Map<DayOfWeek, OperatingHours>();
  const processedDays = new Set<DayOfWeek>();
  let hasExplicitDayRange = false;

  // 우선순위 1: 전체(매일) 키워드 감지
  if (/매일|매\s*일/.test(description)) {
    const notes: string[] = [];
    if (defaultTimePattern.notes) notes.push(defaultTimePattern.notes);
    if (breakTimeNotes) notes.push(breakTimeNotes);

    for (let day = 0; day < 7; day++) {
      dayHoursMap.set(day as DayOfWeek, {
        dayOfWeek: day as DayOfWeek,
        openTime: defaultTimePattern.openTime,
        closeTime: defaultTimePattern.closeTime,
        isClosed: false,
        notes: notes.length > 0 ? notes.join(", ") : null,
      });
      processedDays.add(day as DayOfWeek);
    }
    // "매일"은 명시적 범위가 아니므로 hasExplicitDayRange = false
    return { dayHoursMap, hasExplicitDayRange: false };
  }

  // 우선순위 2-1: 요일 범위 파싱 (월~금, 화~토 등)
  const dayRangePatterns: Array<{ pattern: RegExp; days: DayOfWeek[] }> = [
    { pattern: /월\s*[~-]\s*금/g, days: [1, 2, 3, 4, 5] as DayOfWeek[] },
    { pattern: /월\s*[~-]\s*목/g, days: [1, 2, 3, 4] as DayOfWeek[] },
    { pattern: /화\s*[~-]\s*토/g, days: [2, 3, 4, 5, 6] as DayOfWeek[] },
    { pattern: /수\s*[~-]\s*일/g, days: [3, 4, 5, 6, 0] as DayOfWeek[] },
    { pattern: /목\s*[~-]\s*월/g, days: [4, 5, 6, 0, 1] as DayOfWeek[] },
    { pattern: /금\s*[~-]\s*화/g, days: [5, 6, 0, 1, 2] as DayOfWeek[] },
    { pattern: /토\s*[~-]\s*수/g, days: [6, 0, 1, 2, 3] as DayOfWeek[] },
    { pattern: /일\s*[~-]\s*목/g, days: [0, 1, 2, 3, 4] as DayOfWeek[] },
  ];

  for (const { pattern, days } of dayRangePatterns) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      hasExplicitDayRange = true; // 요일 범위가 명시적으로 지정됨
      // 범위 근처의 시간 패턴 추출 시도
      const rangeTimePattern = extractTimePatternForDay(
        description,
        match.index || 0,
      );
      const finalTimePattern = rangeTimePattern || defaultTimePattern;

      const notes: string[] = [];
      if (!rangeTimePattern && defaultTimePattern.notes) {
        notes.push(defaultTimePattern.notes);
      }
      if (breakTimeNotes) notes.push(breakTimeNotes);

      for (const day of days) {
        const dayOfWeek = day as DayOfWeek;
        if (!processedDays.has(dayOfWeek)) {
          dayHoursMap.set(dayOfWeek, {
            dayOfWeek,
            openTime: finalTimePattern.openTime,
            closeTime: finalTimePattern.closeTime,
            isClosed: false,
            notes: notes.length > 0 ? notes.join(", ") : null,
          });
          processedDays.add(dayOfWeek);
        }
      }
    }
  }

  // 우선순위 2-2: 평일/주중 키워드 감지
  if (/평일|주중/.test(description)) {
    hasExplicitDayRange = true; // 평일/주중도 명시적 범위 지정
    const weekdayDays: DayOfWeek[] = [1, 2, 3, 4, 5];
    const notes: string[] = [];
    if (defaultTimePattern.notes) notes.push(defaultTimePattern.notes);
    if (breakTimeNotes) notes.push(breakTimeNotes);

    for (const day of weekdayDays) {
      if (!processedDays.has(day)) {
        dayHoursMap.set(day, {
          dayOfWeek: day,
          openTime: defaultTimePattern.openTime,
          closeTime: defaultTimePattern.closeTime,
          isClosed: false,
          notes: notes.length > 0 ? notes.join(", ") : null,
        });
        processedDays.add(day);
      }
    }
  }

  // 우선순위 3: 주말 키워드 감지 및 휴무 처리
  const weekendDays: DayOfWeek[] = [0, 6];

  // "주말 휴무", "주말휴무", "토일 휴무" 등 감지
  if (
    /주말\s*휴무|주말휴무|토일\s*휴무|토일휴무|토요일.*일요일.*휴무/.test(
      description,
    )
  ) {
    for (const day of weekendDays) {
      if (!processedDays.has(day)) {
        dayHoursMap.set(day, {
          dayOfWeek: day,
          openTime: null,
          closeTime: null,
          isClosed: true,
          notes: null,
        });
        processedDays.add(day);
      }
    }
  } else if (/주말/.test(description)) {
    // "주말"만 있고 휴무가 아닌 경우
    const notes: string[] = [];
    if (defaultTimePattern.notes) notes.push(defaultTimePattern.notes);
    if (breakTimeNotes) notes.push(breakTimeNotes);

    for (const day of weekendDays) {
      if (!processedDays.has(day)) {
        dayHoursMap.set(day, {
          dayOfWeek: day,
          openTime: defaultTimePattern.openTime,
          closeTime: defaultTimePattern.closeTime,
          isClosed: false,
          notes: notes.length > 0 ? notes.join(", ") : null,
        });
        processedDays.add(day);
      }
    }
  }

  // 평일 휴무 감지
  if (/평일\s*휴무|평일휴무|주중\s*휴무|주중휴무/.test(description)) {
    const weekdayDays: DayOfWeek[] = [1, 2, 3, 4, 5];
    for (const day of weekdayDays) {
      if (!processedDays.has(day)) {
        dayHoursMap.set(day, {
          dayOfWeek: day,
          openTime: null,
          closeTime: null,
          isClosed: true,
          notes: null,
        });
        processedDays.add(day);
      }
    }
  }

  // 우선순위 4: 특정 요일 키워드 감지 (가장 낮은 우선순위)
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
      hasExplicitDayRange = true; // 특정 요일도 명시적 범위 지정
      // 특정 요일 근처의 시간 패턴 추출 시도
      const dayTimePattern = extractTimePatternForDay(
        description,
        match.index || 0,
      );
      const finalTimePattern = dayTimePattern || defaultTimePattern;

      const notes: string[] = [];
      if (
        "notes" in finalTimePattern &&
        finalTimePattern.notes &&
        typeof finalTimePattern.notes === "string"
      ) {
        notes.push(finalTimePattern.notes);
      }
      if (breakTimeNotes) notes.push(breakTimeNotes);

      for (const day of days) {
        if (!processedDays.has(day)) {
          dayHoursMap.set(day, {
            dayOfWeek: day,
            openTime: finalTimePattern.openTime,
            closeTime: finalTimePattern.closeTime,
            isClosed: false,
            notes: notes.length > 0 ? notes.join(", ") : null,
          });
          processedDays.add(day);
        }
      }
    }
  }

  return { dayHoursMap, hasExplicitDayRange };
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
  position: number,
): { openTime: string; closeTime: string } | null {
  // 위치 근처 100자 내에서 시간 패턴 검색
  const start = Math.max(0, position - 50);
  const end = Math.min(description.length, position + 100);
  const substring = description.substring(start, end);

  return extractTimePattern(substring);
}

/**
 * 7개 요일 모두 채우기
 *
 * @param dayHoursMap 요일별 운영시간 Map
 * @param defaultTimePattern 기본 시간 패턴
 * @param breakTimeNotes 브레이크 타임 notes
 * @param hasExplicitDayRange 요일 범위가 명시적으로 지정되었는지 여부
 * @returns 완전한 운영시간 배열 (7개 요일)
 */
function createCompleteOperatingHours(
  dayHoursMap: Map<DayOfWeek, OperatingHours>,
  defaultTimePattern: {
    openTime: string;
    closeTime: string;
    notes?: string | null;
  },
  breakTimeNotes?: string | null,
  hasExplicitDayRange: boolean = false,
): OperatingHours[] {
  const hours: OperatingHours[] = [];
  const notes: string[] = [];
  if (defaultTimePattern.notes) notes.push(defaultTimePattern.notes);
  if (breakTimeNotes) notes.push(breakTimeNotes);

  // 7개 요일 모두 채우기
  for (let day = 0; day < 7; day++) {
    const dayOfWeek = day as DayOfWeek;

    // Map에 있으면 사용
    if (dayHoursMap.has(dayOfWeek)) {
      hours.push(dayHoursMap.get(dayOfWeek)!);
    } else {
      // Map에 없으면:
      // - 요일 범위가 명시적으로 지정된 경우: isClosed: true
      // - 그렇지 않은 경우: 기본 시간 패턴 사용
      if (hasExplicitDayRange) {
        hours.push({
          dayOfWeek,
          openTime: null,
          closeTime: null,
          isClosed: true,
          notes: null,
        });
      } else {
        hours.push({
          dayOfWeek,
          openTime: defaultTimePattern.openTime,
          closeTime: defaultTimePattern.closeTime,
          isClosed: false,
          notes: notes.length > 0 ? notes.join(", ") : null,
        });
      }
    }
  }

  return hours;
}
