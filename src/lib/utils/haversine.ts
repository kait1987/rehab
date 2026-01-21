/**
 * @file haversine.ts
 * @description Haversine 공식을 사용한 거리 계산 유틸리티
 *
 * 이 파일은 coordinate-converter.ts와 calculate-distance.ts 간의
 * 순환 의존성을 해결하기 위해 공통 함수를 별도로 분리한 것입니다.
 *
 * 참고:
 * - Haversine 공식은 구면 삼각법을 사용하여 지구 표면의 두 점 간 거리를 계산
 * - 지구를 완전한 구로 가정하므로 약간의 오차가 있을 수 있음 (일반적으로 0.5% 이내)
 */

/**
 * Haversine 공식을 사용한 두 좌표 간 거리 계산 (미터 단위)
 *
 * @param lat1 첫 번째 좌표의 위도
 * @param lng1 첫 번째 좌표의 경도
 * @param lat2 두 번째 좌표의 위도
 * @param lng2 두 번째 좌표의 경도
 * @returns 거리 (미터)
 *
 * @example
 * // 서울시청과 강남역 간 거리
 * const distance = haversineDistance(37.5665, 126.9780, 37.4980, 127.0276);
 * console.log(distance); // 약 8500m
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // 지구 반경 (미터)

  // 위도, 경도를 라디안으로 변환
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}
