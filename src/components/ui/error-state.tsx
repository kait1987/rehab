import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 에러 상태 컴포넌트
 * 
 * 에러가 발생했을 때 표시되는 UI를 제공합니다.
 */
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  showIcon?: boolean;
}

export function ErrorState({
  title = "문제가 발생했습니다",
  message,
  onRetry,
  retryLabel = "다시 시도",
  className,
  showIcon = true,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" aria-hidden="true" />
      )}
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="default">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

