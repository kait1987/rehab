'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, Circle, Loader2 } from 'lucide-react';

interface SectionStats {
  total: number;
  completed: number;
}

interface SessionProgressBarProps {
  /** 현재 운동 인덱스 (0-based) */
  currentIndex: number;
  /** 전체 운동 수 */
  totalExercises: number;
  /** 전체 진행률 (0-100) */
  progressPercentage: number;
  /** 섹션별 통계 */
  sectionProgress: {
    warmup: SectionStats;
    main: SectionStats;
    cooldown: SectionStats;
  };
  /** 현재 섹션 */
  currentSection: 'warmup' | 'main' | 'cooldown' | null;
  /** 세션 경과 시간 (포맷팅된 문자열) */
  formattedTime: string;
  /** 간소화 모드 (세션 헤더용) */
  compact?: boolean;
  className?: string;
}

const SECTION_LABELS = {
  warmup: '준비',
  main: '메인',
  cooldown: '마무리',
} as const;

const SECTION_COLORS = {
  warmup: {
    active: 'bg-blue-500',
    completed: 'bg-blue-400',
    pending: 'bg-blue-200 dark:bg-blue-800',
  },
  main: {
    active: 'bg-primary',
    completed: 'bg-primary/80',
    pending: 'bg-primary/20',
  },
  cooldown: {
    active: 'bg-green-500',
    completed: 'bg-green-400',
    pending: 'bg-green-200 dark:bg-green-800',
  },
} as const;

/**
 * 섹션 상태 표시 컴포넌트
 */
function SectionIndicator({
  section,
  stats,
  isCurrent,
  isCompleted,
}: {
  section: 'warmup' | 'main' | 'cooldown';
  stats: SectionStats;
  isCurrent: boolean;
  isCompleted: boolean;
}) {
  const colors = SECTION_COLORS[section];
  const label = SECTION_LABELS[section];

  // 섹션이 없는 경우 (운동 0개)
  if (stats.total === 0) return null;

  const sectionCompleted = stats.completed >= stats.total;
  const hasProgress = stats.completed > 0;

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all',
        isCurrent && 'ring-2 ring-offset-1 ring-offset-background',
        isCurrent && section === 'warmup' && 'ring-blue-500',
        isCurrent && section === 'main' && 'ring-primary',
        isCurrent && section === 'cooldown' && 'ring-green-500',
        sectionCompleted
          ? cn(colors.completed, 'text-white')
          : hasProgress
            ? cn(colors.active, 'text-white')
            : cn(colors.pending, 'text-muted-foreground')
      )}
    >
      {sectionCompleted ? (
        <Check className="h-3 w-3" />
      ) : isCurrent ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Circle className="h-3 w-3" />
      )}
      <span>{label}</span>
      <span className="opacity-80">
        ({stats.completed}/{stats.total})
      </span>
    </div>
  );
}

/**
 * 세션 진행률 표시 컴포넌트
 */
export function SessionProgressBar({
  currentIndex,
  totalExercises,
  progressPercentage,
  sectionProgress,
  currentSection,
  formattedTime,
  compact = false,
  className,
}: SessionProgressBarProps) {
  // 섹션 완료 여부 판단
  const isSectionCompleted = (section: 'warmup' | 'main' | 'cooldown') => {
    const stats = sectionProgress[section];
    return stats.completed >= stats.total;
  };

  // 간소화 모드 (세션 헤더용)
  if (compact) {
    return (
      <div className={cn('w-full space-y-1', className)}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {currentIndex + 1} / {totalExercises}
          </span>
          <span>{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-1.5" />
      </div>
    );
  }

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* 프로그레스 바 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            운동 {currentIndex + 1} / {totalExercises}
          </span>
          <span className="text-muted-foreground font-mono">{formattedTime}</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-end">
          <span className="text-xs text-muted-foreground">{progressPercentage}% 완료</span>
        </div>
      </div>

      {/* 섹션별 진행 상태 */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {(['warmup', 'main', 'cooldown'] as const).map((section) => (
          <SectionIndicator
            key={section}
            section={section}
            stats={sectionProgress[section]}
            isCurrent={currentSection === section}
            isCompleted={isSectionCompleted(section)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 세션 헤더용 간소화 진행 바
 */
export function SessionProgressHeader({
  currentIndex,
  totalExercises,
  progressPercentage,
  formattedTime,
  courseName,
  onBack,
}: {
  currentIndex: number;
  totalExercises: number;
  progressPercentage: number;
  formattedTime: string;
  courseName?: string;
  onBack?: () => void;
}) {
  return (
    <div className="w-full bg-background/95 backdrop-blur-sm border-b px-4 py-2 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 hover:bg-muted rounded-md transition-colors"
            aria-label="뒤로 가기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}

        <div className="flex-1 min-w-0">
          {courseName && (
            <p className="text-sm font-medium truncate">{courseName}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {currentIndex + 1}/{totalExercises}
            </span>
            <span>•</span>
            <span className="font-mono">{formattedTime}</span>
          </div>
        </div>

        <div className="w-24">
          <Progress value={progressPercentage} className="h-1.5" />
        </div>
      </div>
    </div>
  );
}
