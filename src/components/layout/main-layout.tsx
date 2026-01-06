/**
 * @file main-layout.tsx
 * @description REHAB 재활운동 어플리케이션 메인 레이아웃 컴포넌트
 * 
 * 다크 모드 기반 레이아웃 컴포넌트입니다.
 * - 다크 퍼플/블랙 배경 적용
 * - 퍼플 Primary 색상 사용
 * - 모바일 우선 반응형 디자인
 * 
 * @dependencies
 * - @/components/Navbar: 네비게이션 바 컴포넌트
 * - @/components/layout/page-wrapper: 페이지 래퍼 컴포넌트
 */

import Navbar from "@/components/Navbar";
import { PageWrapper } from "@/components/layout/page-wrapper";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * 메인 레이아웃 컴포넌트
 * 
 * 전체 페이지의 기본 레이아웃을 제공합니다.
 * - Navbar 포함
 * - 다크 배경
 * - 모바일 우선 반응형
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <PageWrapper>
      {/* 네비게이션 바 */}
      <Navbar />

      {/* 메인 콘텐츠 영역 */}
      <main className="relative">
        {children}
      </main>
    </PageWrapper>
  );
}

