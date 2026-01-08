/**
 * @file storage-warning-banner.tsx
 * @description Private 모드 경고 배너 컴포넌트
 *
 * Private 브라우징 모드에서 localStorage가 사용 불가능할 때
 * 사용자에게 경고 메시지를 표시합니다.
 *
 * @dependencies
 * - @/components/ui/alert: Alert 컴포넌트
 * - @/hooks/use-local-favorites: localStorage 상태 확인
 * - lucide-react: 아이콘
 */

'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useLocalFavorites } from '@/hooks/use-local-favorites';

export function StorageWarningBanner() {
  const { isAvailable } = useLocalFavorites();

  // localStorage 사용 가능하면 배너 표시 안 함
  if (isAvailable) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />
      <AlertDescription>
        Private 모드에서는 즐겨찾기와 최근 코스가 저장되지 않습니다.
      </AlertDescription>
    </Alert>
  );
}
