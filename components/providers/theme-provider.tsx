"use client";

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

/**
 * 테마 프로바이더 컴포넌트
 * 
 * 다크모드/라이트모드 전환을 관리합니다.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

