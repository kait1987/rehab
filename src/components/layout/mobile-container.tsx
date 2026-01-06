/**
 * @file mobile-container.tsx
 * @description 모바일 우선 컨테이너 컴포넌트
 * 
 * 다크 모드 기반 모바일 우선 레이아웃 컨테이너입니다.
 * - 모바일 우선 디자인
 * - 다크 배경 적용
 * - 최대 너비 제한
 * - 반응형 패딩 설정
 * 
 * @dependencies
 * - Tailwind CSS v4
 */

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 모바일 우선 컨테이너 컴포넌트
 * 
 * 모바일 화면을 기본으로 하며, 큰 화면에서는 중앙 정렬 및 최대 너비 제한
 */
export function MobileContainer({ children, className = "" }: MobileContainerProps) {
  return (
    <div
      className={`
        w-full
        max-w-full
        mx-auto
        px-4 sm:px-6 md:px-8 lg:px-12
        ${className}
      `}
    >
      {children}
    </div>
  );
}

