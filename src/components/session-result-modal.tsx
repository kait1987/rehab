'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Clock,
  CheckCircle2,
  SkipForward,
  Flame,
  Loader2,
} from 'lucide-react';
import { PainAfterInput } from './pain-after-input';
import { CoachingFeedbackCard } from './coaching-feedback';
import { generateFeedback, type FeedbackResult } from '@/lib/coaching/generate-feedback';
import type { SessionResult, UserFeedback } from '@/hooks/use-session-state';

interface BodyPartInfo {
  bodyPartId: string;
  bodyPartName: string;
  painBefore: number;
}

interface SessionResultModalProps {
  /** 모달 열림 상태 */
  isOpen: boolean;
  /** 세션 결과 데이터 */
  sessionResult: SessionResult;
  /** 운동 대상 부위 */
  bodyParts: BodyPartInfo[];
  /** 연속 운동 일수 */
  streak?: number;
  /** 저장 콜백 */
  onSave: (feedback: UserFeedback) => Promise<void>;
  /** 닫기 콜백 */
  onClose: () => void;
}

/**
 * 시간 포맷팅 (초 -> MM:SS 또는 HH:MM:SS)
 */
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}시간 ${mins}분 ${secs}초`;
  }
  if (mins > 0) {
    return `${mins}분 ${secs}초`;
  }
  return `${secs}초`;
}

/**
 * 결과 통계 카드
 */
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  variant = 'default',
}: {
  icon: typeof Trophy;
  label: string;
  value: string | number;
  subValue?: string;
  variant?: 'default' | 'success' | 'warning';
}) {
  return (
    <Card
      className={cn(
        'border-2',
        variant === 'success' && 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30',
        variant === 'warning' && 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/30'
      )}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            variant === 'success' && 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400',
            variant === 'warning' && 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400',
            variant === 'default' && 'bg-primary/10 text-primary'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-bold truncate">{value}</p>
          {subValue && (
            <p className="text-xs text-muted-foreground">{subValue}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 세션 결과 모달
 */
export function SessionResultModal({
  isOpen,
  sessionResult,
  bodyParts,
  streak = 0,
  onSave,
  onClose,
}: SessionResultModalProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [painAfter, setPainAfter] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const bp of bodyParts) {
      initial[bp.bodyPartName] = bp.painBefore;
    }
    return initial;
  });
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 피드백 생성
  const feedback: FeedbackResult = useMemo(() => {
    const painBefore: Record<string, number> = {};
    for (const bp of bodyParts) {
      painBefore[bp.bodyPartName] = bp.painBefore;
    }

    return generateFeedback({
      sessionResult,
      userFeedback: {
        painAfter,
        notes: notes || undefined,
      },
      painBefore,
      streak,
      bodyParts: bodyParts.map((bp) => bp.bodyPartName),
    });
  }, [sessionResult, painAfter, notes, bodyParts, streak]);

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave({
        painAfter,
        notes: notes || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  }, [onSave, painAfter, notes]);

  const { completionRate, completedExercises, skippedExercises, totalExercises } =
    sessionResult;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-2 text-4xl">
            {completionRate === 100 ? '🎉' : completionRate >= 50 ? '💪' : '🤗'}
          </div>
          <DialogTitle className="text-xl">
            {completionRate === 100
              ? '운동 완료!'
              : completionRate >= 50
                ? '수고하셨어요!'
                : '조금씩 나아가고 있어요!'}
          </DialogTitle>
          <DialogDescription>
            오늘의 운동 결과를 확인하세요
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">결과</TabsTrigger>
            <TabsTrigger value="feedback">피드백</TabsTrigger>
            <TabsTrigger value="pain">통증</TabsTrigger>
          </TabsList>

          {/* 결과 요약 탭 */}
          <TabsContent value="summary" className="space-y-4 mt-4">
            {/* 통계 카드들 */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={CheckCircle2}
                label="완료한 운동"
                value={`${completedExercises}/${totalExercises}`}
                subValue={`${completionRate}% 완료`}
                variant={completionRate >= 80 ? 'success' : 'default'}
              />
              <StatCard
                icon={Clock}
                label="운동 시간"
                value={formatDuration(sessionResult.sessionDuration)}
              />
              {skippedExercises > 0 && (
                <StatCard
                  icon={SkipForward}
                  label="건너뛴 운동"
                  value={`${skippedExercises}개`}
                  variant="warning"
                />
              )}
              {streak > 0 && (
                <StatCard
                  icon={Flame}
                  label="연속 운동"
                  value={`${streak}일`}
                  variant="success"
                />
              )}
            </div>

            {/* 섹션별 현황 */}
            <Card>
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium">섹션별 현황</p>
                <div className="space-y-1.5">
                  {(['warmup', 'main', 'cooldown'] as const).map((section) => {
                    const stats = sessionResult.sectionStats[section];
                    if (stats.total === 0) return null;
                    const percent = Math.round(
                      (stats.completed / stats.total) * 100
                    );
                    return (
                      <div key={section} className="flex items-center gap-2">
                        <span className="text-xs w-12 text-muted-foreground">
                          {section === 'warmup'
                            ? '준비'
                            : section === 'main'
                              ? '메인'
                              : '마무리'}
                        </span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all',
                              section === 'warmup' && 'bg-blue-500',
                              section === 'main' && 'bg-primary',
                              section === 'cooldown' && 'bg-green-500'
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs w-16 text-right">
                          {stats.completed}/{stats.total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 코칭 피드백 탭 */}
          <TabsContent value="feedback" className="space-y-4 mt-4">
            <CoachingFeedbackCard feedback={feedback} maxItems={5} />

            {/* 메모 입력 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">메모 (선택)</p>
              <Textarea
                placeholder="오늘 운동에 대한 메모를 남겨보세요..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {notes.length}/500
              </p>
            </div>
          </TabsContent>

          {/* 통증 입력 탭 */}
          <TabsContent value="pain" className="mt-4">
            {bodyParts.length > 0 ? (
              <PainAfterInput
                bodyParts={bodyParts}
                onChange={setPainAfter}
                initialValues={painAfter}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                통증을 기록할 부위가 없습니다.
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            나중에
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                결과 저장
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
