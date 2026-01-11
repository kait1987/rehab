/**
 * @file sentry.client.config.ts
 * @description Sentry 클라이언트 설정
 * 
 * 브라우저에서 실행되는 에러 및 성능 모니터링 설정
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // 환경 구분
  environment: process.env.NODE_ENV,
  
  // 성능 모니터링 샘플링
  // Dev/Preview: 100%, Prod: 10%
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // 세션 리플레이 (선택)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  
  // 개발 환경에서 디버그 모드
  debug: false,
  
  // 무시할 에러 패턴
  ignoreErrors: [
    // 네트워크 에러
    "NetworkError",
    "Failed to fetch",
    // 브라우저 확장 프로그램 에러
    "chrome-extension://",
    "moz-extension://",
  ],
});
