/**
 * @file middleware.ts
 * @description Next.js Middleware (Edge Runtime 호환)
 * 
 * Phase 3.1: Edge Runtime 호환성을 위한 최소한의 인증 및 리다이렉트 로직만 포함
 * 
 * 핵심 원칙:
 * - Edge Runtime에서 동작하므로 Node.js 전용 모듈 사용 금지
 * - Prisma, DB 클라이언트, fs, path 등 무거운 라이브러리 import 금지
 * - Clerk의 clerkMiddleware만 사용하여 인증 체크 및 리다이렉트 처리
 * 
 * @dependencies
 * - @clerk/nextjs: Clerk 인증 미들웨어 (Edge Runtime 지원)
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * 보호된 경로 정의
 * 
 * 이 경로들은 로그인이 필요합니다.
 * 비로그인 사용자는 자동으로 로그인 페이지로 리다이렉트됩니다.
 */
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/courses/my(.*)',
  '/favorites(.*)',
]);

/**
 * 공개 경로 정의
 * 
 * 이 경로들은 로그인 없이 접근 가능합니다.
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api(.*)',
  '/courses/new(.*)',
  '/gyms(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // 보호된 경로 체크
  if (isProtectedRoute(request)) {
    // 인증 상태 확인
    const { userId } = await auth();
    
    // 비로그인 사용자는 로그인 페이지로 리다이렉트
    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', request.url);
      return Response.redirect(signInUrl);
    }
  }
  
  // 공개 경로는 그대로 통과
  // clerkMiddleware가 자동으로 인증 상태를 관리하므로 추가 처리 불필요
});

/**
 * Middleware가 실행될 경로 설정
 * 
 * 특정 경로에서만 middleware를 실행하여 성능 최적화
 */
export const config = {
  matcher: [
    // 다음 경로를 제외한 모든 경로에서 middleware 실행
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

