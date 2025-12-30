import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

/**
 * 빈 상태 컴포넌트
 * 
 * 데이터가 없을 때 표시되는 UI를 제공합니다.
 */
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  const ActionButton = action?.href ? (
    <Link href={action.href}>
      <Button variant="default">{action.label}</Button>
    </Link>
  ) : action?.onClick ? (
    <Button variant="default" onClick={action.onClick}>
      {action.label}
    </Button>
  ) : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {Icon && (
        <Icon className="h-16 w-16 text-gray-300 mb-4" aria-hidden="true" />
      )}
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {message && <p className="text-gray-600 mb-6 max-w-md">{message}</p>}
      {ActionButton}
    </div>
  );
}

