"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * 테마 토글 컴포넌트
 * 
 * 라이트/다크 모드를 전환하는 버튼입니다.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 클라이언트 사이드에서만 렌더링 (hydration 에러 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="테마 전환">
              <Sun className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>테마 전환</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const tooltipText = theme === "dark" ? "일반 모드" : "다크 모드";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">테마 전환</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

