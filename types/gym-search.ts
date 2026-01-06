/**
 * @file gym-search.ts
 * @description 헬스장 검색 관련 타입 정의
 * 
 * 헬스장 검색 API의 요청/응답 타입을 정의합니다.
 */

import type { OperatingHours } from '@/types/operating-hours';

/**
 * 가격대 타입
 */
export type PriceRange = 'low' | 'medium' | 'high' | 'premium';

/**
 * 헬스장 시설 정보
 * 
 * GymFacility 테이블의 정보를 반영합니다.
 */
export interface GymFacilities {
  isQuiet: boolean;
  hasRehabEquipment: boolean;
  hasPtCoach: boolean;
  hasShower: boolean;
  hasParking: boolean;
  hasLocker: boolean;
  hasWaterDispenser: boolean;
  hasAirConditioning: boolean;
  otherFacilities: string[];
}

/**
 * 헬스장 검색 필터 옵션
 */
export interface GymSearchFilter {
  /** 조용한 분위기 */
  isQuiet?: boolean;
  /** 재활 기구 구비 */
  hasRehabEquipment?: boolean;
  /** PT/재활 코치 여부 */
  hasPtCoach?: boolean;
  /** 샤워실 */
  hasShower?: boolean;
  /** 주차 */
  hasParking?: boolean;
  /** 락커 */
  hasLocker?: boolean;
  /** 가격대 */
  priceRange?: PriceRange;
}

/**
 * 헬스장 검색 요청
 */
export interface GymSearchRequest {
  /** 중심 좌표 위도 */
  lat: number;
  /** 중심 좌표 경도 */
  lng: number;
  /** 검색 반경 (미터, 기본값: 1000m = 1km) */
  radius?: number;
  /** 필터 옵션 */
  filters?: GymSearchFilter;
}

/**
 * 헬스장 검색 결과
 */
export interface GymSearchResult {
  /** 헬스장 ID */
  id: string;
  /** 헬스장 이름 */
  name: string;
  /** 주소 */
  address: string;
  /** 위도 */
  latitude: number;
  /** 경도 */
  longitude: number;
  /** 전화번호 */
  phone?: string;
  /** 웹사이트 */
  website?: string;
  /** 가격대 */
  priceRange?: string;
  /** 설명 */
  description?: string;
  /** 거리 (미터) */
  distanceMeters: number;
  /** 시설 정보 */
  facilities: GymFacilities;
  /** 운영시간 정보 */
  operatingHours?: OperatingHours[];
  /** 활성화 여부 */
  isActive: boolean;
}

/**
 * 헬스장 검색 응답
 */
export interface GymSearchResponse {
  /** 성공 여부 */
  success: boolean;
  /** 검색 결과 데이터 */
  data?: GymSearchResult[];
  /** 에러 메시지 */
  error?: string;
  /** 메타 정보 */
  meta?: {
    /** 전체 결과 개수 */
    total: number;
    /** 검색 반경 (미터) */
    radius: number;
    /** 적용된 필터 */
    filters: GymSearchFilter;
  };
}

