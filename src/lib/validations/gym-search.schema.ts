/**
 * @file gym-search.schema.ts
 * @description 헬스장 검색 요청 검증 스키마
 * 
 * Zod를 사용하여 헬스장 검색 API 요청 파라미터를 검증합니다.
 */

import { z } from 'zod';

/**
 * 가격대 스키마
 */
export const priceRangeSchema = z.enum(['low', 'medium', 'high', 'premium'], {
  message: '가격대는 "low", "medium", "high", "premium" 중 하나여야 합니다.',
});

/**
 * 헬스장 검색 필터 스키마
 */
export const gymSearchFilterSchema = z.object({
  /** 조용한 분위기 */
  isQuiet: z.boolean().optional(),
  /** 재활 기구 구비 */
  hasRehabEquipment: z.boolean().optional(),
  /** PT/재활 코치 여부 */
  hasPtCoach: z.boolean().optional(),
  /** 샤워실 */
  hasShower: z.boolean().optional(),
  /** 주차 */
  hasParking: z.boolean().optional(),
  /** 락커 */
  hasLocker: z.boolean().optional(),
  /** 가격대 */
  priceRange: priceRangeSchema.optional(),
});

/**
 * 헬스장 검색 요청 스키마
 */
export const gymSearchRequestSchema = z.object({
  /** 중심 좌표 위도 (한국 영역: 33.0 ~ 38.6) */
  lat: z.number().min(33.0, '위도는 33.0 이상이어야 합니다.').max(38.6, '위도는 38.6 이하여야 합니다.'),
  /** 중심 좌표 경도 (한국 영역: 124.5 ~ 132.0) */
  lng: z.number().min(124.5, '경도는 124.5 이상이어야 합니다.').max(132.0, '경도는 132.0 이하여야 합니다.'),
  /** 검색 반경 (미터 단위, 기본값: 1000m = 1km) */
  radius: z.number().min(100, '반경은 최소 100m입니다.').max(5000, '반경은 최대 5km입니다.').default(1000),
  /** 검색어 (Full Text Search용, 선택) */
  query: z.string().min(1, '검색어는 최소 1자 이상이어야 합니다.').max(100, '검색어는 최대 100자까지 입력 가능합니다.').optional(),
  /** 필터 옵션 */
  filters: gymSearchFilterSchema.optional(),
});

/**
 * 헬스장 검색 요청 타입
 */
export type GymSearchRequest = z.infer<typeof gymSearchRequestSchema>;

/**
 * 헬스장 검색 필터 타입
 */
export type GymSearchFilter = z.infer<typeof gymSearchFilterSchema>;

