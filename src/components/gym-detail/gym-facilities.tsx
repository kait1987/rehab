/**
 * @file gym-facilities.tsx
 * @description 헬스장 시설 정보 컴포넌트
 * 
 * 헬스장의 시설 정보를 표시합니다.
 * 
 * 주요 기능:
 * - 6개 기본 시설 아이콘 그리드 표시
 * - 기타 시설 (otherFacilities) 배열 표시
 * 
 * @dependencies
 * - @/components/ui/card: Card 컴포넌트
 * - @/components/ui/badge: Badge 컴포넌트
 * - lucide-react: 아이콘
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, User, Droplet, Car, Lock } from 'lucide-react';

const FACILITY_CONFIG = {
  hasRehabEquipment: { icon: Dumbbell, label: '재활 기구' },
  hasPtCoach: { icon: User, label: 'PT 코치' },
  hasShower: { icon: Droplet, label: '샤워실' },
  hasParking: { icon: Car, label: '주차' },
  hasLocker: { icon: Lock, label: '락커' },
};

interface GymFacilitiesProps {
  facilities: {
    hasRehabEquipment?: boolean;
    hasPtCoach?: boolean;
    hasShower?: boolean;
    hasParking?: boolean;
    hasLocker?: boolean;
    otherFacilities?: string[];
  };
}

export function GymFacilities({ facilities }: GymFacilitiesProps) {
  const availableFacilities = Object.entries(FACILITY_CONFIG).filter(
    ([key]) => facilities[key as keyof typeof facilities]
  );

  if (availableFacilities.length === 0 && !facilities.otherFacilities?.length) {
    return null;
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-foreground">시설 정보</h2>

      {/* 기본 시설 */}
      {availableFacilities.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {availableFacilities.map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div
                key={key}
                className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg transition-colors hover:bg-secondary/70"
              >
                <Icon className="w-5 h-5 text-primary flex-shrink-0" strokeWidth={1.5} />
                <span className="text-sm font-medium text-foreground">{config.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 기타 시설 */}
      {facilities.otherFacilities && facilities.otherFacilities.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground">기타 시설</h3>
          <div className="flex flex-wrap gap-2">
            {facilities.otherFacilities.map((facility, index) => (
              <Badge key={index} variant="outline" className="text-sm">
                {facility}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

