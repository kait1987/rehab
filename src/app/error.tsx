"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import Link from "next/link";

/**
 * 전역 에러 처리 컴포넌트
 * 
 * Next.js Error Boundary로 사용됩니다.
 * 예상치 못한 에러가 발생했을 때 사용자에게 친화적인 에러 페이지를 표시합니다.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 (개발 환경)
    if (process.env.NODE_ENV === "development") {
      console.error("Error:", error);
    }
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <AlertCircle className="h-24 w-24 mx-auto text-red-500 mb-4" />
          <h1 className="text-4xl font-bold mb-4">문제가 발생했습니다</h1>
          <p className="text-gray-600 text-lg mb-2">
            예상치 못한 오류가 발생했습니다.
          </p>
          <p className="text-gray-500 text-sm">
            잠시 후 다시 시도해주세요. 문제가 계속되면 고객센터로 문의해주세요.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-sm font-semibold text-red-800 mb-2">에러 상세:</p>
            <p className="text-xs text-red-700 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={reset} 
            size="lg"
            className="w-full sm:w-auto text-lg px-8 py-6 rounded-2xl bg-primary hover:bg-primary-hover text-white transition-all duration-300 shadow-xl hover:shadow-2xl shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5"
          >
            다시 시도
          </Button>
          <Link href="/">
            <Button 
              variant="secondary" 
              size="lg"
              className="w-full sm:w-auto text-lg px-8 py-6 rounded-2xl bg-secondary hover:bg-secondary-hover text-secondary-foreground border-2 border-secondary-dark/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-0.5"
            >
              <Home className="h-4 w-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

