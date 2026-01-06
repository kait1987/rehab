/**
 * @file calculate-distance.ts
 * @description 거리 계산 유틸리티
 * 
 * Haversine 공식을 사용한 두 좌표 간 거리 계산 및 반경 필터링 기능을 제공합니다.
 * 
 * 참고:
 * - Haversine 공식은 구면 삼각법을 사용하여 지구 표면의 두 점 간 거리를 계산
 * - 지구를 완전한 구로 가정하므로 약간의 오차가 있을 수 있음 (일반적으로 0.5% 이내)
 */

import type { PlaceItem } from '@/types/naver-map';

/**
 * Haversine 공식을 사용한 두 좌표 간 거리 계산 (미터 단위)
 * 
 * @param lat1 첫 번째 좌표의 위도
 * @param lng1 첫 번째 좌표의 경도
 * @param lat2 두 번째 좌표의 위도
 * @param lng2 두 번째 좌표의 경도
 * @returns 거리 (미터)
 * 
 * @example
 * // 서울시청과 강남역 간 거리
 * const distance = calculateDistance(37.5665, 126.9780, 37.4980, 127.0276);
 * console.log(distance); // 약 8500m
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // 지구 반경 (미터)
  
  // 위도, 경도를 라디안으로 변환
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
}

/**
 * 반경 내 장소 필터링
 * 
 * 주어진 중심 좌표로부터 반경 내에 있는 장소만 필터링하고,
 * 각 장소에 거리 정보를 추가합니다.
 * 
 * @param items 장소 목록
 * @param centerLat 중심 좌표 위도
 * @param centerLng 중심 좌표 경도
 * @param radiusMeters 반경 (미터, 기본값: 1000m = 1km)
 * @returns 반경 내 장소 목록 (거리 정보 포함)
 * 
 * @example
 * const nearbyPlaces = filterByRadius(
 *   placeItems,
 *   37.5665, // 서울시청 위도
 *   126.9780, // 서울시청 경도
 *   1000 // 1km 반경
 * );
 */
export function filterByRadius(
  items: PlaceItem[],
  centerLat: number,
  centerLng: number,
  radiusMeters: number = 1000
): Array<PlaceItem & { distanceMeters: number }> {
  const result: Array<PlaceItem & { distanceMeters: number }> = [];
  
  for (const item of items) {
    // normalizePlaceItem에서 변환된 lat, lng 사용
    // 없으면 mapx, mapy를 변환하여 사용
    let lat: number;
    let lng: number;
    
    if (item.lat !== undefined && item.lng !== undefined) {
      // 이미 변환된 좌표 사용
      lat = item.lat;
      lng = item.lng;
    } else if (item.mapx && item.mapy) {
      // 네이버 좌표를 WGS84로 변환
      const { convertNaverToWGS84 } = require('./coordinate-converter');
      const wgs84 = convertNaverToWGS84(item.mapx, item.mapy);
      lat = wgs84.lat;
      lng = wgs84.lng;
    } else {
      // 좌표 정보가 없으면 스킵
      continue;
    }
    
    const distance = calculateDistance(centerLat, centerLng, lat, lng);
    
    if (distance <= radiusMeters) {
      result.push({
        ...item,
        lat,
        lng,
        distanceMeters: distance,
      });
    }
  }
  
  // 거리순으로 정렬
  result.sort((a, b) => a.distanceMeters - b.distanceMeters);
  
  return result;
}

