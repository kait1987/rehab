import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * @file middleware.ts
 * @description Clerk 인증 미들웨어
 * 
 * 이 미들웨어는 Clerk auth() 에러를 해결하기 위해 존재만 합니다.
 * 어떤 경로도 보호하거나 차단하지 않으며, 단순히 Clerk 미들웨어를 초기화합니다.
 * 
 * 실제 경로 보호는 각 페이지나 API 라우트에서 auth() 또는 currentUser()를 사용하여 처리합니다.
 */
export default clerkMiddleware();

/**
 * matcher 설정
 * - 정적 파일(_next, 확장자 파일)을 제외한 모든 경로를 매칭합니다.
 * - 이렇게 하면 Clerk 미들웨어가 모든 요청에 대해 실행되지만, 실제 보호는 하지 않습니다.
 */
export const config = {
  matcher: [
    // 정적 파일과 _next 내부 경로를 제외한 모든 경로 매칭
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // API 라우트 포함
    '/(api|trpc)(.*)',
  ],
};

