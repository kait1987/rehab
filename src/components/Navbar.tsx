"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useUser, useClerk, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { PainCheckModal } from "@/components/pain-check-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="w-full flex h-16 items-center justify-between px-3 sm:px-4 md:px-6 py-3 relative">
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center group"
            aria-label="홈페이지로 이동"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-lg sm:text-xl font-semibold">REHAB</span>
          </Link>
        </div>

        {/* 데스크탑 메뉴 */}
        <div className="hidden sm:flex items-center gap-3">
          {isLoaded && !isSignedIn && (
            <>
              <Button 
                onClick={() => router.push('/sign-in')}
                className="rounded-xl bg-primary hover:bg-primary-hover text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 px-4 py-2 text-sm"
              >
                로그인
              </Button>
              <Button
                onClick={() => router.push('/sign-up')}
                variant="secondary"
                className="rounded-xl bg-secondary hover:bg-secondary-hover text-white border-2 border-secondary-dark/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 px-4 py-2 text-sm"
              >
                회원가입
              </Button>
            </>
          )}
          {isLoaded && isSignedIn && (
            <>
              <PainCheckModal>
                <Button className="rounded-xl bg-primary hover:bg-primary-hover text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 px-4 py-2 text-sm">
                  재활 코스
                </Button>
              </PainCheckModal>
              
              {/* 프로필 드롭다운 메뉴 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-full p-2 hover:bg-muted"
                    aria-label="프로필 메뉴"
                  >
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt="프로필"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6" strokeWidth={1.5} />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium truncate">
                      {user?.fullName || user?.primaryEmailAddress?.emailAddress || '사용자'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push('/mypage')}
                    className="cursor-pointer"
                  >
                    <User className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    마이페이지
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/settings')}
                    className="cursor-pointer"
                  >
                    <Settings className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    설정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        {/* 모바일 햄버거 버튼 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="sm:hidden p-2 text-foreground hover:bg-muted rounded-md transition-colors"
          aria-label="메뉴 열기/닫기"
        >
          {isOpen ? (
            <X className="h-6 w-6" strokeWidth={1.5} />
          ) : (
            <Menu className="h-6 w-6" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {isOpen && (
        <div className="sm:hidden absolute top-16 left-0 w-full bg-background border-b border-border shadow-lg">
          <div className="container px-3 py-3 flex flex-col gap-2">
            {isLoaded && !isSignedIn && (
              <>
                <Button 
                  onClick={() => {
                    router.push('/sign-in');
                    setIsOpen(false);
                  }}
                  className="w-full justify-start rounded-xl bg-primary hover:bg-primary-hover text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  로그인
                </Button>
                <Button
                  onClick={() => {
                    router.push('/sign-up');
                    setIsOpen(false);
                  }}
                  variant="secondary"
                  className="w-full justify-start rounded-xl bg-secondary hover:bg-secondary-hover text-white border-2 border-secondary-dark/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  회원가입
                </Button>
              </>
            )}
            {isLoaded && isSignedIn && (
              <>
                <PainCheckModal>
                  <Button 
                    className="w-full justify-start rounded-xl bg-primary hover:bg-primary-hover text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    onClick={() => setIsOpen(false)}
                  >
                    재활 코스
                  </Button>
                </PainCheckModal>
                
                {/* 모바일 프로필 메뉴 */}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="px-2 py-2 mb-2">
                    <p className="text-sm font-medium truncate">
                      {user?.fullName || user?.primaryEmailAddress?.emailAddress || '사용자'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      router.push('/mypage');
                      setIsOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    <User className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    마이페이지
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      router.push('/settings');
                      setIsOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    <Settings className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    설정
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="w-full justify-start text-destructive hover:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    로그아웃
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
