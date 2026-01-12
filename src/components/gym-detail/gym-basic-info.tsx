/**
 * @file gym-basic-info.tsx
 * @description 헬스장 기본 정보 컴포넌트
 * 
 * 헬스장의 기본 정보를 표시합니다.
 * 
 * 주요 기능:
 * - 헬스장 이름
 * - 주소
 * - 전화번호 (tel: 링크)
 * - 웹사이트 (외부 링크)
 * - 가격대 표시
 * - 설명
 * - 영업 상태 배지
 * 
 * @dependencies
 * - @/components/ui/card: Card 컴포넌트
 * - @/components/ui/badge: Badge 컴포넌트
 * - @/lib/utils/check-business-status: 영업 상태 확인
 * - lucide-react: 아이콘
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Globe } from 'lucide-react';
import { getBusinessStatus } from '@/lib/utils/check-business-status';
import GymReportButton from './gym-report-button';
import type { OperatingHours } from '@/types/operating-hours';

interface GymBasicInfoProps {
  gym: {
    id: string;
    name: string;
    address: string;
    phone?: string | null;
    website?: string | null;
    priceRange?: string | null;
    description?: string | null;
    operatingHours: OperatingHours[];
  };
}

/**
 * 영업 상태 배지 컴포넌트
 */
function BusinessStatusBadge({ hours }: { hours: OperatingHours[] }) {
  if (!hours || hours.length === 0) {
    return null;
  }

  const status = getBusinessStatus(hours);

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
 * 가격대 라벨 변환
 */
function getPriceRangeLabel(priceRange: string | null | undefined): string {
  if (!priceRange) return '';
  
  const labels: Record<string, string> = {
    low: '저렴',
    medium: '보통',
    high: '비쌈',
    premium: '프리미엄',
  };
  
  return labels[priceRange] || priceRange;
}

export function GymBasicInfo({ gym }: GymBasicInfoProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* 헬스장 이름 + 영업 상태 배지 */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-foreground">{gym.name}</h1>
          <div className="flex flex-col items-end gap-2">
            <BusinessStatusBadge hours={gym.operatingHours} />
            <GymReportButton gymId={gym.id} gymName={gym.name} />
          </div>
        </div>

        {/* 주소 */}
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 mt-0.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
          <span className="text-base text-foreground">{gym.address}</span>
        </div>

        {/* 전화번호 */}
        {gym.phone && (
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
            <a
              href={`tel:${gym.phone}`}
              className="text-base text-primary hover:underline transition-colors"
            >
              {gym.phone}
            </a>
          </div>
        )}

        {/* 웹사이트 */}
        {gym.website && (
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
            <a
              href={gym.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base text-primary hover:underline transition-colors"
            >
              웹사이트 방문
            </a>
          </div>
        )}

        {/* 가격대 */}
        {gym.priceRange && (
          <div className="pt-2">
            <Badge variant="secondary" className="text-sm">
              {getPriceRangeLabel(gym.priceRange)}
            </Badge>
          </div>
        )}

        {/* 설명 */}
        {gym.description && (
          <div className="pt-4 border-t border-border">
            <p className="text-muted-foreground leading-relaxed">{gym.description}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

