"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

/**
 * 홈페이지 Hero 섹션 (Client Component)
 * 
 * Clerk 인증 상태에 따라 다른 버튼을 표시합니다.
 */
export function HomeHero() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full sm:w-auto">
      {isLoaded && !isSignedIn && (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <Button 
            size="lg" 
            className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-2xl bg-primary hover:bg-primary-hover text-white transition-all duration-300 shadow-xl hover:shadow-2xl shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5"
            onClick={() => router.push('/sign-in')}
          >
            로그인
          </Button>
          <Button 
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-2xl bg-secondary hover:bg-secondary-hover text-white border-2 border-secondary-dark/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-0.5"
            onClick={() => router.push('/sign-up')}
          >
            회원가입
          </Button>
        </div>
      )}
      {isLoaded && isSignedIn && (
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
            className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-2xl bg-secondary hover:bg-secondary-hover text-secondary-foreground border-2 border-secondary-dark/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-0.5"
          >
            <Link href="/gyms">헬스장 찾기</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

