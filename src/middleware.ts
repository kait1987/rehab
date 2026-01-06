/**
 * @file middleware.ts
 * @description Next.js Middleware - Clerk 인증 처리 (Edge Runtime 최적화)
 * 
 * ⚠️ 중요: Edge Runtime 호환을 위한 최소 코드
 * 
 * 엄격한 규칙:
 * - Edge Runtime 호환 모듈만 import
 * - prisma, fs, path 등 Node.js 전용 모듈 절대 금지
 * - auth(), protect() 등 Edge에서 문제가 되는 함수 사용 금지
 * - 최소 코드로 안정성 확보 우선
 * 
 * 변경 이력:
 * - auth(), protect() 로직 제거 (Edge Runtime 크래시 방지)
 * - createRouteMatcher 제거 (현재는 안정성 우선)
 * - clerkMiddleware()만 사용 (Clerk 내부 로직에 의존)
 * 
 * 참고:
 * - Clerk의 clerkMiddleware()는 내부적으로 공개/보호 경로를 자동 처리합니다
 * - 필요 시 나중에 createRouteMatcher를 사용하여 경로 제어를 추가할 수 있습니다
 */

import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // ✅ Next.js 내부 경로 제외: _next (이미지, 정적 파일 포함)
    // ✅ 정적 파일 확장자 제외: html, css, js, json, png, jpg, jpeg, gif, svg, ico, woff, woff2, ttf, eot, webp, webmanifest, csv, docx, xlsx, zip
    // ✅ 이미지 파일 제외: _next/image, .png, .jpg, .jpeg, .gif, .svg, .webp, .ico
    // ✅ favicon.ico 제외: .ico 확장자로 제외됨
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // ✅ API 라우트 포함: /api/*, /trpc/*
    '/(api|trpc)(.*)',
  ],
};

