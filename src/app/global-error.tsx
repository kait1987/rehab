/**
 * @file global-error.tsx
 * @description 전역 에러 핸들러 (App Router)
 * 
 * 루트 레이아웃 에러를 처리하고 Sentry에 보고합니다.
 */

"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry에 에러 보고
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              오류가 발생했습니다
            </h1>
            <p className="text-muted-foreground mb-6">
              죄송합니다. 예기치 않은 오류가 발생했습니다.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
