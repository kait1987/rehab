/**
 * @file gym-card.tsx
 * @description 헬스장 카드 컴포넌트
 *
 * 헬스장 검색 결과를 카드 형태로 표시합니다.
 *
 * 주요 기능:
 * - 헬스장 기본 정보 표시 (이름, 주소, 거리, 전화번호)
 * - 영업 상태 배지 (영업 중 / 휴무 / 영업 종료)
 * - 오늘의 운영시간 표시
 * - 편의시설 아이콘 표시
 * - 클릭 시 헬스장 상세 페이지로 이동
 *
 * @dependencies
 * - @/lib/utils/check-business-status: 영업 상태 확인
 * - @/types/gym-search: GymSearchResult 타입
 * - @/types/operating-hours: OperatingHours 타입
 * - lucide-react: 아이콘
 */

"use client";

import { useRouter } from "next/navigation";
import { MapPin, Phone, Clock, Volume2, Dumbbell, Car } from "lucide-react";
import type { GymSearchResult } from "@/types/gym-search";
import { getBusinessStatus } from "@/lib/utils/check-business-status";
import { getDayOfWeek } from "@/lib/constants/operating-hours";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface GymCardProps {
  gym: GymSearchResult;
}

/**
 * 오늘의 운영시간 텍스트 생성
 */
function getTodayOperatingHoursText(gym: GymSearchResult): string {
  if (!gym.operatingHours || gym.operatingHours.length === 0) {
    return "운영시간 정보 없음";
  }

  const now = new Date();
  const dayOfWeek = getDayOfWeek(now);
  const todayHours = gym.operatingHours.find((h) => h.dayOfWeek === dayOfWeek);

  if (!todayHours) {
    return "운영시간 정보 없음";
  }

  if (todayHours.isClosed) {
    return "오늘 휴무";
  }

  if (todayHours.openTime === "00:00" && todayHours.closeTime === "23:59") {
    return "24시간 운영";
  }

  if (todayHours.openTime && todayHours.closeTime) {
    return `오늘 ${todayHours.openTime} - ${todayHours.closeTime}`;
  }

  return "운영시간 정보 없음";
}

/**
 * 영업 상태 배지 컴포넌트
 */
function BusinessStatusBadge({ gym }: { gym: GymSearchResult }) {
  if (!gym.operatingHours || gym.operatingHours.length === 0) {
    return null;
  }

  const status = getBusinessStatus(gym.operatingHours);

  if (status.isOpen) {
    return (
      <Badge
        variant="outline"
        className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-500 border-green-500/30"
      >
        영업 중
      </Badge>
    );
  }

  if (status.currentDayHours?.isClosed) {
    return (
      <Badge
        variant="outline"
        className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-500 border-gray-500/30"
      >
        휴무
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-500 border-red-500/30"
    >
      영업 종료
    </Badge>
  );
}

/**
 * 거리 포맷팅 (미터 → 킬로미터)
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 헬스장 카드 컴포넌트
 */
export function GymCard({ gym }: GymCardProps) {
  const router = useRouter();

  const handleClick = () => {
    // TODO: 헬스장 상세 페이지로 이동
    // router.push(`/gyms/${gym.id}`);
    console.log("헬스장 클릭:", gym.id);
  };

  return (
    <Card
      className="p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      onClick={handleClick}
    >
      {/* 헤더: 이름 + 영업 상태 배지 */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-lg sm:text-xl font-semibold text-foreground flex-1">
          {gym.name}
        </h3>
        <BusinessStatusBadge gym={gym} />
      </div>

      {/* 주소 + 거리 */}
      <div className="flex items-start gap-2 mb-3 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
        <div className="flex-1">
          <p className="leading-relaxed">{gym.address}</p>
          <p className="text-xs mt-1 text-muted-foreground/80">
            {formatDistance(gym.distanceMeters)} 거리
          </p>
        </div>
      </div>

      {/* 운영시간 */}
      <div className="flex items-start gap-2 mb-3 text-sm text-muted-foreground">
        <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
        <span>{getTodayOperatingHoursText(gym)}</span>
      </div>

      {/* 전화번호 */}
      {gym.phone && (
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <Phone className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
          <a
            href={`tel:${gym.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:text-primary transition-colors"
          >
            {gym.phone}
          </a>
        </div>
      )}

      {/* 편의시설 아이콘 */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
        {gym.facilities.hasRehabEquipment && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Dumbbell className="h-3 w-3" strokeWidth={1.5} />
            <span>재활 기구</span>
          </div>
        )}
        {gym.facilities.hasParking && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Car className="h-3 w-3" strokeWidth={1.5} />
            <span>주차</span>
          </div>
        )}
      </div>

      {/* 상세보기 버튼 */}
      <div className="mt-4 pt-4 border-t border-border">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/gyms/${gym.id}`);
          }}
          className="w-full bg-primary hover:bg-primary-hover text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          상세보기
        </Button>
      </div>
    </Card>
  );
}
