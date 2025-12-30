/**
 * @file page.tsx
 * @description REHAB 재활운동 어플리케이션 홈페이지
 * 
 * 동네 기반 재활 헬스장 추천 & 60/90/120분 재활 코스 생성 서비스
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dumbbell, MapPin, Clock, Heart } from "lucide-react";

export default async function Home() {
  return (
    <main className="min-h-[calc(100vh-80px)]">
      <div className="container mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            재활운동, 이제 쉽게 시작하세요
          </h1>
          <p className="text-muted-foreground text-xl mb-8 max-w-2xl mx-auto">
            동네 기반 재활 헬스장 추천과 맞춤형 재활 코스로<br />
            안전하고 꾸준한 재활운동을 시작해보세요
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/courses">재활 코스 만들기</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8">
              <Link href="/gyms">헬스장 찾기</Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="p-6 border rounded-lg text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">동네 헬스장 추천</h3>
            <p className="text-muted-foreground">
              재활에 적합한 조용하고 친화적인 헬스장을<br />
              내 위치 기반으로 찾아보세요
            </p>
          </div>
          
          <div className="p-6 border rounded-lg text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">맞춤형 재활 코스</h3>
            <p className="text-muted-foreground">
              60분, 90분, 120분 중 선택하여<br />
              내 상태에 맞는 재활 코스를 받아보세요
            </p>
          </div>
          
          <div className="p-6 border rounded-lg text-center">
            <Heart className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">안전한 재활운동</h3>
            <p className="text-muted-foreground">
              통증 부위와 경험 수준을 고려한<br />
              안전한 재활운동 루틴을 제공합니다
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-4">지금 바로 시작해보세요</h2>
          <p className="text-muted-foreground mb-6">
            허리, 어깨, 무릎, 목 등 특정 부위가 불편하신가요?<br />
            오늘 할 수 있는 재활 코스를 만들어보세요
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/courses/new">코스 생성하기</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
