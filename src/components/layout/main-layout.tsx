/**
 * @file main-layout.tsx
 * @description REHAB 재활운동 어플리케이션 메인 레이아웃 컴포넌트
 * 
 * 다크 모드 기반 레이아웃 컴포넌트입니다.
 * - 크림 베이지 톤 배경 적용
 * - 테라코타 Primary 색상 사용
 * - 모바일 우선 반응형 디자인
 * 
 * @dependencies
 * - @/components/Navbar: 네비게이션 바 컴포넌트
 * - @/components/Footer: 푸터 컴포넌트
 * - @/components/layout/page-wrapper: 페이지 래퍼 컴포넌트
 */

import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageWrapper } from "@/components/layout/page-wrapper";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * 메인 레이아웃 컴포넌트
 * 
 * 전체 페이지의 기본 레이아웃을 제공합니다.
 * - Navbar 포함
 * - Footer 포함 (이용약관, 개인정보처리방침 링크)
 * - 다크 배경
 * - 모바일 우선 반응형
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <PageWrapper>
      {/* 네비게이션 바 - Suspense로 감싸서 Clerk 초기화 대기 */}
      <Suspense fallback={
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
          <div className="w-full flex h-16 items-center justify-between px-3 sm:px-4 md:px-6 py-3">
            <div className="flex items-center">
              <span className="text-lg sm:text-xl font-semibold">REHAB</span>
            </div>
            <div className="h-9 w-9" /> {/* 로딩 중 플레이스홀더 */}
          </div>
        </header>
      }>
        <Navbar />
      </Suspense>

      {/* 메인 콘텐츠 영역 */}
      <main className="relative flex-1">
        {children}
      </main>

      {/* 푸터 - 이용약관, 개인정보처리방침 링크 */}
      <Footer />
    </PageWrapper>
  );
}


