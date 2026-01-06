/**
 * @file validate-place-item.ts
 * @description PlaceItem 검증 함수
 * 
 * 네이버 지역 검색 API 응답의 PlaceItem 데이터를 검증합니다.
 * Zod 스키마 검증과 비즈니스 로직 검증을 수행합니다.
 */

import { placeItemSchema } from './place-item.schema';
import type { PlaceItem } from '@/types/naver-map';
import type { ValidationResult } from '@/types/body-part-bank';
import { convertNaverToWGS84 } from '@/lib/utils/coordinate-converter';

/**
 * PlaceItem 검증 함수
 * 
 * Zod 스키마 검증과 비즈니스 로직 검증을 수행합니다.
 * 
 * @param item 검증할 PlaceItem
 * @returns 검증 결과
 * 
 * @example
 * const item: PlaceItem = {
 *   title: '헬스장',
 *   address: '서울시 강남구',
 *   mapx: 311277,
 *   mapy: 552097,
 * };
 * const result = await validatePlaceItem(item);
 * if (result.success) {
 *   console.log('검증 성공');
 * } else {
 *   console.error('검증 실패:', result.errors);
 * }
 */
export async function validatePlaceItem(
  item: PlaceItem
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Zod 스키마 검증
  const schemaResult = placeItemSchema.safeParse(item);

  if (!schemaResult.success) {
    schemaResult.error.issues.forEach((err) => {
      const path = err.path.join('.');
      errors.push(`${path}: ${err.message}`);
    });
    return {
      success: false,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  const validated = schemaResult.data;

  // 2. 좌표 검증 (필수)
  // 지도 서비스에서는 좌표가 필수이므로, lat/lng이 없으면 error로 처리
  if (!validated.lat || !validated.lng) {
    errors.push(
      '좌표(lat, lng)가 필수입니다. 지도 서비스에서는 좌표가 없으면 장소를 표시할 수 없습니다.'
    );
  } else {
    // 좌표 일관성 검증 (lat, lng이 있는 경우에만)
    if (validated.mapx && validated.mapy) {
      try {
        const converted = convertNaverToWGS84(validated.mapx, validated.mapy);

        // 변환된 좌표와 제공된 좌표가 일치하는지 확인 (오차 0.001도 이내)
        const latDiff = Math.abs(validated.lat - converted.lat);
        const lngDiff = Math.abs(validated.lng - converted.lng);

        if (latDiff > 0.001 || lngDiff > 0.001) {
          warnings.push(
            `변환된 좌표와 제공된 좌표가 일치하지 않습니다. ` +
            `예상: (${converted.lat}, ${converted.lng}), ` +
            `실제: (${validated.lat}, ${validated.lng})`
          );
        }
      } catch (error) {
        // 좌표 변환 실패는 이미 lat/lng이 없으면 위에서 처리됨
        // 여기서는 변환 자체가 실패한 경우
        warnings.push(
          `좌표 변환 검증 중 오류: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  // 3. 비즈니스 로직 검증

  // title이 HTML 태그를 포함하지 않는지 확인 (정규화 후에는 없어야 함)
  if (validated.title.includes('<') || validated.title.includes('>')) {
    warnings.push('장소명에 HTML 태그가 포함되어 있습니다. 정규화가 필요합니다.');
  }

  // address가 비어있지 않은지 확인 (Zod에서 이미 검증되지만 명시적으로)
  if (!validated.address || validated.address.trim().length === 0) {
    errors.push('주소는 비어있을 수 없습니다.');
  }

  // 4. 비필수 필드 누락 경고 처리
  // category 누락은 warning (데이터는 유지)
  if (!validated.category) {
    warnings.push('카테고리 정보가 없습니다.');
  }

  // roadAddress 누락은 warning (데이터는 유지)
  if (!validated.roadAddress) {
    warnings.push('도로명 주소가 없습니다.');
  }

  // 좌표가 한국 영역 내에 있는지 확인 (lat, lng이 있는 경우)
  if (validated.lat !== undefined && validated.lng !== undefined) {
    if (
      validated.lat < 33.0 ||
      validated.lat > 38.6 ||
      validated.lng < 124.5 ||
      validated.lng > 132.0
    ) {
      warnings.push(
        `좌표가 한국 영역을 벗어났습니다: (${validated.lat}, ${validated.lng})`
      );
    }
  }

  // mapx, mapy가 유효한 범위 내에 있는지 확인
  // 네이버 좌표계의 일반적인 범위 (대략적인 검증)
  if (validated.mapx < 100000 || validated.mapx > 1000000) {
    warnings.push(`mapx 값이 비정상적으로 보입니다: ${validated.mapx}`);
  }

  if (validated.mapy < 100000 || validated.mapy > 1000000) {
    warnings.push(`mapy 값이 비정상적으로 보입니다: ${validated.mapy}`);
  }

  return {
    success: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * PlaceItem 목록 검증 함수
 * 
 * 여러 PlaceItem을 한 번에 검증합니다.
 * 
 * @param items 검증할 PlaceItem 목록
 * @returns 검증 결과 (각 아이템별 결과 포함)
 */
export async function validatePlaceItems(
  items: PlaceItem[]
): Promise<{
  success: boolean;
  results: Array<{
    item: PlaceItem;
    validation: ValidationResult;
  }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    warnings: number;
  };
}> {
  const results = await Promise.all(
    items.map(async (item) => ({
      item,
      validation: await validatePlaceItem(item),
    }))
  );

  const valid = results.filter((r) => r.validation.success).length;
  const invalid = results.filter((r) => !r.validation.success).length;
  const warnings = results.filter(
    (r) => r.validation.warnings && r.validation.warnings.length > 0
  ).length;

  return {
    success: invalid === 0,
    results,
    summary: {
      total: items.length,
      valid,
      invalid,
      warnings,
    },
  };
}

