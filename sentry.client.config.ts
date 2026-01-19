/**
 * @file sentry.client.config.ts
 * @description Sentry 클라이언트 설정
 *
 * 브라우저에서 실행되는 에러 및 성능 모니터링 설정
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // ESM import style: import * as Sentry from "@sentry/nextjs"
  dsn: "https://33cee9ee3d0f12fcecf80cc3c1d74917@o4510734429323264.ingest.us.sentry.io/4510734430896128",

  // Tracing must be enabled for MCP monitoring to work
  tracesSampleRate: 1.0,

  // Enable sending user PII
  sendDefaultPii: true,

  // 환경 구분
  environment: process.env.NODE_ENV,

  // 세션 리플레이 (선택 - 기존 설정 유지)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

  // 개발 환경에서 디버그 모드 (선택)
  debug: false,

  // 무시할 에러 패턴
  ignoreErrors: [
    "NetworkError",
    "Failed to fetch",
    "chrome-extension://",
    "moz-extension://",
  ],
});
