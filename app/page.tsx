/**
 * @file page.tsx
 * @description REHAB 재활운동 어플리케이션 홈페이지
 * 
 * 동네 기반 재활 헬스장 추천 & 60/90/120분 재활 코스 생성 서비스
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navigation, Timer, Heart, HeartPulse } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { PainCheckModal } from "@/components/pain-check-modal";

export default async function Home() {
  return (
    <main className="min-h-[calc(100vh-80px)] relative overflow-hidden">
      {/* 오로라 효과 배경 - 왼쪽 상단(민트)과 우측 하단(살구색) */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* 왼쪽 상단 - 민트색 (Soft Teal) */}
        <div 
          className="absolute -top-[300px] -left-[300px] w-[600px] h-[600px] rounded-full blur-3xl opacity-50"
          style={{
            background: 'radial-gradient(circle, oklch(0.9 0.05 200 / 0.4) 0%, oklch(0.9 0.05 200 / 0.2) 30%, transparent 70%)'
          }}
        />
        {/* 우측 하단 - 살구색 (Warm Beige/Peach) */}
        <div 
          className="absolute -bottom-[300px] -right-[300px] w-[600px] h-[600px] rounded-full blur-3xl opacity-50"
          style={{
            background: 'radial-gradient(circle, oklch(0.95 0.02 60 / 0.4) 0%, oklch(0.95 0.02 60 / 0.2) 30%, transparent 70%)'
          }}
        />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20 relative z-0">
        {/* Hero Section */}
        <div className="relative text-center mb-12 sm:mb-16 md:mb-20 bg-gradient-to-b from-primary-light/20 via-transparent to-transparent rounded-3xl py-8 sm:py-12 px-4 sm:px-6">
          {/* Blur Circle 효과 - 제목 주변 */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-40 -z-10"
            style={{
              background: 'radial-gradient(circle, oklch(0.92 0.04 150 / 0.3) 0%, oklch(0.92 0.04 150 / 0.1) 30%, transparent 70%)'
            }}
          />
          <h1 className="relative text-3xl sm:text-4xl md:text-6xl font-semibold text-foreground mb-4 sm:mb-6 leading-tight">
            오늘 내 몸에 딱 맞는 안전한 회복
          </h1>
          <p className="relative text-muted-foreground text-base sm:text-xl md:text-2xl mb-6 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            내 몸을 돌보는 첫걸음,<br />
            안전하고 꾸준한 회복을 시작해보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full sm:w-auto">
            <SignedOut>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <SignInButton mode="modal">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-2xl border-2 hover:bg-primary-light transition-all duration-300"
                  >
                    로그인
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-2xl bg-primary hover:bg-primary-hover text-white transition-all duration-300 shadow-xl hover:shadow-2xl shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5"
                  >
                    회원가입
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-2xl bg-primary hover:bg-primary-hover text-white transition-all duration-300 shadow-xl hover:shadow-2xl shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5"
                >
                  <Link href="/courses">재활 코스 만들기</Link>
                </Button>
                <Button 
                  asChild 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-2xl border-2 hover:bg-primary-light transition-all duration-300"
                >
                  <Link href="/gyms">헬스장 찾기</Link>
                </Button>
              </div>
            </SignedIn>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16 md:mt-24">
          <div className="p-6 sm:p-8 border border-border rounded-2xl text-center bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 rounded-full bg-primary-light/20 flex items-center justify-center">
              <Navigation className="h-8 w-8 sm:h-10 sm:w-10 text-primary" strokeWidth={1.2} />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">내 몸을 위한 조용한 공간 찾기</h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              재활에 적합한 조용하고 친화적인 헬스장을<br />
              내 위치 기반으로 찾아보세요
            </p>
          </div>
          
          <div className="p-6 sm:p-8 border border-border rounded-2xl text-center bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 rounded-full bg-primary-light/20 flex items-center justify-center">
              <Timer className="h-8 w-8 sm:h-10 sm:w-10 text-primary" strokeWidth={1.2} />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">내 상태에 맞는 회복 코스</h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              60분, 90분, 120분 중 선택하여<br />
              내 상태에 맞는 재활 코스를 받아보세요
            </p>
          </div>
          
          <div className="p-6 sm:p-8 border border-border rounded-2xl text-center bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 rounded-full bg-primary-light/20 flex items-center justify-center">
              <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-primary fill-primary/20" strokeWidth={1.2} />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">안전하게 돌보는 재활운동</h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              통증 부위와 경험 수준을 고려한<br />
              안전한 재활운동 루틴을 제공합니다
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 sm:mt-16 md:mt-24 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4 sm:mb-5 text-foreground">오늘부터 내 몸을 돌보세요</h2>
          <p className="text-muted-foreground text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed">
            어느 부위든, 오늘부터 안전하게 돌보세요<br />
            내 몸에 맞는 재활 코스를 만들어보세요
          </p>
          <Button 
            asChild 
            size="lg" 
            className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-2xl bg-primary hover:bg-primary-hover text-white transition-all duration-300 shadow-xl hover:shadow-2xl shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5"
          >
            <Link href="/courses/new">코스 생성하기</Link>
          </Button>
        </div>
      </div>

      {/* 플로팅 버튼 - 오늘의 통증 체크 */}
      <PainCheckModal>
        <Button
          size="lg"
          className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 rounded-full w-14 h-14 sm:w-16 sm:h-16 bg-primary hover:bg-primary-hover text-white shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-110 hover:-translate-y-1"
          aria-label="오늘의 통증 체크"
        >
          <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
      </PainCheckModal>
    </main>
  );
}
