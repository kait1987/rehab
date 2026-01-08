/**
 * @file gym-operating-hours.tsx
 * @description 헬스장 운영시간 컴포넌트
 * 
 * 헬스장의 운영시간을 요일별로 표시합니다.
 * 
 * 주요 기능:
 * - 요일별 운영시간 표시
 * - 휴무일 표시
 * - 브레이크 타임 표시 (notes 필드)
 * - 오늘 요일 강조 표시
 * 
 * @dependencies
 * - @/components/ui/card: Card 컴포넌트
 * - @/components/ui/badge: Badge 컴포넌트
 * - @/lib/constants/operating-hours: DAY_NAMES 상수
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DAY_NAMES } from '@/lib/constants/operating-hours';
import type { OperatingHours } from '@/types/operating-hours';

interface GymOperatingHoursProps {
  hours: OperatingHours[];
}

export function GymOperatingHours({ hours }: GymOperatingHoursProps) {
  const today = new Date().getDay();

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-foreground">운영시간</h2>

      <div className="space-y-2">
        {hours.map((hour) => (
          <div
            key={hour.dayOfWeek}
            className={`flex justify-between items-center p-3 rounded-lg transition-colors ${
              hour.dayOfWeek === today
                ? 'bg-primary/10 border-l-4 border-primary'
                : 'bg-secondary/30'
            }`}
          >
            <span className="font-medium min-w-[40px] text-foreground">
              {DAY_NAMES[hour.dayOfWeek]}
            </span>

            <div className="flex-1 mx-4 text-right">
              {hour.isClosed ? (
                <Badge variant="secondary">휴무</Badge>
              ) : (
                <span className="text-sm text-foreground">
                  {hour.openTime || '--'} - {hour.closeTime || '--'}
                </span>
              )}
            </div>

            {hour.notes && (
              <span className="text-xs text-muted-foreground max-w-[120px] text-right">
                {hour.notes}
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

