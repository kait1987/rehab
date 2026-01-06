/**
 * @file responsive-container.tsx
 * @description 반응형 컨테이너 컴포넌트
 * 
 * 다크 모드 기반 반응형 레이아웃 컨테이너입니다.
 * - 반응형 최대 너비
 * - 중앙 정렬
 * - 모바일/태블릿/데스크톱 대응
 * - 다크 배경 적용
 * 
 * @dependencies
 * - Tailwind CSS v4
 */

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | "full";
}

/**
 * 반응형 컨테이너 컴포넌트
 * 
 * 화면 크기에 따라 최대 너비가 자동으로 조정되는 컨테이너
 */
export function ResponsiveContainer({
  children,
  className = "",
  maxWidth = "7xl",
}: ResponsiveContainerProps) {
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  }[maxWidth];

  return (
    <div
      className={`
        w-full
        ${maxWidthClass}
        mx-auto
        px-4 sm:px-6 md:px-8 lg:px-12
        ${className}
      `}
    >
      {children}
    </div>
  );
}

