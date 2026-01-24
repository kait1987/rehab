/**
 * @file normalize-place-item.ts
 * @description 네이버 API 응답 정규화 유틸리티
 *
 * 네이버 지역 검색 API 응답을 표준 PlaceItem 형식으로 정규화합니다.
 *
 * 주요 기능:
 * - HTML 태그 제거
 * - 좌표 변환 (네이버 좌표계 → WGS84)
 * - 데이터 검증 및 클린업
 * - 에러 처리 및 로깅
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { validatePlaceItem } from "@/lib/validations/validate-place-item";
import type { PlaceItem } from "@/types/naver-map";
import { convertNaverToWGS84 } from "./coordinate-converter";
import { parseOperatingHoursFromDescription } from "./parse-operating-hours";

/**
 * 네이버 API 응답을 표준 PlaceItem 형식으로 정규화
 *
 * @param rawItem 네이버 API 원본 응답 아이템
 * @param options 정규화 옵션
 * @returns 정규화된 PlaceItem
 *
 * @example
 * const rawItem = {
 *   title: '<b>헬스장</b>',
 *   address: '서울시 강남구',
 *   mapx: 311277,
 *   mapy: 552097,
 * };
 * const normalized = normalizePlaceItem(rawItem);
 * // { title: '헬스장', address: '서울시 강남구', mapx: 311277, mapy: 552097, lat: 37.5665, lng: 126.9780 }
 */
export function normalizePlaceItem(
  rawItem: any,
  options?: {
    /** 검증 수행 여부 (기본값: false, 성능 고려) */
    validate?: boolean;
    /** 상세 로그 출력 여부 (기본값: 개발 환경에서만) */
    verbose?: boolean;
    /** 운영시간 파싱 수행 여부 (기본값: true, description이 있을 때만) */
    parseOperatingHours?: boolean;
  },
): PlaceItem {
  const isDevelopment = process.env.NODE_ENV === "development";
  const verbose = options?.verbose ?? isDevelopment;

  // HTML 태그 제거
  const cleanTitle = rawItem.title?.replace(/<[^>]*>/g, "").trim() || "";
  const cleanDescription =
    rawItem.description?.replace(/<[^>]*>/g, "").trim() || undefined;

  // 좌표 변환 (네이버 좌표계 → WGS84)
  const mapx = parseInt(rawItem.mapx || "0", 10);
  const mapy = parseInt(rawItem.mapy || "0", 10);

  let lat: number | undefined;
  let lng: number | undefined;
  let coordinateError: Error | undefined;

  if (mapx > 0 && mapy > 0) {
    try {
      const wgs84 = convertNaverToWGS84(mapx, mapy);
      lat = wgs84.lat;
      lng = wgs84.lng;

      if (verbose) {
        console.log(
          `[normalizePlaceItem] 좌표 변환 성공: ` +
            `(${mapx}, ${mapy}) → (${lat}, ${lng})`,
        );
      }
    } catch (error) {
      coordinateError =
        error instanceof Error ? error : new Error(String(error));

      if (verbose) {
        console.warn(
          `[normalizePlaceItem] 좌표 변환 실패: ` +
            `mapx=${mapx}, mapy=${mapy}, ` +
            `error=${coordinateError.message}`,
        );
      } else {
        console.warn("좌표 변환 실패:", coordinateError.message);
      }
      // 좌표 변환 실패 시에도 기본 정보는 반환
    }
  } else {
    if (verbose) {
      console.warn(
        `[normalizePlaceItem] 유효하지 않은 좌표: ` +
          `mapx=${mapx}, mapy=${mapy}`,
      );
    }
  }

  // 운영시간 파싱 (옵션)
  let operatingHours = undefined;
  const shouldParseOperatingHours = options?.parseOperatingHours ?? true;
  if (shouldParseOperatingHours && cleanDescription) {
    try {
      operatingHours = parseOperatingHoursFromDescription(cleanDescription);
      if (verbose && operatingHours.length > 0) {
        console.log(
          `[normalizePlaceItem] 운영시간 파싱 성공: ${cleanTitle} - ` +
            `${operatingHours.length}개 요일 정보 추출`,
        );
      }
    } catch (error) {
      if (verbose) {
        console.warn(
          `[normalizePlaceItem] 운영시간 파싱 실패: ${cleanTitle} - ` +
            `${error instanceof Error ? error.message : String(error)}`,
        );
      }
      // 파싱 실패 시 undefined 유지 (기본값 사용)
    }
  }

  const normalized: PlaceItem = {
    title: cleanTitle,
    address: rawItem.address || "",
    roadAddress: rawItem.roadAddress || undefined,
    category: rawItem.category || undefined,
    category2: rawItem.category2 || undefined,
    category3: rawItem.category3 || undefined,
    category4: rawItem.category4 || undefined,
    telephone: rawItem.telephone || undefined,
    description: cleanDescription,
    link: rawItem.link || undefined,
    mapx,
    mapy,
    lat,
    lng,
    distance: rawItem.distance || undefined,
    operatingHours,
  };

  // 검증 수행 (옵션)
  if (options?.validate) {
    validatePlaceItem(normalized)
      .then((result) => {
        if (!result.success) {
          if (verbose) {
            console.error(
              `[normalizePlaceItem] 검증 실패 (${cleanTitle}):`,
              result.errors,
            );
          } else {
            console.error(
              `검증 실패 (${cleanTitle}): ${result.errors.join(", ")}`,
            );
          }
        } else if (result.warnings && result.warnings.length > 0) {
          if (verbose) {
            console.warn(
              `[normalizePlaceItem] 검증 경고 (${cleanTitle}):`,
              result.warnings,
            );
          }
        }
      })
      .catch((error) => {
        if (verbose) {
          console.error(
            `[normalizePlaceItem] 검증 중 오류 발생 (${cleanTitle}):`,
            error,
          );
        } else {
          console.error(`검증 오류 (${cleanTitle}):`, error.message);
        }
      });
  }

  return normalized;
}

