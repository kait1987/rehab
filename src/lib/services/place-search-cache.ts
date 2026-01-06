/**
 * @file place-search-cache.ts
 * @description 장소 검색 캐시 래퍼
 * 
 * Next.js 15의 `unstable_cache`를 사용하여 장소 검색 결과를 24시간 TTL로 캐싱합니다.
 * 네이버 API 호출을 최소화하여 API 한도를 절약합니다.
 */

import { unstable_cache } from 'next/cache';
import { generatePlaceSearchCacheKey, generateLocationCacheTag } from '@/lib/utils/cache-key';
import type { PlaceItem } from '@/types/naver-map';

/**
 * 캐시된 장소 검색 결과 타입
 */
export type CachedPlaceSearchResult = Array<PlaceItem & { distanceMeters: number }>;

/**
 * 장소 검색 함수 타입
 */
type PlaceSearchFunction = (
  query: string,
  centerLat: number,
  centerLng: number,
  options?: {
    category?: string;
    maxResults?: number;
    sortBy?: 'distance' | 'name';
  }
) => Promise<CachedPlaceSearchResult>;

/**
 * 캐시된 장소 검색 함수 생성
 * 
 * `unstable_cache`를 사용하여 검색 결과를 24시간 동안 캐싱합니다.
 * 
 * @param searchFunction 실제 검색을 수행하는 함수 (PlaceSearchService의 메서드)
 * @param centerLat 중심 좌표 위도
 * @param centerLng 중심 좌표 경도
 * @param query 검색어
 * @param options 검색 옵션
 * @returns 캐시된 검색 결과
 * 
 * @example
 * const cachedSearch = getCachedPlaceSearch(
 *   (q, lat, lng, opts) => service.searchGymsNearby(q, lat, lng, opts),
 *   37.5665,
 *   126.9780,
 *   '헬스장',
 *   { sortBy: 'distance' }
 * );
 * const results = await cachedSearch();
 */
export function getCachedPlaceSearch(
  searchFunction: PlaceSearchFunction,
  centerLat: number,
  centerLng: number,
  query: string,
  options?: {
    category?: string;
    maxResults?: number;
    sortBy?: 'distance' | 'name';
  }
): () => Promise<CachedPlaceSearchResult> {
  // 캐시 키 생성
  const cacheKey = generatePlaceSearchCacheKey(centerLat, centerLng, query, options);
  
  // 위치 기반 캐시 태그 생성
  const locationTag = generateLocationCacheTag(centerLat, centerLng);
  
  // 캐시 태그 목록
  const tags = ['place-search', locationTag];
  
  // 캐시된 함수 생성
  // unstable_cache는 함수를 래핑하므로, 클로저를 사용하여 파라미터를 전달
  const cachedFunction = unstable_cache(
    async () => {
      // 실제 검색 함수 호출
      return await searchFunction(query, centerLat, centerLng, options);
    },
    // 캐시 키 (keys 배열)
    [cacheKey],
    // 캐시 옵션
    {
      tags,
      revalidate: 86400, // 24시간 = 86400초
    }
  );
  
  return cachedFunction;
}

/**
 * 캐시 히트/미스 로깅 (개발 환경에서만)
 * 
 * @param cacheKey 캐시 키
 * @param isHit 캐시 히트 여부
 */
export function logCacheHit(cacheKey: string, isHit: boolean): void {
  if (process.env.NODE_ENV === 'development') {
    const status = isHit ? 'HIT' : 'MISS';
    console.log(`[PlaceSearchCache] ${status}: ${cacheKey}`);
  }
}

