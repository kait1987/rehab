/**
 * @file client.ts
 * @description 네이버맵 API 클라이언트
 * 
 * 네이버 지역 검색 API를 호출하기 위한 클라이언트 래퍼입니다.
 * 
 * 주요 기능:
 * - 장소 검색 API 호출
 * - 에러 처리 및 재시도 로직
 * - API 호출량 추적
 * 
 * 참고:
 * - 네이버 지역 검색 API: https://developers.naver.com/docs/serviceapi/search/local/local.md
 * - 일일 호출 한도: 25,000회
 */

import { validateNaverMapEnv, getRequiredEnvVar } from '@/lib/utils/validate-env';
import { naverMapApiMonitor } from './monitor';
import { normalizePlaceItems } from '@/lib/utils/normalize-place-item';
import { convertNaverToWGS84 } from '@/lib/utils/coordinate-converter';
import type {
  PlaceSearchOptions,
  PlaceSearchResult,
  PlaceSearchError,
  WGS84Coordinate,
} from '@/types/naver-map';

/**
 * 네이버맵 API 클라이언트
 */
export class NaverMapClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl = 'https://openapi.naver.com/v1/search/local';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1초

  constructor() {
    // 환경변수 검증
    const validation = validateNaverMapEnv();
    if (!validation.hasServerCredentials) {
      throw new Error(
        '네이버맵 API 서버 사이드 인증 정보가 설정되지 않았습니다.\n' +
        'NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 설정해주세요.'
      );
    }

    this.clientId = getRequiredEnvVar('NAVER_CLIENT_ID');
    this.clientSecret = getRequiredEnvVar('NAVER_CLIENT_SECRET');
  }

  /**
   * 장소 검색 API 호출
   * 
   * @param query 검색어
   * @param options 검색 옵션
   * @returns 검색 결과 (API 실패 시 빈 결과 반환)
   */
  async searchPlaces(
    query: string,
    options?: PlaceSearchOptions
  ): Promise<PlaceSearchResult> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    // 재시도 로직
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const result = await this.executeSearch(query, options);
        const responseTime = Date.now() - startTime;

        // 성공 기록
        naverMapApiMonitor.recordApiCall(
          'place-search',
          true,
          responseTime
        );

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const responseTime = Date.now() - startTime;

        // 실패 기록
        naverMapApiMonitor.recordApiCall(
          'place-search',
          false,
          responseTime
        );

        // 마지막 시도가 아니면 재시도
        if (attempt < this.maxRetries - 1) {
          await this.delay(this.retryDelay * (attempt + 1));
          continue;
        }
      }
    }

    // 모든 재시도 실패 시 빈 결과 반환 (에러 던지지 않음)
    console.warn(
      `[NaverMapClient] 네이버맵 API 호출 실패 (${this.maxRetries}회 시도): ${lastError?.message}`
    );
    
    return {
      items: [],
      total: 0,
      start: options?.start || 1,
      display: options?.display || 5,
    };
  }

  /**
   * 실제 API 호출 실행
   * 
   * @param query 검색어
   * @param options 검색 옵션
   * @returns 검색 결과
   */
  private async executeSearch(
    query: string,
    options?: PlaceSearchOptions
  ): Promise<PlaceSearchResult> {
    const params = new URLSearchParams({
      query,
      display: String(options?.display || 5),
      start: String(options?.start || 1),
      sort: options?.sort || 'random',
    });

    // 카테고리 필터
    if (options?.category) {
      params.append('category', options.category);
    }

    // 참고: 네이버 지역 검색 API는 좌표 기반 반경 검색을 직접 지원하지 않음
    // 반경 필터링은 클라이언트 측에서 수행 (PlaceSearchService에서 처리)

    const url = `${this.baseUrl}.json?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': this.clientId,
        'X-Naver-Client-Secret': this.clientSecret,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorJson: PlaceSearchError = JSON.parse(errorText);
        
        // 네이버 API 에러 코드별 처리
        const errorCode = errorJson.errorCode;
        switch (errorCode) {
          case 'SE01':
            errorMessage = '잘못된 쿼리 요청입니다. API 요청 URL의 프로토콜, 파라미터 등을 확인해주세요.';
            break;
          case 'SE02':
            errorMessage = '부적절한 display 값입니다. display 파라미터는 1~5 사이의 값이어야 합니다.';
            break;
          case 'SE03':
            errorMessage = '부적절한 start 값입니다. start 파라미터는 1~1 사이의 값이어야 합니다.';
            break;
          case 'SE04':
            errorMessage = '부적절한 sort 값입니다. sort 파라미터는 "random" 또는 "comment"여야 합니다.';
            break;
          case 'SE05':
            errorMessage = '존재하지 않는 검색 API입니다. API 요청 URL에 오타가 있는지 확인해주세요.';
            break;
          case 'SE06':
            errorMessage = '잘못된 형식의 인코딩입니다. 검색어를 UTF-8로 인코딩해주세요.';
            break;
          case 'SE99':
            errorMessage = '시스템 에러가 발생했습니다. 잠시 후 다시 시도해주세요.';
            break;
          default:
            errorMessage = `${errorJson.errorCode}: ${errorJson.errorMessage}`;
        }
      } catch {
        // JSON 파싱 실패 시 원본 텍스트 사용
        errorMessage = errorText || errorMessage;
      }

      // 403 오류 (API 권한 없음) 처리
      if (response.status === 403) {
        errorMessage = 'API 권한이 없습니다. 네이버 개발자 센터에서 애플리케이션의 API 설정에서 "검색"이 선택되어 있는지 확인해주세요.';
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    // 네이버 API 응답을 정규화된 PlaceItem 형식으로 변환
    // 좌표 누락 아이템은 자동으로 필터링 (지도 서비스 특성상 좌표 필수)
    const normalizedItems = await normalizePlaceItems(data.items || [], {
      filterMissingCoordinates: true, // 좌표 없는 아이템 자동 제거
    });

    return {
      items: normalizedItems,
      total: parseInt(data.total || '0', 10),
      start: parseInt(data.start || '1', 10),
      display: parseInt(data.display || '5', 10),
      lastBuildDate: data.lastBuildDate || undefined,
    };
  }

  /**
   * 지연 함수 (재시도용)
   * 
   * @param ms 밀리초
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 네이버 좌표를 WGS84 좌표로 변환
   * 
   * @param mapx 네이버 X 좌표
   * @param mapy 네이버 Y 좌표
   * @returns WGS84 좌표
   */
  convertToWGS84(mapx: number, mapy: number): WGS84Coordinate {
    return convertNaverToWGS84(mapx, mapy);
  }
}

/**
 * 네이버맵 API 클라이언트 인스턴스 생성 (싱글톤 패턴)
 */
let clientInstance: NaverMapClient | null = null;

/**
 * 네이버맵 API 클라이언트 인스턴스 반환
 * 
 * @returns NaverMapClient 인스턴스
 */
export function getNaverMapClient(): NaverMapClient {
  if (!clientInstance) {
    clientInstance = new NaverMapClient();
  }
  return clientInstance;
}

