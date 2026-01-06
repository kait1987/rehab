"use client";

import { SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 relative">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center group" aria-label="홈페이지로 이동" onClick={() => setIsOpen(false)}>
            <span className="text-lg sm:text-xl font-semibold">
              REHAB
            </span>
          </Link>
        </div>

        {/* 데스크탑 메뉴 */}
        <div className="hidden sm:flex items-center gap-4">
          {/* <ThemeToggle /> */}
          <SignedIn>
            <Link href="/my" aria-label="마이페이지로 이동">
              <Button variant="ghost" size="icon" aria-label="마이페이지">
                <User className="h-5 w-5" />
                <span className="sr-only">마이페이지</span>
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost">로그인</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>회원가입</Button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>

        {/* 모바일 햄버거 버튼 */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="sm:hidden p-2 text-foreground hover:bg-muted rounded-md transition-colors"
          aria-label="메뉴 열기/닫기"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {isOpen && (
        <div className="sm:hidden absolute top-16 left-0 w-full bg-background border-b border-border shadow-lg">
          <div className="container px-4 py-4 flex flex-col gap-4">
            {/* <ThemeToggle /> */}
            <SignedIn>
              <Link 
                href="/my" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <User className="h-5 w-5" />
                <span>마이페이지</span>
              </Link>
            </SignedIn>
            <SignedOut>
              <div className="flex flex-col gap-2">
                <SignInButton mode="modal">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setIsOpen(false)}>
                    로그인
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="w-full justify-start" onClick={() => setIsOpen(false)}>
                    회원가입
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="text-sm text-muted-foreground">계정</span>
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
