/**
 * @file middleware-utils.ts
 * @description Middleware용 순수 유틸리티 함수
 * 
 * Middleware에서 사용하는 순수 함수들을 격리합니다.
 * 
 * 엄격한 규칙:
 * - 절대 prisma, fs, path 등 Node.js 전용 모듈 import 금지
 * - 절대 무거운 라이브러리 import 금지
 * - 순수 함수만 포함 (부수 효과 없음)
 * - Next.js Edge Runtime 호환 함수만 포함
 * 
 * 이 파일의 함수들은 middleware.ts에서만 import하여 사용합니다.
 */

/**
 * 공개 경로 판단 (순수 함수)
 * 
 * @param pathname 경로명
 * @param publicRoutes 공개 경로 패턴 배열
 * @returns 공개 경로 여부
 */
export function isPublicPath(
  pathname: string,
  publicRoutes: string[] = [
    '/',
    '/sign-in',
    '/sign-up',
    '/gyms',
    '/courses',
    '/instruments',
    '/api/public',
  ]
): boolean {
  return publicRoutes.some((route) => {
    // 정확한 매칭
    if (pathname === route) return true;
    
    // 와일드카드 패턴 매칭 (예: "/gyms(.*)")
    const pattern = route.replace(/\(\.\*\)/g, '');
    if (pathname.startsWith(pattern)) return true;
    
    return false;
  });
}

/**
 * 보호된 경로 판단 (순수 함수)
 * 
 * @param pathname 경로명
 * @param protectedRoutes 보호된 경로 패턴 배열
 * @returns 보호된 경로 여부
 */
export function isProtectedPath(
  pathname: string,
  protectedRoutes: string[] = [
    '/my',
    '/courses/new',
  ]
): boolean {
  return protectedRoutes.some((route) => {
    // 정확한 매칭
    if (pathname === route) return true;
    
    // 와일드카드 패턴 매칭 (예: "/my(.*)")
    const pattern = route.replace(/\(\.\*\)/g, '');
    if (pathname.startsWith(pattern)) return true;
    
    return false;
  });
}

/**
 * 리다이렉트 URL 생성 (순수 함수)
 * 
 * @param baseUrl 기본 URL (request.url)
 * @param path 리다이렉트할 경로
 * @param searchParams 추가 쿼리 파라미터
 * @returns 리다이렉트 URL 문자열
 */
export function createRedirectUrl(
  baseUrl: string,
  path: string,
  searchParams?: Record<string, string>
): string {
  try {
    const url = new URL(path, baseUrl);
    
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    
    return url.toString();
  } catch (error) {
    // URL 생성 실패 시 기본 경로 반환
    console.error('[middleware-utils] URL 생성 실패:', error);
    return path;
  }
}

/**
 * 정적 파일 경로 판단 (순수 함수)
 * 
 * @param pathname 경로명
 * @returns 정적 파일 여부
 */
export function isStaticFile(pathname: string): boolean {
  const staticExtensions = [
    '.html',
    '.css',
    '.js',
    '.json',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.webp',
    '.webmanifest',
    '.csv',
    '.docx',
    '.xlsx',
    '.zip',
  ];

  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

/**
 * Next.js 내부 경로 판단 (순수 함수)
 * 
 * @param pathname 경로명
 * @returns Next.js 내부 경로 여부
 */
export function isNextInternalPath(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next') ||
    pathname === '/favicon.ico'
  );
}

