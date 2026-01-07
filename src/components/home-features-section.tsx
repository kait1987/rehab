import {
  Navigation,
  Timer,
  Heart,
} from "lucide-react";

/**
 * @file home-features-section.tsx
 * @description 홈 화면 Features 섹션 컴포넌트
 * 
 * REHAB 서비스의 주요 기능 3가지를 카드 형태로 표시합니다.
 */

export function HomeFeaturesSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16 md:mt-24">
      <div className="p-6 sm:p-8 border border-border rounded-2xl text-center bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 rounded-full bg-primary-light/20 flex items-center justify-center">
          <Navigation
            className="h-8 w-8 sm:h-10 sm:w-10 text-primary"
            strokeWidth={1.5}
          />
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
          내 몸을 위한 조용한 공간 찾기
        </h3>
        <p className="text-muted-foreground text-base leading-relaxed">
          재활에 적합한 조용하고 친화적인 헬스장을
          <br />내 위치 기반으로 찾아보세요
        </p>
      </div>

      <div className="p-6 sm:p-8 border border-border rounded-2xl text-center bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 rounded-full bg-primary-light/20 flex items-center justify-center">
          <Timer
            className="h-8 w-8 sm:h-10 sm:w-10 text-primary"
            strokeWidth={1.5}
          />
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
          내 상태에 맞는 회복 코스
        </h3>
        <p className="text-muted-foreground text-base leading-relaxed">
          60분, 90분, 120분 중 선택하여
          <br />내 상태에 맞는 재활 코스를 받아보세요
        </p>
      </div>

      <div className="p-6 sm:p-8 border border-border rounded-2xl text-center bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 rounded-full bg-primary-light/20 flex items-center justify-center">
          <Heart
            className="h-8 w-8 sm:h-10 sm:w-10 text-primary fill-primary/20"
            strokeWidth={1.5}
          />
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
          안전하게 돌보는 재활운동
        </h3>
        <p className="text-muted-foreground text-base leading-relaxed">
          통증 부위와 경험 수준을 고려한
          <br />
          안전한 재활운동 루틴을 제공합니다
        </p>
      </div>
    </div>
  );
}

