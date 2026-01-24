'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Calendar,
  AlertCircle,
  Heart,
  type LucideIcon,
} from 'lucide-react';
import type { FeedbackItem, FeedbackType, FeedbackResult } from '@/lib/coaching/generate-feedback';

/**
 * 피드백 타입별 아이콘 매핑
 */
const FEEDBACK_ICONS: Record<FeedbackType, LucideIcon> = {
  completion: Heart,
  pain: TrendingDown,
  streak: Flame,
  recommendation: Lightbulb,
  motivation: Heart,
  bodyPart: AlertCircle,
  section: Calendar,
  time: Calendar,
};

/**
 * 피드백 타입별 스타일
 */
const FEEDBACK_STYLES: Record<
  FeedbackType,
  { bg: string; border: string; icon: string }
> = {
  completion: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
  },
  pain: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  streak: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  recommendation: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  motivation: {
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    border: 'border-pink-200 dark:border-pink-800',
    icon: 'text-pink-600 dark:text-pink-400',
  },
  bodyPart: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
  section: {
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    border: 'border-slate-200 dark:border-slate-800',
    icon: 'text-slate-600 dark:text-slate-400',
  },
  time: {
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    border: 'border-slate-200 dark:border-slate-800',
    icon: 'text-slate-600 dark:text-slate-400',
  },
};

/**
 * 단일 피드백 아이템 컴포넌트
 */
function FeedbackItemCard({
  item,
  compact = false,
}: {
  item: FeedbackItem;
  compact?: boolean;
}) {
  const Icon = FEEDBACK_ICONS[item.type];
  const styles = FEEDBACK_STYLES[item.type];

  if (compact) {
    return (
      <div className="flex items-start gap-2 text-sm">
        {item.emoji && <span>{item.emoji}</span>}
        <span>{item.message}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border',
        styles.bg,
        styles.border
      )}
    >
      <div className={cn('mt-0.5', styles.icon)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm flex-1">{item.message}</p>
    </div>
  );
}

interface CoachingFeedbackProps {
  /** 피드백 결과 */
  feedback: FeedbackResult;
  /** 최대 표시 개수 */
  maxItems?: number;
  /** 간소화 모드 */
  compact?: boolean;
  /** 메인 메시지만 표시 */
  mainOnly?: boolean;
  className?: string;
}

/**
 * 코칭 피드백 표시 컴포넌트
 */
export function CoachingFeedback({
  feedback,
  maxItems = 5,
  compact = false,
  mainOnly = false,
  className,
}: CoachingFeedbackProps) {
  const displayItems = feedback.feedbackItems.slice(0, maxItems);

  if (mainOnly) {
    return (
      <div
        className={cn(
          'text-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg',
          className
        )}
      >
        <p className="text-lg font-medium">{feedback.mainMessage}</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {displayItems.map((item, index) => (
          <FeedbackItemCard key={index} item={item} compact />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {displayItems.map((item, index) => (
        <FeedbackItemCard key={index} item={item} />
      ))}
    </div>
  );
}

/**
 * 코칭 피드백 카드 (결과 모달용)
 */
export function CoachingFeedbackCard({
  feedback,
  maxItems = 4,
  className,
}: {
  feedback: FeedbackResult;
  maxItems?: number;
  className?: string;
}) {
  const displayItems = feedback.feedbackItems.slice(0, maxItems);
  const { summary } = feedback;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          코칭 피드백
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 메인 메시지 */}
        <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg text-center">
          <p className="font-medium">{feedback.mainMessage}</p>
        </div>

        {/* 피드백 아이템들 */}
        <div className="space-y-2">
          {displayItems.slice(1).map((item, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              {item.emoji && <span className="text-base">{item.emoji}</span>}
              <span className="text-muted-foreground">{item.message}</span>
            </div>
          ))}
        </div>

        {/* 요약 */}
        <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {summary.shouldRest && (
              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded">
                휴식 권장
              </span>
            )}
            <span className="px-2 py-0.5 bg-muted rounded">
              다음 강도:{' '}
              {summary.intensityRecommendation === 'higher'
                ? '높이기'
                : summary.intensityRecommendation === 'lower'
                  ? '낮추기'
                  : '유지'}
            </span>
          </div>
          <TrendingIndicator tone={summary.overallTone} />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 전체 톤 표시기
 */
function TrendingIndicator({
  tone,
}: {
  tone: 'positive' | 'neutral' | 'encouraging';
}) {
  switch (tone) {
    case 'positive':
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingUp className="h-3 w-3" />
          <span>좋은 흐름</span>
        </div>
      );
    case 'neutral':
      return (
        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
          <Minus className="h-3 w-3" />
          <span>안정적</span>
        </div>
      );
    case 'encouraging':
      return (
        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
          <Heart className="h-3 w-3" />
          <span>화이팅!</span>
        </div>
      );
  }
}

/**
 * 간단한 피드백 리스트 (이모지 + 메시지)
 */
export function SimpleFeedbackList({
  messages,
  className,
}: {
  messages: string[];
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {messages.map((message, index) => (
        <p key={index} className="text-sm text-muted-foreground">
          {message}
        </p>
      ))}
    </div>
  );
}
