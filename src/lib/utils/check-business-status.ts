/**
 * @file check-business-status.ts
 * @description 영업중 여부 판단 유틸리티 (Phase 2 재구현)
 * 
 * 현재 시간과 운영시간을 비교하여 영업중 여부를 판단합니다.
 * 
 * 핵심 설계 원칙:
 * 1. 한국 시간(KST) 기준: 모든 시간 계산은 KST 기준
 * 2. 자정 넘김 처리: closeTime < openTime인 경우 다음날로 간주
 * 3. closingTime 반환: 영업 중일 때 마감 시간 반환
 * 4. nextOpenTime 계산: 영업 종료 상태일 때 다음 영업 시작 시간 계산
 */

import type { OperatingHours, OperatingHoursStatus, DayOfWeek } from '@/types/operating-hours';
import {
  getDayOfWeek,
  getCurrentTimeString,
  timeToMinutes,
} from '@/lib/constants/operating-hours';

/**
 * 영업 상태 정보 반환
 * 
 * @param operatingHours 운영시간 배열 (요일별 7개)
 * @param now 기준 시간 (기본값: 현재 시간)
 * @returns 영업 상태 정보
 * 
 * @example
 * const hours = [
 *   { dayOfWeek: 1, openTime: "09:00", closeTime: "22:00", isClosed: false },
 * ];
 * getBusinessStatus(hours)
 * // {
 * //   isOpen: true,
 * //   nextOpenTime: null,
 * //   closingTime: Date (오늘 22:00),
 * //   currentDayHours: { dayOfWeek: 1, ... },
 * //   currentTime: Date,
 * //   currentDayOfWeek: 1
 * // }
 */
export function getBusinessStatus(
  operatingHours: OperatingHours[],
  now: Date = new Date()
): OperatingHoursStatus {
  // 한국 시간대(KST) 기준으로 변환
  const kstNow = getKSTDate(now);
  const currentDayOfWeek = getDayOfWeek(kstNow);
  const currentTimeString = getCurrentTimeString(kstNow);
  const currentMinutes = timeToMinutes(currentTimeString);

  // 오늘의 운영시간 찾기
  const todayHours = operatingHours.find((h) => h.dayOfWeek === currentDayOfWeek);

  // 운영시간 정보가 없으면 영업중으로 간주 (기본값)
  if (!todayHours) {
    return {
      isOpen: true,
      nextOpenTime: null,
      closingTime: null,
      currentTime: kstNow,
      currentDayOfWeek,
    };
  }

  // 휴무일이면 영업중 아님
  if (todayHours.isClosed) {
    const nextOpenTime = findNextOpenTime(operatingHours, kstNow, currentDayOfWeek);
    return {
      isOpen: false,
      nextOpenTime,
      closingTime: null,
      currentDayHours: todayHours,
      currentTime: kstNow,
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
      currentTime: kstNow,
      currentDayOfWeek,
    };
  }

  // 시간 범위 확인
  const openMinutes = timeToMinutes(todayHours.openTime);
  const closeMinutes = timeToMinutes(todayHours.closeTime);

  let isOpen = false;
  let closingTime: Date | null = null;

  // 자정을 넘어가는 경우 (예: 22:00-02:00)
  if (closeMinutes < openMinutes) {
    // 현재 시간이 오픈 시간 이후이거나 마감 시간 이전이면 영업중
    isOpen = currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    
    if (isOpen) {
      // 마감 시간은 다음날로 계산
      closingTime = createKSTDate(kstNow, todayHours.closeTime, 1); // 다음날
    }
  } else {
    // 일반적인 경우 (예: 09:00-22:00)
    isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    
    if (isOpen) {
      // 마감 시간은 오늘로 계산
      closingTime = createKSTDate(kstNow, todayHours.closeTime, 0); // 오늘
    }
  }

  if (isOpen) {
    return {
      isOpen: true,
      nextOpenTime: null,
      closingTime,
      currentDayHours: todayHours,
      currentTime: kstNow,
      currentDayOfWeek,
    };
  }

  // 영업중이 아니면 다음 영업 시작 시간 찾기
  const nextOpenTime = findNextOpenTime(operatingHours, kstNow, currentDayOfWeek);

  return {
    isOpen: false,
    nextOpenTime,
    closingTime: null,
    currentDayHours: todayHours,
    currentTime: kstNow,
    currentDayOfWeek,
  };
}

/**
 * 다음 영업 시작 시간 찾기
 * 
 * 날짜 이동 로직은 명확하게 분리
 * 
 * @param operatingHours 운영시간 배열
 * @param currentTime 현재 시간 (KST)
 * @param currentDayOfWeek 현재 요일
 * @returns 다음 영업 시작 시간 정보 또는 null
 */
function findNextOpenTime(
  operatingHours: OperatingHours[],
  currentTime: Date,
  currentDayOfWeek: DayOfWeek
): Date | null {
  // 오늘부터 7일 내에서 다음 영업 시작 시간 찾기
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDay = (currentDayOfWeek + dayOffset) % 7 as DayOfWeek;
    const targetHours = operatingHours.find((h) => h.dayOfWeek === targetDay);

    if (!targetHours || targetHours.isClosed || !targetHours.openTime) {
      continue;
    }

    const targetDate = createKSTDate(currentTime, targetHours.openTime, dayOffset);

    // 오늘이고 현재 시간보다 이전이면 다음 날로
    if (dayOffset === 0 && targetDate <= currentTime) {
      continue;
    }

    return targetDate;
  }

  return null;
}

/**
 * 한국 시간대(KST) 기준 Date 객체 생성
 * 
 * @param baseDate 기준 날짜
 * @param timeString 시간 문자열 (HH:mm)
 * @param dayOffset 날짜 오프셋 (0: 오늘, 1: 내일, ...)
 * @returns KST 기준 Date 객체
 */
function createKSTDate(baseDate: Date, timeString: string, dayOffset: number): Date {
  const kstDate = new Date(baseDate);
  kstDate.setDate(kstDate.getDate() + dayOffset);
  kstDate.setHours(0, 0, 0, 0);

  const [hours, minutes] = timeString.split(':').map(Number);
  kstDate.setHours(hours, minutes, 0, 0);

  return kstDate;
}

/**
 * Date 객체를 한국 시간대(KST) 기준으로 변환
 * 
 * @param date 변환할 Date 객체
 * @returns KST 기준 Date 객체
 */
function getKSTDate(date: Date): Date {
  // 한국 시간대(KST) 기준으로 변환
  const kstString = date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
  return new Date(kstString);
}

/**
 * 현재 시간 기준 영업중 여부 판단 (간편 함수)
 * 
 * @param operatingHours 운영시간 배열
 * @param currentTime 기준 시간 (기본값: 현재 시간)
 * @returns 영업중 여부
 */
export function isGymOpen(
  operatingHours: OperatingHours[],
  currentTime: Date = new Date()
): boolean {
  const status = getBusinessStatus(operatingHours, currentTime);
  return status.isOpen;
}
