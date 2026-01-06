/**
 * @file place-search.service.ts
 * @description 장소 검색 서비스
 * 
 * 네이버 지역 검색 API를 호출하고,
 * 헬스장/피트니스 시설 후보를 가져온 뒤
 * 반경 필터링 및 정규화를 수행합니다.
 * 
 * 중요:
 * - "재활 친화 헬스장" 여부는 이 서비스에서 바로 판단하지 않고,
 *   우리 DB(gyms, gym_facilities)의 정보(has_rehab_equipment 등)를
 *   활용하는 별도 도메인 서비스에서 필터링합니다.
 * 
 * - PlaceSearchService는 "반경 1km 내 헬스장/피트니스 후보"까지만 책임지고,
 *   "재활 친화 헬스장인지 여부"는 gyms, gym_facilities를 기준으로 판단하는
 *   RehabGymFilterService(가칭)가 담당합니다.
 */

import { getNaverMapClient } from '@/lib/naver-map/client';
import { filterByRadius } from '@/lib/utils/calculate-distance';
import { GYM_SEARCH_KEYWORDS, SEARCH_RADIUS_1KM } from '@/lib/constants/naver-map-search';
import type { PlaceItem } from '@/types/naver-map';
import { getCachedPlaceSearch, logCacheHit } from './place-search-cache';
import { generatePlaceSearchCacheKey } from '@/lib/utils/cache-key';

/**
 * 장소 검색 서비스
 */
export class PlaceSearchService {
  private client = getNaverMapClient();

  /**
   * 반경 1km 내 헬스장/피트니스 시설 후보 검색 (내부 구현)
   * 
   * 실제 검색 로직을 수행하는 내부 메서드입니다.
   * 캐싱 없이 네이버 API를 직접 호출합니다.
   * 
   * @param query 검색어
   * @param centerLat 중심 좌표 위도
   * @param centerLng 중심 좌표 경도
   * @param options 검색 옵션
   * @returns 반경 1km 내 검색 결과 (거리 정보 포함)
   */
  private async _searchGymsNearbyInternal(
    query: string,
    centerLat: number,
    centerLng: number,
    options?: {
      category?: string;
      maxResults?: number;
      sortBy?: 'distance' | 'name';
    }
  ): Promise<Array<PlaceItem & { distanceMeters: number }>> {
    // 네이버 지역 검색 API 호출
    const searchResult = await this.client.searchPlaces(query, {
      display: 5, // 네이버 API 최댓값
      start: 1,
      sort: 'random',
      category: options?.category,
    });

    // 반경 1km 내 장소만 필터링
    const nearbyPlaces = filterByRadius(
      searchResult.items,
      centerLat,
      centerLng,
      SEARCH_RADIUS_1KM
    );

    // 정렬
    if (options?.sortBy === 'name') {
      nearbyPlaces.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    }
    // 기본값은 'distance' (이미 filterByRadius에서 거리순 정렬됨)

    // 최대 결과 개수 제한
    if (options?.maxResults) {
      return nearbyPlaces.slice(0, options.maxResults);
    }

    return nearbyPlaces;
  }

