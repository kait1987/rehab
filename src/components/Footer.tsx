/**
 * @file Footer.tsx
 * @description 푸터 컴포넌트
 *
 * 서비스 정보 및 법적 페이지 링크를 표시합니다.
 */

import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-background/95 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* 저작권 */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} REHAB. All rights reserved.
          </div>

          {/* 법적 링크 */}
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              이용약관
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              개인정보처리방침
            </Link>
          </nav>
        </div>

        {/* 의료행위 아님 고지 */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-md mx-auto">
            본 서비스는 의료행위가 아닙니다.
            <br className="hidden sm:inline" /> 통증이 악화되면 즉시 운동을
            중단하고 전문의와 상담하세요.
          </p>
        </div>
      </div>
    </footer>
  );
}
