/**
 * @file validate-env.ts
 * @description 환경변수 검증 유틸리티
 *
 * ⚠️ 주의:
 * 네이버맵 기능을 "실제로 사용할 때만" 검증이 동작하도록 설계됨
 * 아직 네이버맵을 붙이지 않은 단계에서는 경고/에러를 발생시키지 않음
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
 * 동작 조건:
 * - 네이버맵 관련 환경변수 중 하나라도 "사용 의도"가 보일 때만 검증
 * - 개발 환경: 경고만 출력
 * - 프로덕션 환경: 에러 throw
 */
export function validateNaverMapEnv(): NaverMapEnvValidation {
  const isProduction = process.env.NODE_ENV === "production";
  const missingVars: string[] = [];

  const serverClientId = process.env.NAVER_CLIENT_ID;
  const serverClientSecret = process.env.NAVER_CLIENT_SECRET;
  const publicClientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  const hasServerCredentials = !!(serverClientId && serverClientSecret);
  const hasClientId = !!publicClientId;

  // ✅ 네이버맵을 아직 사용하지 않는 경우
  // → 아무 경고/에러 없이 조용히 통과
  const isNaverMapUnused =
    !serverClientId && !serverClientSecret && !publicClientId;

  if (isNaverMapUnused) {
    return {
      hasServerCredentials: false,
      hasClientId: false,
      isValid: true,
      missingVars: [],
    };
  }

  // 서버 사이드 인증 정보 확인
  if (!serverClientId) {
    missingVars.push("NAVER_CLIENT_ID");
  }
  if (!serverClientSecret) {
    missingVars.push("NAVER_CLIENT_SECRET");
  }

  // 클라이언트 사이드 Client ID 확인
  if (!publicClientId) {
    missingVars.push("NEXT_PUBLIC_NAVER_MAP_CLIENT_ID");
  }

  const isValid = hasServerCredentials && hasClientId;

  // 프로덕션 환경에서는 에러
  if (isProduction && !isValid) {
    throw new Error(
      `필수 네이버맵 API 환경변수가 설정되지 않았습니다: ${missingVars.join(
        ", ",
      )}\n` + "환경변수 설정 방법은 docs/NAVER_MAP_API_SETUP.md를 참고하세요.",
    );
  }

  // 개발 환경에서는 경고만
  if (!isProduction && !isValid) {
    console.warn(
      "⚠️  네이버맵 API 환경변수가 설정되지 않았습니다.\n" +
        `누락된 환경변수: ${missingVars.join(", ")}\n` +
        "환경변수 설정 방법은 docs/NAVER_MAP_API_SETUP.md를 참고하세요.",
    );
  }

  return {
    hasServerCredentials,
    hasClientId,
    isValid,
    missingVars,
  };
}

/**
 * 특정 환경변수 존재 여부 확인
 */
export function hasEnvVar(varName: string): boolean {
  return !!process.env[varName];
}

/**
 * 필수 환경변수 확인 및 값 반환
 *
 * ⚠️ 실제로 사용하는 지점에서만 호출해야 함
 */
export function getRequiredEnvVar(
  varName: string,
  defaultValue?: string,
): string {
  const value = process.env[varName] || defaultValue;

  if (!value) {
    throw new Error(
      `필수 환경변수가 설정되지 않았습니다: ${varName}\n` +
        "환경변수 설정 방법은 docs/NAVER_MAP_API_SETUP.md를 참고하세요.",
    );
  }

  return value;
}
