/**
 * @file cache-invalidation.ts
 * @description 캐시 무효화 유틸리티
 * 
 * Next.js 15의 `revalidateTag` API를 사용하여 장소 검색 캐시를 무효화합니다.
 * 필요 시 특정 위치의 캐시만 선택적으로 무효화할 수 있습니다.
 */

import { revalidateTag } from 'next/cache';
import { generateLocationCacheTag } from './cache-key';

/**
 * 모든 장소 검색 캐시 무효화
 * 
 * 'place-search' 태그를 가진 모든 캐시를 무효화합니다.
 * 
 * 사용 시나리오:
 * - 네이버 API 응답 형식 변경 시
 * - 전체 데이터 갱신이 필요한 경우
 * 
 * @example
 * // Server Action 또는 API Route에서 사용
 * 'use server';
 * 
 * export async function refreshAllPlaceSearchCache() {
 *   invalidatePlaceSearchCache();
 *   return { success: true };
 * }
 */
export function invalidatePlaceSearchCache(): void {
  revalidateTag('place-search', {});
}

/**
 * 특정 위치의 장소 검색 캐시 무효화
 * 
 * 특정 좌표를 기반으로 한 캐시만 무효화합니다.
 * 
 * 사용 시나리오:
 * - 특정 지역의 헬스장 정보가 업데이트된 경우
 * - 사용자가 특정 위치의 캐시를 수동으로 갱신하고 싶은 경우
 * 
 * @param centerLat 중심 좌표 위도
 * @param centerLng 중심 좌표 경도
 * 
 * @example
 * // Server Action 또는 API Route에서 사용
 * 'use server';
 * 
 * export async function refreshLocationCache(lat: number, lng: number) {
 *   invalidatePlaceSearchCacheByLocation(lat, lng);
 *   return { success: true };
 * }
 */
export function invalidatePlaceSearchCacheByLocation(
  centerLat: number,
  centerLng: number
): void {
  const locationTag = generateLocationCacheTag(centerLat, centerLng);
  revalidateTag(locationTag, {});
  
  // 전체 태그도 함께 무효화 (안전을 위해)
  // Note: 특정 위치 태그만 무효화하면 충분하지만,
  // 전체 태그도 무효화하면 더 확실합니다.
  revalidateTag('place-search', {});
}

/**
 * 여러 위치의 장소 검색 캐시 무효화
 * 
 * 여러 좌표를 한 번에 무효화합니다.
 * 
 * @param locations 좌표 배열
 * 
 * @example
 * const locations = [
 *   { lat: 37.5665, lng: 126.9780 },
 *   { lat: 37.5651, lng: 126.9895 },
 * ];
 * invalidatePlaceSearchCacheByLocations(locations);
 */
export function invalidatePlaceSearchCacheByLocations(
  locations: Array<{ lat: number; lng: number }>
): void {
  for (const location of locations) {
    invalidatePlaceSearchCacheByLocation(location.lat, location.lng);
  }
}

