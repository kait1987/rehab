"use client";

import { ClerkProvider } from "@clerk/nextjs";

/**
 * 클라이언트 프로바이더 컴포넌트
 * 
 * 다크 모드가 기본이므로 ThemeProvider 제거
 * Clerk 인증만 제공
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
}

