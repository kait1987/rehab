/**
 * @file check-business-status.ts
 * @description 영업중 여부 판단 유틸리티
 * 
 * 현재 시간과 운영시간을 비교하여 영업중 여부를 판단합니다.
 * 
 * 주요 기능:
 * - 현재 시간 기준 영업중 여부 판단
 * - 다음 영업 시작 시간 계산
 * - 영업 상태 정보 반환
 */

import type { OperatingHours, OperatingHoursStatus, DayOfWeek } from '@/types/operating-hours';
import {
  getDayOfWeek,
  getCurrentTimeString,
  timeToMinutes,
  minutesToTime,
  DAY_NAMES,
} from '@/lib/constants/operating-hours';

/**
 * 현재 시간 기준 영업중 여부 판단
 * 
 * @param operatingHours 운영시간 배열
 * @param currentTime 기준 시간 (기본값: 현재 시간)
 * @returns 영업중 여부
 * 
 * @example
 * const hours = [
 *   { dayOfWeek: 1, openTime: "09:00", closeTime: "22:00", isClosed: false },
 * ];
 * isGymOpen(hours) // 현재 시간이 09:00-22:00 사이이고 월요일이면 true
 */
export function isGymOpen(
  operatingHours: OperatingHours[],
  currentTime: Date = new Date()
): boolean {
  const status = getBusinessStatus(operatingHours, currentTime);
  return status.isOpen;
}

/**
 * 다음 영업 시작 시간 반환
 * 
 * @param operatingHours 운영시간 배열
 * @param currentTime 기준 시간 (기본값: 현재 시간)
 * @returns 다음 영업 시작 시간 정보 또는 null
 * 
 * @example
 * const hours = [
 *   { dayOfWeek: 1, openTime: "09:00", closeTime: "22:00", isClosed: false },
 * ];
 * getNextOpenTime(hours) // { date: Date, time: "09:00", dayOfWeek: 1 }
 */
export function getNextOpenTime(
  operatingHours: OperatingHours[],
  currentTime: Date = new Date()
): OperatingHoursStatus['nextOpenTime'] {
  const status = getBusinessStatus(operatingHours, currentTime);
  return status.nextOpenTime;
}

/**
 * 영업 상태 정보 반환
 * 
 * @param operatingHours 운영시간 배열
 * @param currentTime 기준 시간 (기본값: 현재 시간)
 * @returns 영업 상태 정보
 * 
 * @example
 * const hours = [
 *   { dayOfWeek: 1, openTime: "09:00", closeTime: "22:00", isClosed: false },
 * ];
 * getBusinessStatus(hours)
 * // {
 * //   isOpen: true,
 * //   currentDayHours: { dayOfWeek: 1, openTime: "09:00", closeTime: "22:00", isClosed: false },
 * //   currentTime: Date,
 * //   currentDayOfWeek: 1
 * // }
 */
