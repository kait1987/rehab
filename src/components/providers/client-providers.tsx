"use client";

import { ClerkProvider } from "@clerk/nextjs";

/**
 * 클라이언트 프로바이더 컴포넌트
 * 
 * 다크 모드가 기본이므로 ThemeProvider 제거
 * Clerk 인증만 제공
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  // 빌드 타임에 환경 변수가 없을 때를 대비한 fallback
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

  // 환경 변수가 없으면 ClerkProvider 없이 렌더링 (빌드 실패 방지)
  if (!publishableKey) {
    console.warn("⚠️ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY가 설정되지 않았습니다. Clerk 기능이 비활성화됩니다.");
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
}

