/**
 * @file page.tsx
 * @description REHAB 재활운동 어플리케이션 홈페이지
 *
 * 동네 기반 재활 헬스장 추천 & 60/90/120분 재활 코스 생성 서비스
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Activity, HeartPulse } from "lucide-react";
import { PainCheckModal } from "@/components/pain-check-modal";
import { HomeFeaturesSection } from "@/components/home-features-section";
import { SignedIn } from "@clerk/nextjs";

export default async function Home() {
  return (
    <main className="min-h-[calc(100vh-80px)] relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20 relative z-0">
        {/* Hero Section */}
        <section className="text-center mb-12 sm:mb-16 md:mb-20">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-semibold text-foreground mb-4 sm:mb-6 leading-tight">
            내 몸에 맞는 재활 운동
          </h1>
          <p className="text-muted-foreground text-base sm:text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed">
            통증 없이 안전하게 시작하세요
          </p>
        </section>

        {/* 주요 액션 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16 md:mb-20">
          {/* 카드 1: 내 주변 헬스장 찾기 */}
          <Link href="/gyms" className="block">
            <Card className="p-6 sm:p-8 border border-border rounded-2xl bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <MapPin className="h-8 w-8 sm:h-10 sm:w-10 text-primary" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                  내 주변 헬스장 찾기
                </h2>
                <p className="text-muted-foreground text-base">
                  재활 운동 가능한 곳
                </p>
              </div>
            </Card>
          </Link>

          {/* 카드 2: 재활 코스 만들기 */}
          <Link href="/courses/create" className="block">
            <Card className="p-6 sm:p-8 border border-border rounded-2xl bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <Activity className="h-8 w-8 sm:h-10 sm:w-10 text-primary" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                  재활 코스 만들기
                </h2>
                <p className="text-muted-foreground text-base">
                  내 몸 상태에 맞는 운동
                </p>
              </div>
            </Card>
          </Link>
        </div>

        {/* 최근 코스 영역 (SignedIn 사용자만) */}
        <SignedIn>
          <section className="mt-12 sm:mt-16 md:mt-24">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6 text-foreground">
              최근 코스
            </h2>
            <Card className="p-8 sm:p-12 border border-border rounded-2xl bg-card text-center">
              <p className="text-muted-foreground text-base sm:text-lg">
                아직 생성한 코스가 없습니다
              </p>
            </Card>
          </section>
        </SignedIn>

        {/* 기능 소개 섹션 */}
        <HomeFeaturesSection />
      </div>

      {/* 플로팅 버튼 - 오늘의 통증 체크 */}
      <PainCheckModal>
        <Button
          size="lg"
          className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 rounded-full w-14 h-14 sm:w-16 sm:h-16 bg-primary hover:bg-primary-hover text-white shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-110 hover:-translate-y-1"
          aria-label="오늘의 통증 체크"
        >
          <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
        </Button>
      </PainCheckModal>
    </main>
  );
}
