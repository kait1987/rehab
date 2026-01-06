import { cn } from "@/lib/utils";

/**
 * 로딩 스켈레톤 컴포넌트
 * 
 * 데이터 로딩 중 표시되는 스켈레톤 UI를 제공합니다.
 * 다양한 레이아웃을 지원합니다.
 */
interface LoadingSkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function LoadingSkeleton({
  className,
  variant = "rectangular",
  width,
  height,
}: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200 rounded";
  
  const variantClasses = {
    text: "h-4",
    circular: "rounded-full",
    rectangular: "rounded",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      aria-label="로딩 중"
      role="status"
    >
      <span className="sr-only">로딩 중...</span>
    </div>
  );
}

/**
 * 카드 스켈레톤 컴포넌트
 * 
 * 상품 카드나 주문 카드 등의 스켈레톤을 표시합니다.
 */
interface CardSkeletonProps {
  className?: string;
  showImage?: boolean;
  lines?: number;
}

export function CardSkeleton({
  className,
  showImage = true,
  lines = 2,
}: CardSkeletonProps) {
  return (
    <div className={cn("border rounded-lg p-4", className)}>
      <div className="space-y-4">
        {showImage && (
          <LoadingSkeleton variant="rectangular" height={200} className="w-full" />
        )}
        <div className="space-y-2">
          <LoadingSkeleton variant="text" width="60%" />
          <LoadingSkeleton variant="text" width="40%" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <LoadingSkeleton key={i} variant="text" width={i === lines - 1 ? "80%" : "100%"} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 리스트 스켈레톤 컴포넌트
 * 
 * 리스트 형태의 스켈레톤을 표시합니다.
 */
interface ListSkeletonProps {
  className?: string;
  items?: number;
  showAvatar?: boolean;
}

export function ListSkeleton({
  className,
  items = 3,
  showAvatar = false,
}: ListSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {showAvatar && (
            <LoadingSkeleton variant="circular" width={40} height={40} />
          )}
          <div className="flex-1 space-y-2">
            <LoadingSkeleton variant="text" width="60%" />
            <LoadingSkeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 그리드 스켈레톤 컴포넌트
 * 
 * 그리드 형태의 스켈레톤을 표시합니다.
 */
interface GridSkeletonProps {
  className?: string;
  items?: number;
  columns?: number;
}

export function GridSkeleton({
  className,
  items = 4,
  columns = 4,
}: GridSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

