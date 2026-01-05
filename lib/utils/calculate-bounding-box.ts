/**
 * @file calculate-bounding-box.ts
 * @description 좌표 범위 계산 유틸리티
 * 
 * 반경에 따른 좌표 범위(bounding box)를 계산하여 DB 쿼리 최적화에 사용합니다.
 * 위도/경도 델타를 계산하여 Prisma where 절에 gte/lte 조건을 적용할 수 있습니다.
 * 
 * 참고:
 * - 위도 1도 ≈ 111km
 * - 경도 1도는 위도에 따라 다름 (한국 위도 37도 기준 ≈ 88.6km)
 * - 반경을 위도/경도 델타로 변환하여 DB 스캔 범위를 크게 줄일 수 있음
 */

/**
 * 좌표 범위 (Bounding Box)
 */
export interface BoundingBox {
  /** 최소 위도 */
  minLat: number;
  /** 최대 위도 */
  maxLat: number;
  /** 최소 경도 */
  minLng: number;
  /** 최대 경도 */
  maxLng: number;
}

/**
 * 반경에 따른 좌표 범위 계산
 * 
 * 중심 좌표와 반경을 기반으로 위도/경도 범위를 계산합니다.
 * 안전 마진을 고려하여 약 10% 여유를 추가합니다.
 * 
 * @param centerLat 중심 좌표 위도
 * @param centerLng 중심 좌표 경도
 * @param radiusMeters 반경 (미터)
 * @param marginPercent 안전 마진 (퍼센트, 기본값: 10)
 * @returns 좌표 범위 (Bounding Box)
 * 
 * @example
 * // 서울시청 기준 1km 반경
 * const bbox = calculateBoundingBox(37.5665, 126.9780, 1000);
 * // { minLat: 37.5575, maxLat: 37.5755, minLng: 126.9670, maxLng: 126.9890 }
 */
export function calculateBoundingBox(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  marginPercent: number = 10
): BoundingBox {
  // 위도 1도 ≈ 111km = 111,000m
  const METERS_PER_DEGREE_LAT = 111000;
  
  // 경도 1도는 위도에 따라 다름 (한국 위도 37도 기준)
  // 경도 1도 ≈ 111km × cos(위도)
  const METERS_PER_DEGREE_LNG = 111000 * Math.cos((centerLat * Math.PI) / 180);
  
  // 반경을 위도/경도 델타로 변환
  const deltaLat = radiusMeters / METERS_PER_DEGREE_LAT;
  const deltaLng = radiusMeters / METERS_PER_DEGREE_LNG;
  
  // 안전 마진 적용 (기본 10% 여유)
  const marginMultiplier = 1 + marginPercent / 100;
  const marginDeltaLat = deltaLat * marginMultiplier;
  const marginDeltaLng = deltaLng * marginMultiplier;
  
  return {
    minLat: centerLat - marginDeltaLat,
    maxLat: centerLat + marginDeltaLat,
    minLng: centerLng - marginDeltaLng,
    maxLng: centerLng + marginDeltaLng,
  };
}

/**
 * 좌표 범위가 유효한지 확인
 * 
 * @param bbox 좌표 범위
 * @returns 유효성 여부
 */
export function isValidBoundingBox(bbox: BoundingBox): boolean {
  return (
    bbox.minLat < bbox.maxLat &&
    bbox.minLng < bbox.maxLng &&
    bbox.minLat >= -90 &&
    bbox.maxLat <= 90 &&
    bbox.minLng >= -180 &&
    bbox.maxLng <= 180
  );
}

