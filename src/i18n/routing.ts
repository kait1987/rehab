import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // 지원 언어 목록
  locales: ['ko', 'en'],
  
  // 기본 언어
  defaultLocale: 'ko',
  
  // locale prefix 전략 (always: 모든 경로에 /ko, /en 포함)
  localePrefix: 'as-needed'
});

// Wrapped navigation APIs
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