/**
 * 검색 결과 목록 정규화
 *
 * @param rawItems 네이버 API 원본 응답 아이템 목록
 * @param options 정규화 옵션
 * @returns 정규화된 PlaceItem 목록
 *
 * @example
 * const rawItems = [
 *   { title: '<b>헬스장1</b>', mapx: 311277, mapy: 552097 },
 *   { title: '<b>헬스장2</b>', mapx: 321418, mapy: 540193 },
 * ];
 * const normalized = normalizePlaceItems(rawItems);
 */
export async function normalizePlaceItems(
  rawItems: any[],
  options?: {
    /** 검증 수행 여부 (기본값: false, 성능 고려) */
    validate?: boolean;
    /** 상세 로그 출력 여부 (기본값: 개발 환경에서만) */
    verbose?: boolean;
    /** 검증 실패한 아이템 필터링 여부 (기본값: false) */
    filterInvalid?: boolean;
    /** 좌표 누락 아이템 자동 필터링 (기본값: true, 지도 서비스 특성상 좌표 필수) */
    filterMissingCoordinates?: boolean;
  },
): Promise<PlaceItem[]> {
  if (!Array.isArray(rawItems)) {
    if (options?.verbose ?? process.env.NODE_ENV === "development") {
      console.warn(
        "[normalizePlaceItems] rawItems가 배열이 아닙니다:",
        typeof rawItems,
      );
    }
    return [];
  }

  const isDevelopment = process.env.NODE_ENV === "development";
  const verbose = options?.verbose ?? isDevelopment;
  const validate = options?.validate ?? false;
  const filterInvalid = options?.filterInvalid ?? false;
  const filterMissingCoordinates = options?.filterMissingCoordinates ?? true;

  // 정규화 수행
  let normalized = rawItems.map((item) =>
    normalizePlaceItem(item, { validate, verbose }),
  );

  // 좌표 누락 아이템 필터링 (기본적으로 수행)
  // 지도 서비스에서는 좌표가 없으면 장소를 표시할 수 없으므로 제거
  if (filterMissingCoordinates) {
    const beforeCount = normalized.length;
    normalized = normalized.filter((item) => {
      const hasCoordinates = item.lat !== undefined && item.lng !== undefined;
      if (!hasCoordinates && verbose) {
        console.warn(
          `[normalizePlaceItems] 좌표 누락으로 제거: ${item.title} (${item.address})`,
        );
      }
      return hasCoordinates;
    });

    if (verbose && normalized.length < beforeCount) {
      console.log(
        `[normalizePlaceItems] 좌표 누락으로 ${beforeCount - normalized.length}개 아이템 제거 ` +
          `(남은 아이템: ${normalized.length}개)`,
      );
    }
  }

  // 검증 수행 및 필터링 (옵션)
  if (validate) {
    const { validatePlaceItems } =
      await import("@/lib/validations/validate-place-item");

    // Promise.all을 사용하여 병렬 검증 (네이버 API 응답은 최대 5개이므로 성능 이슈 없음)
    const validationResult = await validatePlaceItems(normalized);

    if (verbose) {
      console.log(
        `[normalizePlaceItems] 검증 결과: ` +
          `전체 ${validationResult.summary.total}개, ` +
          `유효 ${validationResult.summary.valid}개, ` +
          `무효 ${validationResult.summary.invalid}개, ` +
          `경고 ${validationResult.summary.warnings}개`,
      );
    }

    // 검증 실패한 아이템 필터링 (옵션)
    if (filterInvalid) {
      const beforeCount = normalized.length;
      normalized = normalized.filter((item, index) => {
        const result = validationResult.results[index];
        const isValid = result?.validation.success ?? true;
        if (!isValid && verbose) {
          console.warn(
            `[normalizePlaceItems] 검증 실패로 제거: ${item.title} - ` +
              `${result?.validation.errors.join(", ")}`,
          );
        }
        return isValid;
      });

      if (verbose && normalized.length < beforeCount) {
        console.log(
          `[normalizePlaceItems] 검증 실패로 ${beforeCount - normalized.length}개 아이템 제거 ` +
            `(남은 아이템: ${normalized.length}개)`,
        );
      }
    }
  }

  return normalized;
}
