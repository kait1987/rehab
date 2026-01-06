/**
 * @file main-layout.tsx
 * @description REHAB 재활운동 어플리케이션 메인 레이아웃 컴포넌트
 * 
 * 라이트 모드 기반 레이아웃 컴포넌트입니다.
 * - 크림 베이지 배경 적용
 * - 테라코타 Primary 색상 사용
 * - 모바일 우선 반응형 디자인
 * 
 * @dependencies
 * - @/components/Navbar: 네비게이션 바 컴포넌트
 */

import Navbar from "@/components/Navbar";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * 메인 레이아웃 컴포넌트
 * 
 * 전체 페이지의 기본 레이아웃을 제공합니다.
 * - Navbar 포함
 * - 크림 베이지 배경
 * - 모바일 우선 반응형
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 네비게이션 바 */}
      <Navbar />

      {/* 메인 콘텐츠 영역 */}
      <main className="relative">
        {children}
      </main>
    </div>
  );
}

