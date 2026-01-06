/**
 * @file place-search.schema.ts
 * @description 장소 검색 요청 검증 스키마
 * 
 * Zod를 사용하여 장소 검색 API 요청 파라미터를 검증합니다.
 */

import { z } from 'zod';

/**
 * 장소 검색 요청 스키마
 * 
 * 네이버 지역 검색 API 요청 파라미터를 검증합니다.
 */
export const placeSearchRequestSchema = z.object({
  /** 검색어 (필수) */
  query: z.string().min(1, '검색어는 필수입니다.').max(100, '검색어는 100자 이하여야 합니다.'),
  
  /** 중심 좌표 (필수) */
  coordinate: z.object({
    /** 위도 (한국 영역: 33.0 ~ 38.6) */
    lat: z.number().min(33.0, '위도는 33.0 이상이어야 합니다.').max(38.6, '위도는 38.6 이하여야 합니다.'),
    /** 경도 (한국 영역: 124.5 ~ 132.0) */
    lng: z.number().min(124.5, '경도는 124.5 이상이어야 합니다.').max(132.0, '경도는 132.0 이하여야 합니다.'),
  }),
  
  /** 검색 반경 (미터 단위, 기본값: 1000m = 1km) */
  radius: z.number().min(100, '반경은 최소 100m입니다.').max(5000, '반경은 최대 5km입니다.').default(1000),
  
  /** 카테고리 필터 (선택) */
  category: z.string().optional(),
  
  /** 검색 결과 개수 (1~5, 기본값: 5) */
  display: z.number().min(1, 'display는 최소 1입니다.').max(5, 'display는 최대 5입니다.').default(5),
  
  /** 검색 시작 위치 (1~1, 기본값: 1) */
  start: z.number().min(1, 'start는 최소 1입니다.').max(1, 'start는 최대 1입니다.').default(1),
  
  /** 정렬 방식 (기본값: 'random') */
  sort: z.enum(['random', 'comment'], {
    message: 'sort는 "random" 또는 "comment"여야 합니다.',
  }).default('random'),
});

/**
 * 장소 검색 요청 타입
 */
export type PlaceSearchRequest = z.infer<typeof placeSearchRequestSchema>;

