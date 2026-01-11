"use client";

import { ClerkProvider } from "@clerk/nextjs";
import React from "react";
import { useServiceWorker } from "@/hooks/use-service-worker";

/**
 * 클라이언트 프로바이더 컴포넌트
 * 
 * ClerkProvider 복구: 인증 기능을 위해 필요
 * Service Worker 등록: PWA 오프라인 지원
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  // 📱 Phase 4: Service Worker 등록
  useServiceWorker();

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
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        variables: {
          colorPrimary: "#f97316", // 주황색 primary
          colorBackground: "#1c1917", // 어두운 배경
          colorInputBackground: "#44403c", // 입력 필드 배경 (더 밝게)
          colorInputText: "#ffffff", // 입력 텍스트 (흰색)
          colorText: "#ffffff", // 기본 텍스트 (흰색)
          colorTextSecondary: "#d6d3d1", // 보조 텍스트 (밝은 회색)
          colorNeutral: "#ffffff", // 중립 색상
          borderRadius: "0.75rem",
        },
        elements: {
          // 전체 카드
          card: {
            backgroundColor: "#292524",
            border: "1px solid #57534e",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          },
          // 헤더
          headerTitle: {
            color: "#ffffff",
            fontWeight: "bold",
          },
          headerSubtitle: {
            color: "#d6d3d1",
          },
          // 소셜 버튼
          socialButtonsBlockButton: {
            backgroundColor: "#44403c",
            border: "1px solid #78716c",
            color: "#ffffff",
          },
          socialButtonsBlockButtonText: {
            color: "#ffffff",
            fontWeight: "500",
          },
          // 구분선
          dividerLine: {
            backgroundColor: "#78716c",
          },
          dividerText: {
            color: "#a8a29e",
          },
          // 폼 필드
          formFieldLabel: {
            color: "#e7e5e4",
            fontWeight: "500",
          },
          formFieldInput: {
            backgroundColor: "#44403c",
            borderColor: "#78716c",
            color: "#ffffff",
          },
          // 버튼
          formButtonPrimary: {
            backgroundColor: "#f97316",
            color: "#ffffff",
            fontWeight: "600",
          },
          // 푸터 링크
          footerActionLink: {
            color: "#fb923c",
          },
          footerActionText: {
            color: "#a8a29e",
          },
          // 유저 버튼
          userButtonAvatarBox: {
            width: "36px",
            height: "36px",
          },
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

