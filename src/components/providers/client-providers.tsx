"use client";

/**
 * 클라이언트 프로바이더 컴포넌트
 * 
 * ClerkProvider 제거됨 - Server Components 렌더링 에러 해결을 위해
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

