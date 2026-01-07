"use client";

import { ClerkProvider } from "@clerk/nextjs";
import React from "react";

/**
 * 클라이언트 프로바이더 컴포넌트
 * 
 * ClerkProvider 복구: 인증 기능을 위해 필요
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  // 환경변수 확인 (빌드 타임에는 undefined일 수 있음)
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // 환경변수가 없으면 경고만 출력하고 children 반환
  if (!publishableKey) {
    if (typeof window !== "undefined") {
      console.warn("⚠️ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY가 설정되지 않았습니다.");
    }
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
}

