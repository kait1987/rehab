/**
 * @file instrumentation.ts
 * @description Next.js 15 인스트루멘테이션 훅
 * 
 * 서버 및 엣지 런타임에서 Sentry 초기화
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
