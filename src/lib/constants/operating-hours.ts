/**
 * @file operating-hours.ts
 * @description 운영시간 관련 상수 및 유틸리티
 * 
 * 운영시간 파싱 및 판단에 사용되는 상수들을 정의합니다.
 */

import type { DayOfWeek, OperatingHours } from '@/types/operating-hours';

/**
 * 요일 이름 (한국어)
 */
export const DAY_NAMES: Record<DayOfWeek, string> = {
  0: '일요일',
  1: '월요일',
  2: '화요일',
  3: '수요일',
  4: '목요일',
  5: '금요일',
  6: '토요일',
};

/**
 * 요일 이름 (영문 약자)
 */
export const DAY_NAMES_SHORT: Record<DayOfWeek, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

/**
 * 기본 운영시간 (모든 요일 동일)
 * 
 * 일반적인 헬스장 운영시간을 기본값으로 사용합니다.
 */
export const DEFAULT_OPERATING_HOURS: OperatingHours[] = [
  { dayOfWeek: 0, openTime: '08:00', closeTime: '22:00', isClosed: false }, // 일요일
  { dayOfWeek: 1, openTime: '06:00', closeTime: '24:00', isClosed: false }, // 월요일
  { dayOfWeek: 2, openTime: '06:00', closeTime: '24:00', isClosed: false }, // 화요일
  { dayOfWeek: 3, openTime: '06:00', closeTime: '24:00', isClosed: false }, // 수요일
  { dayOfWeek: 4, openTime: '06:00', closeTime: '24:00', isClosed: false }, // 목요일
  { dayOfWeek: 5, openTime: '06:00', closeTime: '24:00', isClosed: false }, // 금요일
  { dayOfWeek: 6, openTime: '08:00', closeTime: '22:00', isClosed: false }, // 토요일
];

/**
 * 24시간 운영시간
 */
export const TWENTY_FOUR_HOURS: OperatingHours[] = [
  { dayOfWeek: 0, openTime: '00:00', closeTime: '23:59', isClosed: false },
  { dayOfWeek: 1, openTime: '00:00', closeTime: '23:59', isClosed: false },
  { dayOfWeek: 2, openTime: '00:00', closeTime: '23:59', isClosed: false },
  { dayOfWeek: 3, openTime: '00:00', closeTime: '23:59', isClosed: false },
  { dayOfWeek: 4, openTime: '00:00', closeTime: '23:59', isClosed: false },
  { dayOfWeek: 5, openTime: '00:00', closeTime: '23:59', isClosed: false },
  { dayOfWeek: 6, openTime: '00:00', closeTime: '23:59', isClosed: false },
];

/**
 * 시간 형식 검증 정규표현식 (HH:mm)
 */
export const TIME_FORMAT_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * 시간 문자열을 분 단위로 변환
 * 
 * @param timeString "HH:mm" 형식의 시간 문자열
 * @returns 분 단위 시간 (0-1439)
 * 
 * @example
 * timeToMinutes("09:00") // 540
 * timeToMinutes("22:30") // 1350
 */
export function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * 분 단위 시간을 "HH:mm" 형식 문자열로 변환
 * 
 * @param minutes 분 단위 시간 (0-1439)
 * @returns "HH:mm" 형식의 시간 문자열
 * 
 * @example
 * minutesToTime(540) // "09:00"
 * minutesToTime(1350) // "22:30"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * 시간 문자열이 유효한지 검증
 * 
 * @param timeString 검증할 시간 문자열
 * @returns 유효 여부
 */
export function isValidTimeFormat(timeString: string): boolean {
  return TIME_FORMAT_REGEX.test(timeString);
}

/**
 * 현재 한국 시간대(KST) 기준 요일 반환
 * 
 * @param date 기준 날짜 (기본값: 현재 시간)
 * @returns 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)
 */
export function getDayOfWeek(date: Date = new Date()): DayOfWeek {
  // 한국 시간대(KST) 기준으로 변환
  const kstDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  return kstDate.getDay() as DayOfWeek;
}

/**
 * 현재 한국 시간대(KST) 기준 시간 반환
 * 
 * @param date 기준 날짜 (기본값: 현재 시간)
 * @returns "HH:mm" 형식의 시간 문자열
 */
export function getCurrentTimeString(date: Date = new Date()): string {
  const kstDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const hours = kstDate.getHours();
  const minutes = kstDate.getMinutes();
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

