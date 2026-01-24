'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ExerciseTimerModal } from './exercise-timer-modal';
import { SessionProgressHeader } from './session-progress-bar';
import { SessionResultModal } from './session-result-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  ListOrdered,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useSessionState, type SessionResult, type UserFeedback } from '@/hooks/use-session-state';
import type { MergedExercise } from '@/types/body-part-merge';

interface BodyPartInfo {
  bodyPartId: string;
  bodyPartName: string;
  painBefore: number;
}

interface SessionPlayerProps {
  /** 운동 목록 */
  exercises: MergedExercise[];
  /** 코스 ID */
  courseId?: string;
  /** 코스 이름 */
  courseName?: string;
  /** 부위별 통증 정보 */
  bodyParts: BodyPartInfo[];
  /** 연속 운동 일수 */
  streak?: number;
  /** 세션 완료 콜백 */
  onComplete: (result: SessionResult, feedback: UserFeedback) => Promise<void>;
  /** 세션 종료 콜백 */
  onExit: () => void;
  /** 자동 시작 여부 */
  autoStart?: boolean;
}

/**
 * 세션 플레이어 컴포넌트
 *
 * 전체 운동 코스를 연속으로 실행하고, 진행 상황을 추적하며,
 * 완료 후 결과 및 코칭 피드백을 제공합니다.
 */
