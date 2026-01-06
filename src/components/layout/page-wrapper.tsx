/**
 * @file page-wrapper.tsx
 * @description 페이지 래퍼 컴포넌트
 * 
 * 다크 모드 기반 페이지 래퍼 컴포넌트입니다.
 * - 공통 패딩/마진
 * - 모바일 우선 스타일
 * - 다크 배경 적용
 * - 최소 높이 보장
 * 
 * @dependencies
 * - Tailwind CSS v4
 */

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 페이지 래퍼 컴포넌트
 * 
 * 모든 페이지에 공통으로 적용되는 래퍼 컴포넌트
 */
export function PageWrapper({ children, className = "" }: PageWrapperProps) {
  return (
    <div
      className={`
        min-h-screen
        bg-background
        text-foreground
        pb-8 sm:pb-12 md:pb-16
        ${className}
      `}
    >
      {children}
    </div>
  );
}

