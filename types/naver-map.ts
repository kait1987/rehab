/**
 * 네이버맵 API 관련 타입 정의
 * 
 * 네이버 지역 검색 API 및 네이버 지도 API v3를 사용하기 위한 타입들을 정의합니다.
 * 
 * 참고:
 * - 네이버 지역 검색 API: https://developers.naver.com/docs/serviceapi/search/local/local.md
 * - 네이버 지도 API v3: https://navermaps.github.io/maps.js.ncp/
 */

import type { OperatingHours } from '@/types/operating-hours';

/**
 * 장소 검색 옵션
 */
export interface PlaceSearchOptions {
  /** 중심 좌표 (위도, 경도) */
  coordinate?: {
    lat: number;
    lng: number;
  };
  /** 검색 반경 (미터 단위, 기본값: 1000m = 1km) */
  radius?: number;
  /** 카테고리 필터 */
  category?: string;
  /** 검색 결과 시작 위치 (페이지네이션) */
  start?: number;
  /** 검색 결과 개수 (최대 5개) */
  display?: number;
  /** 정렬 방식 ('random' | 'comment') */
  sort?: 'random' | 'comment';
}

/**
 * 네이버 지역 검색 API 응답 - 개별 장소 정보
 */
export interface PlaceItem {
  /** 장소명 */
  title: string;
  /** 지번 주소 */
  address: string;
  /** 도로명 주소 */
  roadAddress?: string;
  /** 카테고리 */
  category?: string;
  /** 카테고리 상세 */
  category2?: string;
  /** 카테고리 상세2 */
  category3?: string;
  /** 카테고리 상세3 */
  category4?: string;
  /** 전화번호 */
  telephone?: string;
  /** 설명 */
  description?: string;
  /** 링크 */
  link?: string;
  /** X 좌표 (네이버 좌표계) */
  mapx: number;
  /** Y 좌표 (네이버 좌표계) */
  mapy: number;
  /** 위도 (WGS84, 변환된 좌표) */
  lat?: number;
  /** 경도 (WGS84, 변환된 좌표) */
  lng?: number;
  /** 거리 (미터 단위, 중심 좌표가 있을 때만 제공) */
  distance?: string;
  /** 운영시간 정보 (파싱된 정보, 네이버 API 응답에는 없음) */
  operatingHours?: OperatingHours[];
}

/**
 * 네이버 지역 검색 API 응답
 */
export interface PlaceSearchResult {
  /** 검색 결과 목록 */
  items: PlaceItem[];
  /** 전체 검색 결과 수 */
  total: number;
  /** 검색 결과 시작 위치 */
  start: number;
  /** 검색 결과 개수 */
  display: number;
  /** 마지막 빌드 날짜 */
  lastBuildDate?: string;
}

/**
 * 네이버 지역 검색 API 에러 응답
 */
export interface PlaceSearchError {
  /** 에러 코드 */
  errorCode: string;
  /** 에러 메시지 */
  errorMessage: string;
}

/**
 * API 호출 통계
 */
export interface UsageStats {
  /** 통계 기간 */
  period: 'day' | 'week';
  /** 총 호출 횟수 */
  totalCalls: number;
  /** API 한도 */
  limit: number;
  /** 사용률 (퍼센트) */
  usagePercent: number;
  /** 경고 여부 (70% 이상) */
  isWarning: boolean;
  /** 위험 여부 (80% 이상) */
  isDanger: boolean;
}

/**
 * API 호출 기록
 */
export interface ApiCallRecord {
  /** API 타입 (예: 'place-search', 'geocoding') */
  apiType: string;
  /** 호출 시간 */
  timestamp: Date;
  /** 성공 여부 */
  success: boolean;
  /** 응답 시간 (밀리초) */
  responseTime?: number;
}

/**
 * 좌표 변환 옵션 (네이버 좌표계 ↔ WGS84)
 */
export interface CoordinateConversionOptions {
  /** 네이버 좌표계 X (mapx) */
  mapx: number;
  /** 네이버 좌표계 Y (mapy) */
  mapy: number;
}

/**
 * WGS84 좌표 (위도, 경도)
 */
export interface WGS84Coordinate {
  /** 위도 */
  lat: number;
  /** 경도 */
  lng: number;
}

/**
 * 네이버 지도 API v3 설정 옵션
 */
export interface NaverMapConfig {
  /** 클라이언트 ID */
  clientId: string;
  /** 지도 중심 좌표 */
  center?: WGS84Coordinate;
  /** 지도 줌 레벨 */
  zoom?: number;
  /** 지도 타입 */
  mapTypeId?: 'normal' | 'satellite' | 'hybrid' | 'terrain';
}

