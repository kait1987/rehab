/**
 * @file validate-env.ts
 * @description 환경변수 검증 유틸리티
 * 
 * 네이버맵 API 관련 환경변수가 올바르게 설정되었는지 검증하는 함수들을 제공합니다.
 * 개발 환경에서는 경고를 표시하고, 프로덕션에서는 에러를 throw합니다.
 */

/**
 * 네이버맵 API 환경변수 검증 결과
 */
export interface NaverMapEnvValidation {
  /** 서버 사이드 인증 정보 존재 여부 (Client ID, Secret) */
  hasServerCredentials: boolean;
  /** 클라이언트 사이드 Client ID 존재 여부 */
  hasClientId: boolean;
  /** 전체 검증 통과 여부 */
  isValid: boolean;
  /** 누락된 환경변수 목록 */
  missingVars: string[];
}

/**
 * 네이버맵 API 환경변수 검증
 * 
 * 개발 환경에서는 경고를 표시하고, 프로덕션에서는 에러를 throw합니다.
 * 
 * @returns 검증 결과
 * @throws 프로덕션 환경에서 필수 환경변수가 없을 경우
 */
export function validateNaverMapEnv(): NaverMapEnvValidation {
  const isProduction = process.env.NODE_ENV === 'production';
  const missingVars: string[] = [];

  // 서버 사이드 인증 정보 확인
  const hasClientId = !!process.env.NAVER_CLIENT_ID;
  const hasClientSecret = !!process.env.NAVER_CLIENT_SECRET;
  const hasServerCredentials = hasClientId && hasClientSecret;

  if (!hasClientId) {
    missingVars.push('NAVER_CLIENT_ID');
  }
  if (!hasClientSecret) {
    missingVars.push('NAVER_CLIENT_SECRET');
  }

  // 클라이언트 사이드 Client ID 확인
  const hasPublicClientId = !!process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  if (!hasPublicClientId) {
    missingVars.push('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID');
  }

  const isValid = hasServerCredentials && hasPublicClientId;

  // 프로덕션 환경에서는 필수 환경변수가 없으면 에러 throw
  if (isProduction && !isValid) {
    throw new Error(
      `필수 네이버맵 API 환경변수가 설정되지 않았습니다: ${missingVars.join(', ')}\n` +
      '환경변수 설정 방법은 docs/NAVER_MAP_API_SETUP.md를 참고하세요.'
    );
  }

  // 개발 환경에서는 경고만 표시
  if (!isProduction && !isValid) {
    console.warn(
      '⚠️  네이버맵 API 환경변수가 설정되지 않았습니다.\n' +
      `누락된 환경변수: ${missingVars.join(', ')}\n` +
      '환경변수 설정 방법은 docs/NAVER_MAP_API_SETUP.md를 참고하세요.'
    );
  }

  return {
    hasServerCredentials,
    hasClientId: hasPublicClientId,
    isValid,
    missingVars,
  };
}

/**
 * 특정 환경변수 존재 여부 확인
 * 
 * @param varName 환경변수 이름
 * @returns 존재 여부
 */
export function hasEnvVar(varName: string): boolean {
  return !!process.env[varName];
}

/**
 * 필수 환경변수 확인 및 값 반환
 * 
 * @param varName 환경변수 이름
 * @param defaultValue 기본값 (선택)
 * @returns 환경변수 값
 * @throws 환경변수가 없고 기본값도 없을 경우
 */
export function getRequiredEnvVar(
  varName: string,
  defaultValue?: string
): string {
  const value = process.env[varName] || defaultValue;

  if (!value) {
    throw new Error(
      `필수 환경변수가 설정되지 않았습니다: ${varName}\n` +
      '환경변수 설정 방법은 docs/NAVER_MAP_API_SETUP.md를 참고하세요.'
    );
  }

  return value;
}

