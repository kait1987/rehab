/**
 * @file place-item.schema.ts
 * @description PlaceItem 검증 스키마
 * 
 * 네이버 지역 검색 API 응답의 PlaceItem 데이터를 검증하기 위한 Zod 스키마를 정의합니다.
 */

import { z } from 'zod';

/**
 * PlaceItem 검증 스키마
 * 
 * 네이버 지역 검색 API 응답의 개별 장소 정보를 검증합니다.
 */
export const placeItemSchema = z.object({
  /** 장소명 (필수) */
  title: z
    .string()
    .min(1, '장소명은 필수입니다.')
    .max(200, '장소명은 200자 이하여야 합니다.'),

  /** 지번 주소 (필수) */
  address: z
    .string()
    .min(1, '주소는 필수입니다.')
    .max(500, '주소는 500자 이하여야 합니다.'),

  /** 도로명 주소 (선택) */
  roadAddress: z
    .string()
    .max(500, '도로명 주소는 500자 이하여야 합니다.')
    .optional(),

  /** 카테고리 (선택) */
  category: z.string().optional(),

  /** 카테고리 상세 (선택) */
  category2: z.string().optional(),

  /** 카테고리 상세2 (선택) */
  category3: z.string().optional(),

  /** 카테고리 상세3 (선택) */
  category4: z.string().optional(),

  /** 전화번호 (선택) */
  telephone: z
    .string()
    .max(50, '전화번호는 50자 이하여야 합니다.')
    .optional(),

  /** 설명 (선택) */
  description: z
    .string()
    .max(1000, '설명은 1000자 이하여야 합니다.')
    .optional(),

  /** 링크 (선택) */
  link: z
    .string()
    .url('유효한 URL 형식이어야 합니다.')
    .optional()
    .or(z.literal('')), // 빈 문자열도 허용

  /** X 좌표 (네이버 좌표계, 필수) */
  mapx: z
    .number()
    .int('mapx는 정수여야 합니다.')
    .positive('mapx는 양수여야 합니다.'),

  /** Y 좌표 (네이버 좌표계, 필수) */
  mapy: z
    .number()
    .int('mapy는 정수여야 합니다.')
    .positive('mapy는 양수여야 합니다.'),

  /** 위도 (WGS84, 변환된 좌표, 선택) */
  lat: z
    .number()
    .min(33.0, '위도는 33.0 이상이어야 합니다. (한국 영역)')
    .max(38.6, '위도는 38.6 이하여야 합니다. (한국 영역)')
    .optional(),

  /** 경도 (WGS84, 변환된 좌표, 선택) */
  lng: z
    .number()
    .min(124.5, '경도는 124.5 이상이어야 합니다. (한국 영역)')
    .max(132.0, '경도는 132.0 이하여야 합니다. (한국 영역)')
    .optional(),

  /** 거리 (미터 단위, 선택) */
  distance: z.string().optional(),
});

/**
 * PlaceItem 타입 (Zod 스키마에서 추론)
 */
export type PlaceItemSchema = z.infer<typeof placeItemSchema>;

