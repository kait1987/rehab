/**
 * @file lib/mcp/sentry-wrapper.ts
 * @description MCP 서버의 Sentry 통합 유틸리티
 *
 * MCP 서버의 도구, 리소스, 프롬프트 등에서 발생하는 에러를
 * Sentry로 자동 전송하는 래퍼 함수들을 제공합니다.
 *
 * @dependencies
 * - @sentry/nextjs: 에러 추적
 */

import * as Sentry from "@sentry/nextjs";

/**
 * 비동기 함수를 Sentry로 래핑하여 에러를 자동 추적
 * 
 * @param fn - 래핑할 비동기 함수
 * @param context - 에러 컨텍스트 정보
 * @returns 래핑된 함수
 */
export function withSentryErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context: {
    operation: string;
    component?: string;
  }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: context.component || "mcp-server",
          operation: context.operation,
        },
        extra: {
          args: args.length > 0 ? JSON.stringify(args.slice(0, 3)) : undefined, // 최대 3개만 로깅
        },
      });
      throw error;
    }
  }) as T;
}

/**
 * MCP 도구 핸들러를 Sentry로 래핑
 * 
 * 이 함수는 도구 핸들러 함수를 래핑하여 에러 발생 시 Sentry로 자동 전송합니다.
 * 
 * @param toolName - 도구 이름
 * @param handler - 도구 핸들러 함수 (원본 타입 유지)
 * @returns 래핑된 핸들러 함수
 */
export function wrapToolHandler<T extends (...args: unknown[]) => Promise<unknown>>(
  toolName: string,
  handler: T
): T {
  return withSentryErrorTracking(handler, {
    operation: `tool:${toolName}`,
    component: "mcp-tool",
  }) as T;
}