export function SessionPlayer({
  exercises,
  courseId,
  courseName = '재활 운동 코스',
  bodyParts,
  streak = 0,
  onComplete,
  onExit,
  autoStart = false,
}: SessionPlayerProps) {
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [sessionResultData, setSessionResultData] = useState<SessionResult | null>(null);

  // 세션 상태 관리
  const session = useSessionState({
    exercises,
    courseId,
    onSessionComplete: (result) => {
      setSessionResultData(result);
      setIsTimerOpen(false);
      setIsResultOpen(true);
    },
  });

  // 자동 시작
  useEffect(() => {
    if (autoStart && session.status === 'idle') {
      handleStartSession();
    }
  }, [autoStart, session.status]);

  // 세션 시작
  const handleStartSession = useCallback(() => {
    session.startSession();
    setIsTimerOpen(true);
  }, [session]);

  // 다음 운동 (타이머 모달에서 호출)
  const handleNextExercise = useCallback(() => {
    session.nextExercise('completed');
  }, [session]);

  // 운동 건너뛰기
  const handleSkipExercise = useCallback(() => {
    session.skipExercise();
  }, [session]);

  // 이전 운동
  const handlePreviousExercise = useCallback(() => {
    session.previousExercise();
  }, [session]);

  // 타이머 모달 닫기
  const handleTimerClose = useCallback(() => {
    if (session.status === 'running') {
      session.pauseSession();
    }
    setIsTimerOpen(false);
  }, [session]);

  // 타이머 재개
  const handleResumeTimer = useCallback(() => {
    session.resumeSession();
    setIsTimerOpen(true);
  }, [session]);

  // 세션 종료 확인
  const handleExitRequest = useCallback(() => {
    if (session.status === 'running' || session.status === 'paused') {
      setShowExitConfirm(true);
    } else {
      onExit();
    }
  }, [session.status, onExit]);

  // 세션 강제 종료
  const handleConfirmExit = useCallback(() => {
    session.resetSession();
    setShowExitConfirm(false);
    onExit();
  }, [session, onExit]);

  // 결과 저장
  const handleSaveResult = useCallback(
    async (feedback: UserFeedback) => {
      if (sessionResultData) {
        await onComplete(sessionResultData, feedback);
        setIsResultOpen(false);
        onExit();
      }
    },
    [sessionResultData, onComplete, onExit]
  );

  // 결과 모달 닫기 (저장하지 않음)
  const handleCloseResult = useCallback(() => {
    setIsResultOpen(false);
    onExit();
  }, [onExit]);

  // 특정 운동으로 점프
  const handleJumpToExercise = useCallback(
    (index: number) => {
      session.jumpToExercise(index);
      setShowExerciseList(false);
      if (!isTimerOpen) {
        setIsTimerOpen(true);
      }
    },
    [session, isTimerOpen]
  );

  // 섹션별 분류
  const sections = useMemo(() => {
    return {
      warmup: exercises.filter((ex) => ex.section === 'warmup'),
      main: exercises.filter((ex) => ex.section === 'main'),
      cooldown: exercises.filter((ex) => ex.section === 'cooldown'),
    };
  }, [exercises]);

  const isSessionActive = session.status === 'running' || session.status === 'paused';

  return (
    <div className="flex flex-col h-full">
      {/* 프로그레스 헤더 */}
      {isSessionActive && (
        <SessionProgressHeader
          currentIndex={session.currentIndex}
          totalExercises={exercises.length}
          progressPercentage={session.progressPercentage}
          formattedTime={session.formattedSessionTime}
          courseName={courseName}
          onBack={handleExitRequest}
        />
      )}

      {/* 메인 컨텐츠 */}
      <div className="flex-1 overflow-auto p-4">
        {/* 대기 상태 (세션 미시작) */}
        {session.status === 'idle' && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{courseName}</h2>
              <p className="text-muted-foreground">
                {exercises.length}개 운동 준비 완료
              </p>
            </div>

            {/* 섹션 요약 */}
            <div className="flex gap-3 text-sm">
              {sections.warmup.length > 0 && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                  준비 {sections.warmup.length}개
                </span>
              )}
              {sections.main.length > 0 && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">
                  메인 {sections.main.length}개
                </span>
              )}
              {sections.cooldown.length > 0 && (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                  마무리 {sections.cooldown.length}개
                </span>
              )}
            </div>

            <Button size="lg" onClick={handleStartSession} className="gap-2">
              <Play className="h-5 w-5" />
              세션 시작
            </Button>

            <Button variant="ghost" onClick={onExit}>
              돌아가기
            </Button>
          </div>
        )}

        {/* 일시정지 상태 */}
        {session.status === 'paused' && !isTimerOpen && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">일시정지</h2>
              <p className="text-muted-foreground">
                {session.currentExercise?.exerciseTemplateName}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {session.currentIndex + 1} / {exercises.length}
              </p>
            </div>

            <div className="flex gap-3">
              <Button size="lg" onClick={handleResumeTimer} className="gap-2">
                <Play className="h-5 w-5" />
                계속하기
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowExerciseList(!showExerciseList)}
                className="gap-2"
              >
                <ListOrdered className="h-5 w-5" />
                운동 목록
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={handleExitRequest}
              className="text-destructive"
            >
              세션 종료
            </Button>
          </div>
        )}

        {/* 운동 목록 (일시정지 시 표시) */}
        {showExerciseList && session.status === 'paused' && (
          <Card className="mt-4">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">운동 목록</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExerciseList(false)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1 max-h-60 overflow-auto">
                {exercises.map((ex, index) => {
                  const isCompleted = session.completionLogs.some(
                    (log) => log.exerciseTemplateId === ex.exerciseTemplateId
                  );
                  const isCurrent = index === session.currentIndex;
                  return (
                    <button
                      key={`${ex.exerciseTemplateId}-${index}`}
                      onClick={() => handleJumpToExercise(index)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                        isCurrent
                          ? 'bg-primary text-primary-foreground'
                          : isCompleted
                            ? 'bg-muted text-muted-foreground'
                            : 'hover:bg-muted'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-6 text-center opacity-60">
                          {index + 1}
                        </span>
                        <span className="flex-1 truncate">
                          {ex.exerciseTemplateName}
                        </span>
                        {ex.durationMinutes && (
                          <span className="text-xs opacity-60">
                            {ex.durationMinutes}분
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 하단 컨트롤 (세션 진행 중) */}
      {isSessionActive && !isTimerOpen && (
        <div className="border-t p-4 bg-background">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousExercise}
              disabled={!session.hasPrevious}
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button size="lg" onClick={handleResumeTimer} className="gap-2 px-8">
              <Play className="h-5 w-5" />
              계속하기
            </Button>

            <Button variant="ghost" size="icon" onClick={handleSkipExercise}>
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* 운동 타이머 모달 */}
      <ExerciseTimerModal
        isOpen={isTimerOpen}
        exercise={session.currentExercise}
        hasNext={session.hasNext}
        onClose={handleTimerClose}
        onNext={handleNextExercise}
        onDone={() => {
          // 마지막 운동 완료 시 자동으로 결과 모달 표시
          // useSessionState의 onSessionComplete 콜백에서 처리됨
        }}
      />

      {/* 세션 결과 모달 */}
      {sessionResultData && (
        <SessionResultModal
          isOpen={isResultOpen}
          sessionResult={sessionResultData}
          bodyParts={bodyParts}
          streak={streak}
          onSave={handleSaveResult}
          onClose={handleCloseResult}
        />
      )}

      {/* 종료 확인 다이얼로그 */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>세션을 종료하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              진행 중인 운동 기록이 저장되지 않습니다.
              <br />
              완료한 운동: {session.completionLogs.length} / {exercises.length}개
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>계속하기</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              종료
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
