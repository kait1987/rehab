"use client";

import { ClerkProvider } from "@clerk/nextjs";

/**
 * 클라이언트 프로바이더 컴포넌트
 * 
 * 다크 모드가 기본이므로 ThemeProvider 제거
 * Clerk 인증만 제공
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  // 환경 변수가 있으면 우선 사용, 없으면 fallback 키 사용
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_b3V0Z29pbmctY2hpbXAtMzguY2xlcmsuYWNjb3VudHMuZGV2JA";

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
}

