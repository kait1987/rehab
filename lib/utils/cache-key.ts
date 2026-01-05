/**
 * @file cache-key.ts
 * @description 캐시 키 생성 유틸리티
 * 
 * 위치 기반 캐시 키를 생성하는 유틸리티 함수들을 제공합니다.
 * 좌표를 그리드 기반으로 반올림하여 캐시 효율성을 높입니다.
 */

/**
 * 좌표를 소수점 4자리로 반올림
 * 
 * 약 11m 정밀도로 그리드 기반 캐싱을 수행합니다.
 * 비슷한 위치의 검색 요청이 같은 캐시를 공유할 수 있도록 합니다.
 * 
 * @param coord 좌표 값
 * @returns 반올림된 좌표 값
 * 
 * @example
 * roundCoordinate(37.5665123) // 37.5665
 * roundCoordinate(126.9780123) // 126.9780
 */
function roundCoordinate(coord: number): number {
  return Math.round(coord * 10000) / 10000;
}

/**
 * 장소 검색 캐시 키 생성
 * 
 * 위치(좌표)와 검색 파라미터를 기반으로 고유한 캐시 키를 생성합니다.
 * 
 * 캐시 키 형식:
 * `place-search:{lat}:{lng}:{query}:{category?}:{sortBy?}`
 * 
 * @param centerLat 중심 좌표 위도
 * @param centerLng 중심 좌표 경도
 * @param query 검색어
 * @param options 검색 옵션 (선택사항)
 * @returns 캐시 키 문자열
 * 
 * @example
 * generatePlaceSearchCacheKey(37.5665, 126.9780, '헬스장')
 * // 'place-search:37.5665:126.9780:헬스장'
 * 
 * @example
 * generatePlaceSearchCacheKey(37.5665, 126.9780, '헬스장', {
 *   category: 'gym',
 *   sortBy: 'distance'
 * })
 * // 'place-search:37.5665:126.9780:헬스장:category:gym:sortBy:distance'
 */
export function generatePlaceSearchCacheKey(
  centerLat: number,
  centerLng: number,
  query: string,
  options?: {
    category?: string;
    sortBy?: 'distance' | 'name';
    maxResults?: number;
  }
): string {
  // 좌표를 소수점 4자리로 반올림 (약 11m 정밀도)
  const roundedLat = roundCoordinate(centerLat);
  const roundedLng = roundCoordinate(centerLng);
  
  // 기본 캐시 키 구성
  const keyParts = [
    'place-search',
    roundedLat.toString(),
    roundedLng.toString(),
    query,
  ];
  
  // 검색 옵션 추가
  if (options?.category) {
    keyParts.push('category', options.category);
  }
  
  if (options?.sortBy) {
    keyParts.push('sortBy', options.sortBy);
  }
  
  if (options?.maxResults) {
    keyParts.push('maxResults', options.maxResults.toString());
  }
  
  return keyParts.join(':');
}

/**
 * 위치 기반 캐시 태그 생성
 * 
 * 특정 위치의 캐시를 무효화하기 위한 태그를 생성합니다.
 * 
 * @param centerLat 중심 좌표 위도
 * @param centerLng 중심 좌표 경도
 * @returns 캐시 태그 문자열
 * 
 * @example
 * generateLocationCacheTag(37.5665, 126.9780)
 * // 'place-search:37.5665:126.9780'
 */
export function generateLocationCacheTag(
  centerLat: number,
  centerLng: number
): string {
  const roundedLat = roundCoordinate(centerLat);
  const roundedLng = roundCoordinate(centerLng);
  
  return `place-search:${roundedLat}:${roundedLng}`;
}