export function getBusinessStatus(
  operatingHours: OperatingHours[],
  currentTime: Date = new Date()
): OperatingHoursStatus {
  const currentDayOfWeek = getDayOfWeek(currentTime);
  const currentTimeString = getCurrentTimeString(currentTime);
  const currentMinutes = timeToMinutes(currentTimeString);

  // 오늘의 운영시간 찾기
  const todayHours = operatingHours.find((h) => h.dayOfWeek === currentDayOfWeek);

  // 운영시간 정보가 없으면 영업중으로 간주 (기본값)
  if (!todayHours) {
    return {
      isOpen: true,
      nextOpenTime: null,
      closingTime: null,
      currentTime,
      currentDayOfWeek,
    };
  }

  // 휴무일이면 영업중 아님
  if (todayHours.isClosed) {
    const nextOpenTime = findNextOpenTime(operatingHours, currentTime, currentDayOfWeek);
    return {
      isOpen: false,
      nextOpenTime,
      closingTime: null,
      currentDayHours: todayHours,
      currentTime,
      currentDayOfWeek,
    };
  }

  // 운영시간이 없으면 영업중으로 간주
  if (!todayHours.openTime || !todayHours.closeTime) {
    return {
      isOpen: true,
      nextOpenTime: null,
      closingTime: null,
      currentDayHours: todayHours,
      currentTime,
      currentDayOfWeek,
    };
  }

  // 시간 범위 확인
  const openMinutes = timeToMinutes(todayHours.openTime);
  const closeMinutes = timeToMinutes(todayHours.closeTime);

  let isOpen = false;

  // 자정을 넘어가는 경우 (예: 22:00-02:00)
  if (closeMinutes < openMinutes) {
    // 현재 시간이 오픈 시간 이후이거나 마감 시간 이전이면 영업중
    isOpen = currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  } else {
    // 일반적인 경우 (예: 09:00-22:00)
    isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  if (isOpen) {
    // 마감 시간 계산
    const closingDate = new Date(currentTime);
    const [closeHours, closeMinutes] = todayHours.closeTime.split(':').map(Number);
    
    // 자정을 넘어가는 경우 다음날로 설정
    if (closeMinutes < openMinutes) {
      closingDate.setDate(closingDate.getDate() + 1);
    }
    closingDate.setHours(closeHours, closeMinutes, 0, 0);
    
    return {
      isOpen: true,
      nextOpenTime: null,
      closingTime: closingDate,
      currentDayHours: todayHours,
      currentTime,
      currentDayOfWeek,
    };
  }

  // 영업중이 아니면 다음 영업 시작 시간 찾기
  const nextOpenTime = findNextOpenTime(operatingHours, currentTime, currentDayOfWeek);

  return {
    isOpen: false,
    nextOpenTime,
    closingTime: null,
    currentDayHours: todayHours,
    currentTime,
    currentDayOfWeek,
  };
}

/**
 * 다음 영업 시작 시간 찾기
 * 
 * @param operatingHours 운영시간 배열
 * @param currentTime 현재 시간
 * @param currentDayOfWeek 현재 요일
 * @returns 다음 영업 시작 시간 (Date 객체) 또는 null
 */
function findNextOpenTime(
  operatingHours: OperatingHours[],
  currentTime: Date,
  currentDayOfWeek: DayOfWeek
): OperatingHoursStatus['nextOpenTime'] {
  // 오늘부터 7일 내에서 다음 영업 시작 시간 찾기
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDay = (currentDayOfWeek + dayOffset) % 7 as DayOfWeek;
    const targetHours = operatingHours.find((h) => h.dayOfWeek === targetDay);

    if (!targetHours || targetHours.isClosed || !targetHours.openTime) {
      continue;
    }

    const targetDate = new Date(currentTime);
    targetDate.setDate(targetDate.getDate() + dayOffset);
    targetDate.setHours(0, 0, 0, 0);

    const [hours, minutes] = targetHours.openTime.split(':').map(Number);
    targetDate.setHours(hours, minutes, 0, 0);

    // 오늘이고 현재 시간보다 이전이면 다음 날로
    if (dayOffset === 0 && targetDate <= currentTime) {
      continue;
    }

    return targetDate;
  }

  return null;
}

/**
 * 운영시간을 사람이 읽기 쉬운 형식으로 변환
 * 
 * @param operatingHours 운영시간 배열
 * @returns 포맷된 문자열
 * 
 * @example
 * formatOperatingHours(hours)
 * // "월요일: 09:00-22:00\n화요일: 09:00-22:00\n..."
 */
export function formatOperatingHours(operatingHours: OperatingHours[]): string {
  const lines: string[] = [];

  for (const hours of operatingHours) {
    const dayName = DAY_NAMES[hours.dayOfWeek];
    let line = `${dayName}: `;

    if (hours.isClosed) {
      line += '휴무';
    } else if (hours.openTime && hours.closeTime) {
      line += `${hours.openTime}-${hours.closeTime}`;
    } else {
      line += '정보 없음';
    }

    if (hours.notes) {
      line += ` (${hours.notes})`;
    }

    lines.push(line);
  }

  return lines.join('\n');
}

