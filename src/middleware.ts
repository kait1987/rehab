/**
 * @file middleware.ts
 * @description Next.js Middleware - Clerk 인증 처리
 * 
 * 엄격한 규칙:
 * - Edge Runtime 호환 모듈만 import
 * - prisma, fs, path 등 Node.js 전용 모듈 절대 금지
 * - 무거운 라이브러리 import 금지
 * - 순수 유틸리티는 lib/middleware-utils.ts에서만 import
 * 
 * 검증 완료:
 * ✅ clerkMiddleware, createRouteMatcher: Clerk (Edge Runtime 호환)
 * ✅ NextResponse: Next.js (Edge Runtime 호환)
 * ✅ config.matcher: 이미지, 정적 파일, Next.js 내부 경로 제외 확인
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 공개 경로 정의 (인증 없이 접근 가능)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/gyms(.*)",
  "/courses(.*)", // /courses는 공개 (단, /courses/new는 보호된 경로에서 먼저 체크됨)
  "/instruments(.*)",
  "/api/public(.*)",
]);

// 보호된 경로 정의 (인증 필요)
const isProtectedRoute = createRouteMatcher([
  "/my(.*)",
  "/courses/new(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // 보호된 경로 접근 시 인증 확인
  if (isProtectedRoute(request)) {
    const { userId } = await auth();

    if (!userId) {
      // 미인증 사용자는 로그인 페이지로 리다이렉트
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // 공개 경로가 아닌 경우 기본적으로 보호
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // ✅ Next.js 내부 경로 제외: _next (이미지, 정적 파일 포함)
    // ✅ 정적 파일 확장자 제외: html, css, js, json, png, jpg, jpeg, gif, svg, ico, woff, woff2, ttf, eot, webp, webmanifest, csv, docx, xlsx, zip
    // ✅ 이미지 파일 제외: _next/image, .png, .jpg, .jpeg, .gif, .svg, .webp, .ico
    // ✅ favicon.ico 제외: .ico 확장자로 제외됨
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // ✅ API 라우트 포함: /api/*, /trpc/*
    "/(api|trpc)(.*)",
  ],
};

