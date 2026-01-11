/**
 * @file sentry.server.config.ts
 * @description Sentry 서버 설정
 * 
 * Node.js 서버에서 실행되는 에러 및 성능 모니터링 설정
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // 환경 구분
  environment: process.env.NODE_ENV,
  
  // 성능 모니터링 샘플링
  // Dev/Preview: 100%, Prod: 10%
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // 개발 환경에서 디버그 모드
  debug: false,
});
