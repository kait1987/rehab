"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

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
            <Link href="/rehab">
              <Button className="rounded-xl bg-primary hover:bg-primary-hover text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 px-4 py-2 text-sm">
                재활 코스
              </Button>
            </Link>
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
              <Link href="/rehab" onClick={() => setIsOpen(false)}>
                <Button className="w-full justify-start rounded-xl bg-primary hover:bg-primary-hover text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  재활 코스
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
