/**
 * @file naver-map-search.ts
 * @description 네이버맵 검색 관련 상수
 * 
 * 네이버 지역 검색 API 사용 시 필요한 상수들을 정의합니다.
 */

/**
 * 기본 검색 파라미터
 * 
 * 네이버 지역 검색 API의 기본값 및 제한사항:
 * - display: 최댓값 5개
 * - start: 최댓값 1 (페이지네이션 제한)
 * - sort: 'random' 또는 'comment'
 */
export const DEFAULT_SEARCH_PARAMS = {
  display: 5, // 네이버 API 최댓값
  start: 1,
  sort: 'random' as const,
} as const;

/**
 * 반경 1km (미터 단위)
 * 
 * PRD.md 요구사항: 반경 1km 내 헬스장/피트니스 시설 검색
 */
export const SEARCH_RADIUS_1KM = 1000;

/**
 * 헬스장 관련 카테고리 (네이버 지역 검색 카테고리 코드)
 * 
 * 실제 코드는 네이버 지역 검색 API 문서 기준으로 채운다.
 * 
 * 참고:
 * - 네이버 지역 검색 API는 카테고리 필터를 지원
 * - 카테고리 코드는 네이버 개발자 센터 문서에서 확인 필요
 * - 예시: "헬스장", "피트니스센터", "운동시설" 등
 * 
 * TODO: 네이버 지역 검색 API 문서에서 정확한 카테고리 코드 확인 후 업데이트
 */
export const GYM_CATEGORIES = {
  // 예시 (실제 코드는 네이버 API 문서 확인 필요):
  // GYM: '헬스장',
  // FITNESS: '피트니스센터',
  // SPORTS_FACILITY: '운동시설',
} as const;

/**
 * 검색 키워드 (헬스장 관련)
 * 
 * 네이버 지역 검색 API의 query 파라미터에 사용할 키워드 목록
 */
export const GYM_SEARCH_KEYWORDS = [
  '헬스장',
  '피트니스',
  '운동시설',
  '헬스클럽',
  '피트니스센터',
] as const;

