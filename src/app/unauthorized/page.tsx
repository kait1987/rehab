'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldX, Home } from 'lucide-react';

/**
 * 권한 없음 페이지
 * 관리자 권한이 없는 사용자가 /admin 경로에 접근할 때 표시됩니다.
 */
export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        {/* 아이콘 */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <ShieldX className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>

        {/* 제목 */}
        <h1 className="text-3xl font-bold text-foreground">
          권한이 없습니다
        </h1>

        {/* 설명 */}
        <p className="text-muted-foreground">
          이 페이지에 접근할 수 있는 권한이 없습니다.
          <br />
          관리자 권한이 필요한 경우 담당자에게 문의하세요.
        </p>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              홈으로 이동
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
