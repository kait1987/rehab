/**
 * @file convert-place-to-gym.ts
 * @description PlaceItem을 Gym 데이터 구조로 변환하는 유틸리티
 * 
 * 네이버 API에서 가져온 PlaceItem을 우리 DB의 Gym, GymFacility, GymOperatingHour 구조로 변환합니다.
 * 
 * 주요 기능:
 * - PlaceItem → Gym upsert 데이터 변환
 * - PlaceItem → GymFacility upsert 데이터 변환
 * - PlaceItem → GymOperatingHour 배열 변환
 * - 운영시간 파싱 통합
 */

import type { PlaceItem } from '@/types/naver-map';
import type { OperatingHours } from '@/types/operating-hours';
import { parseOperatingHoursFromDescription } from './parse-operating-hours';
import { Prisma } from '@prisma/client';

/**
 * Gym upsert 데이터 타입
 */
export type GymUpsertData = {
  name: string;
  address: string;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  phone?: string;
  website?: string;
  priceRange?: string;
  description?: string;
  isActive: boolean;
};

/**
 * GymFacility upsert 데이터 타입
 */
export type GymFacilityUpsertData = {
  isQuiet: boolean;
  hasRehabEquipment: boolean;
  hasPtCoach: boolean;
  hasShower: boolean;
  hasParking: boolean;
  hasLocker: boolean;
  hasWaterDispenser: boolean;
  hasAirConditioning: boolean;
  otherFacilities: string[];
};

/**
 * GymOperatingHour upsert 데이터 타입
 */
export type GymOperatingHourUpsertData = {
  dayOfWeek: number;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
  notes?: string;
};

/**
 * PlaceItem을 Gym upsert 데이터로 변환
 * 
 * @param placeItem 네이버 API PlaceItem
 * @returns Gym upsert 데이터
 */
export function convertPlaceItemToGymData(placeItem: PlaceItem): GymUpsertData {
  // 좌표 확인 (lat, lng가 없으면 에러)
  if (placeItem.lat === undefined || placeItem.lng === undefined) {
    throw new Error(`PlaceItem에 좌표 정보가 없습니다: ${placeItem.title}`);
  }

  return {
    name: placeItem.title,
    address: placeItem.address,
    latitude: new Prisma.Decimal(placeItem.lat),
    longitude: new Prisma.Decimal(placeItem.lng),
    phone: placeItem.telephone || undefined,
    website: placeItem.link || undefined,
    priceRange: undefined, // 네이버 API에서 가격 정보는 제공하지 않음
    description: placeItem.description || undefined,
    isActive: true,
  };
}

/**
 * PlaceItem을 GymFacility upsert 데이터로 변환
 * 
 * 네이버 API에서는 시설 정보를 제공하지 않으므로 기본값으로 생성합니다.
 * 나중에 관리자가 직접 입력하거나 사용자 리뷰를 통해 업데이트할 수 있습니다.
 * 
 * @param placeItem 네이버 API PlaceItem
 * @returns GymFacility upsert 데이터 (기본값)
 */
export function convertPlaceItemToGymFacilityData(
  placeItem: PlaceItem
): GymFacilityUpsertData {
  // 네이버 API에서는 시설 정보를 제공하지 않으므로 모두 기본값(false)
  // description에서 일부 키워드를 추출할 수 있지만, 정확도가 낮으므로 기본값 사용
  return {
    isQuiet: false,
    hasRehabEquipment: false,
    hasPtCoach: false,
    hasShower: false,
    hasParking: false,
    hasLocker: false,
    hasWaterDispenser: false,
    hasAirConditioning: false,
    otherFacilities: [],
  };
}

/**
 * PlaceItem을 GymOperatingHour 배열로 변환
 * 
 * description 필드에서 운영시간을 파싱하여 변환합니다.
 * 
 * @param placeItem 네이버 API PlaceItem
 * @returns GymOperatingHour upsert 데이터 배열
 */
export function convertPlaceItemToOperatingHours(
  placeItem: PlaceItem
): GymOperatingHourUpsertData[] {
  // 이미 파싱된 operatingHours가 있으면 사용
  if (placeItem.operatingHours && placeItem.operatingHours.length > 0) {
    return placeItem.operatingHours.map((oh: OperatingHours) => ({
      dayOfWeek: oh.dayOfWeek,
      openTime: oh.openTime ?? undefined,
      closeTime: oh.closeTime ?? undefined,
      isClosed: oh.isClosed,
      notes: oh.notes ?? undefined,
    }));
  }

  // description에서 파싱 시도
  if (placeItem.description) {
    const parsedHours = parseOperatingHoursFromDescription(placeItem.description);
    return parsedHours.map((oh: OperatingHours) => ({
      dayOfWeek: oh.dayOfWeek,
      openTime: oh.openTime ?? undefined,
      closeTime: oh.closeTime ?? undefined,
      isClosed: oh.isClosed,
      notes: oh.notes ?? undefined,
    }));
  }

  // 파싱 실패 시 빈 배열 반환 (기본값은 나중에 설정)
  return [];
}

/**
 * PlaceItem을 Gym 관련 모든 데이터로 변환
 * 
 * @param placeItem 네이버 API PlaceItem
 * @returns Gym, GymFacility, GymOperatingHour 데이터
 */
export function convertPlaceItemToGymAllData(placeItem: PlaceItem): {
  gym: GymUpsertData;
  facility: GymFacilityUpsertData;
  operatingHours: GymOperatingHourUpsertData[];
} {
  return {
    gym: convertPlaceItemToGymData(placeItem),
    facility: convertPlaceItemToGymFacilityData(placeItem),
    operatingHours: convertPlaceItemToOperatingHours(placeItem),
  };
}