  /**
   * 반경 1km 내 헬스장/피트니스 시설 후보 검색
   * 
   * 네이버 지역 검색 API로 "헬스장", "피트니스", "운동시설" 등의 키워드와
   * 행정구를 조합해 후보를 검색하고, 반경 1km 내 시설만 필터링합니다.
   * 
   * 24시간 TTL 캐싱이 적용되어 네이버 API 호출을 최소화합니다.
   * 
   * @param query 검색어 (예: "헬스장", "피트니스", "운동시설")
   * @param centerLat 중심 좌표 위도
   * @param centerLng 중심 좌표 경도
   * @param options 검색 옵션
   * @returns 반경 1km 내 검색 결과 (거리 정보 포함)
   * 
   * @example
   * const service = new PlaceSearchService();
   * const results = await service.searchGymsNearby(
   *   '헬스장',
   *   37.5665, // 서울시청 위도
   *   126.9780, // 서울시청 경도
   *   { sortBy: 'distance' }
   * );
   */
  async searchGymsNearby(
    query: string,
    centerLat: number,
    centerLng: number,
    options?: {
      category?: string;
      maxResults?: number;
      sortBy?: 'distance' | 'name';
    }
  ): Promise<Array<PlaceItem & { distanceMeters: number }>> {
    try {
      // 캐시된 검색 함수 생성
      const cachedSearch = getCachedPlaceSearch(
        (q, lat, lng, opts) => this._searchGymsNearbyInternal(q, lat, lng, opts),
        centerLat,
        centerLng,
        query,
        options
      );

      // 캐시 키 생성 (로깅용)
      const cacheKey = generatePlaceSearchCacheKey(centerLat, centerLng, query, options);

      // 캐시된 검색 실행
      // Note: unstable_cache는 첫 호출 시 캐시를 확인하고, 없으면 함수를 실행하여 캐시에 저장합니다.
      // 두 번째 호출부터는 캐시된 값을 반환합니다.
      const results = await cachedSearch();

      // 캐시 히트 로깅 (개발 환경에서만)
      // Note: unstable_cache는 캐시 히트/미스를 직접 확인할 수 없으므로,
      // 첫 호출은 항상 MISS로 간주하고, 이후 호출은 HIT로 간주합니다.
      // 실제로는 Next.js 내부에서 관리되므로 정확한 히트율 추적은 어렵습니다.
      logCacheHit(cacheKey, false); // 첫 호출은 항상 MISS로 간주

      return results;
    } catch (error) {
      // 캐시 실패 시에도 네이버 API 호출로 폴백
      console.warn('[PlaceSearchService] 캐시 실패, 직접 API 호출로 폴백:', error);
      return await this._searchGymsNearbyInternal(query, centerLat, centerLng, options);
    }
  }

  /**
   * 여러 키워드로 헬스장 검색 (중복 제거)
   * 
   * 여러 검색 키워드("헬스장", "피트니스" 등)로 검색하고,
   * 중복된 결과를 제거하여 반환합니다.
   * 
   * @param centerLat 중심 좌표 위도
   * @param centerLng 중심 좌표 경도
   * @param options 검색 옵션
   * @returns 반경 1km 내 검색 결과 (중복 제거, 거리 정보 포함)
   */
  async searchGymsNearbyMultipleKeywords(
    centerLat: number,
    centerLng: number,
    options?: {
      category?: string;
      maxResults?: number;
      sortBy?: 'distance' | 'name';
    }
  ): Promise<Array<PlaceItem & { distanceMeters: number }>> {
    const allResults: Array<PlaceItem & { distanceMeters: number }> = [];

    // 여러 키워드로 검색
    for (const keyword of GYM_SEARCH_KEYWORDS) {
      try {
        const results = await this.searchGymsNearby(
          keyword,
          centerLat,
          centerLng,
          options
        );
        allResults.push(...results);
      } catch (error) {
        console.warn(`키워드 "${keyword}" 검색 실패:`, error);
        // 개별 키워드 검색 실패는 무시하고 계속 진행
      }
    }

    // 중복 제거 (title과 address로 판단)
    const uniqueResults = new Map<string, PlaceItem & { distanceMeters: number }>();
    
    for (const result of allResults) {
      const key = `${result.title}|${result.address}`;
      if (!uniqueResults.has(key)) {
        uniqueResults.set(key, result);
      } else {
        // 이미 존재하는 경우 거리가 더 가까운 것으로 교체
        const existing = uniqueResults.get(key)!;
        if (result.distanceMeters < existing.distanceMeters) {
          uniqueResults.set(key, result);
        }
      }
    }

    const finalResults = Array.from(uniqueResults.values());

    // 정렬
    if (options?.sortBy === 'name') {
      finalResults.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    } else {
      finalResults.sort((a, b) => a.distanceMeters - b.distanceMeters);
    }

    // 최대 결과 개수 제한
    if (options?.maxResults) {
      return finalResults.slice(0, options.maxResults);
    }

    return finalResults;
  }
}

/**
 * PlaceSearchService 인스턴스 생성 (싱글톤 패턴)
 */
let serviceInstance: PlaceSearchService | null = null;

/**
 * PlaceSearchService 인스턴스 반환
 * 
 * @returns PlaceSearchService 인스턴스
 */
export function getPlaceSearchService(): PlaceSearchService {
  if (!serviceInstance) {
    serviceInstance = new PlaceSearchService();
  }
  return serviceInstance;
}

