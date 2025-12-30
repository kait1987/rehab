"use client";

import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center group" aria-label="홈페이지로 이동">
            <span className="text-xl font-semibold">
              REHAB
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <SignedIn>
            <Link href="/my" aria-label="마이페이지로 이동">
              <Button variant="ghost" size="icon" aria-label="마이페이지">
                <User className="h-5 w-5" />
                <span className="sr-only">마이페이지</span>
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button>로그인</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
