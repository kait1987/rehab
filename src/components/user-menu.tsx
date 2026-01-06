"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * @file user-menu.tsx
 * @description 사용자 메뉴 컴포넌트 (로그아웃 기능 포함)
 *
 * Clerk 인증 시스템을 사용하여 사용자 정보를 표시하고 로그아웃 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 사용자 정보 표시 (Avatar, 이름, 이메일)
 * 2. 로그아웃 기능
 *
 * @dependencies
 * - @clerk/nextjs: useUser, useClerk 훅
 * - lucide-react: LogOut 아이콘
 * - shadcn/ui: DropdownMenu, Avatar, Button 컴포넌트
 */

export function UserMenu() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  // 로딩 중이거나 사용자가 없을 경우 null 반환
  if (!isLoaded || !user) {
    return null;
  }

  /**
   * 로그아웃 처리
   * Clerk의 signOut 메서드를 호출하고, 성공 시 홈페이지로 리다이렉트합니다.
   */
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  // 사용자 이니셜 생성 (이름 또는 이메일 기반)
  // 방어 로직: firstName/lastName이 있고 첫 글자가 존재하는 경우만 사용
  const userInitials = (() => {
    if (user.firstName?.[0] && user.lastName?.[0]) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    // 이메일의 첫 글자 사용 (이메일이 있고 첫 글자가 존재하는 경우)
    const emailFirstChar = user.emailAddresses[0]?.emailAddress?.[0];
    if (emailFirstChar) {
      return emailFirstChar.toUpperCase();
    }
    // 모든 경우 실패 시 기본값
    return "U";
  })();

  // 사용자 전체 이름 또는 이메일
  const userDisplayName = user.fullName || user.emailAddresses[0]?.emailAddress || "사용자";
  
  // 사용자 이메일
  const userEmail = user.emailAddresses[0]?.emailAddress || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.imageUrl} alt={userDisplayName} />
            <AvatarFallback className="text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {userDisplayName}
            </p>
            {userEmail && (
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" strokeWidth={1.5} />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

