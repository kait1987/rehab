"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { MergedExercise } from "@/types/body-part-merge";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  Square,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ExerciseTimerModalProps {
  isOpen: boolean;
  exercise: MergedExercise | null;
  hasNext: boolean;
  onClose: () => void;
  onNext: () => void;
  onDone?: () => void;
}

type TimerMode = "idle" | "running" | "paused" | "finished" | "done";

// 기본 운동 시간 (분)
const DEFAULT_DURATION_MINUTES = 10;

export function ExerciseTimerModal({
  isOpen,
  exercise,
  hasNext,
  onClose,
  onNext,
  onDone,
}: ExerciseTimerModalProps) {
  const [mode, setMode] = useState<TimerMode>("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // 타이머 참조
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const originalTitleRef = useRef<string>("");

  // Wake Lock 관리
  const requestWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator) {
      try {
        const lock = await navigator.wakeLock.request("screen");
        setWakeLock(lock);
        lock.addEventListener("release", () => {
          setWakeLock(null);
        });
      } catch (err) {
        console.error("Wake Lock failed:", err);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
      } catch (err) {
        console.error("Wake Lock release failed:", err);
      }
    }
  }, [wakeLock]);

  // 타이머 정지 함수 (먼저 정의)
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 초기화 및 운동 변경 감지
  useEffect(() => {
    if (isOpen && exercise) {
      // 초기 시간 설정 (분 -> 초 변환, 없으면 기본값 사용)
      const durationMin = exercise.durationMinutes || DEFAULT_DURATION_MINUTES;
      const durationSec = durationMin * 60;
      setTimeLeft(durationSec);
      setMode("idle");
      setShowInfo(false);
      originalTitleRef.current = document.title;
    }

    return () => {
      stopTimer();
      releaseWakeLock();
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    };
  }, [isOpen, exercise, releaseWakeLock, stopTimer]);

  // 탭 타이틀 업데이트
  useEffect(() => {
    if (!isOpen || !exercise) return;

    if (mode === "done") {
      document.title = `완료 - ${exercise.exerciseTemplateName}`;
      return;
    }

    if (mode === "running" || mode === "paused" || mode === "finished") {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;
      document.title = `${timeString} - ${exercise.exerciseTemplateName}`;
    } else {
      document.title = originalTitleRef.current;
    }
  }, [timeLeft, mode, isOpen, exercise]);

  // Visibility Change 핸들러 (화면 꺼짐/켜짐 대응)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && mode === "running") {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [mode, requestWakeLock]);

  // 타이머 시작
  const startTimer = useCallback(() => {
    if (timeLeft <= 0) return;

    setMode("running");
    requestWakeLock();

    const now = Date.now();
    endTimeRef.current = now + timeLeft * 1000;

    timerRef.current = setInterval(() => {
      const currentNow = Date.now();
      const remaining = Math.ceil((endTimeRef.current! - currentNow) / 1000);

      if (remaining <= 0) {
        setTimeLeft(0);
        setMode("finished");
        stopTimer();
        releaseWakeLock();

        // 타이머 완료 2초 후 자동으로 다음 운동 또는 종료
        setTimeout(() => {
          if (hasNext) {
            onNext();
          } else {
            setMode("done");
            if (onDone) onDone();
            // 완료 메시지 표시 후 1.5초 뒤 자동 닫기
            setTimeout(() => {
              if (originalTitleRef.current) {
                document.title = originalTitleRef.current;
              }
              onClose();
            }, 1500);
          }
        }, 2000);
      } else {
        setTimeLeft(remaining);
      }
    }, 100);
  }, [
    timeLeft,
    requestWakeLock,
    stopTimer,
    releaseWakeLock,
    hasNext,
    onNext,
    onDone,
    onClose,
  ]);

  // 일시정지
  const pauseTimer = useCallback(() => {
    setMode("paused");
    stopTimer();
    releaseWakeLock();
  }, [stopTimer, releaseWakeLock]);

  // 재개
  const resumeTimer = useCallback(() => {
    if (timeLeft <= 0) return;
    startTimer();
  }, [timeLeft, startTimer]);

  // 리셋
  const resetTimer = useCallback(() => {
    if (!exercise) return;
    const durationMin = exercise.durationMinutes || DEFAULT_DURATION_MINUTES;
    const durationSec = durationMin * 60;
    setTimeLeft(durationSec);
    setMode("idle");
    stopTimer();
    releaseWakeLock();
  }, [exercise, stopTimer, releaseWakeLock]);

  // 종료 (타이머 중지하고 idle로)
  const stopExercise = useCallback(() => {
    stopTimer();
    releaseWakeLock();
    setMode("idle");
    if (!exercise) return;
    const durationMin = exercise.durationMinutes || DEFAULT_DURATION_MINUTES;
    const durationSec = durationMin * 60;
    setTimeLeft(durationSec);
  }, [exercise, stopTimer, releaseWakeLock]);

  // 모달 닫기
  const handleClose = useCallback(() => {
    stopTimer();
    releaseWakeLock();
    if (originalTitleRef.current) {
      document.title = originalTitleRef.current;
    }
    onClose();
  }, [stopTimer, releaseWakeLock, onClose]);

  if (!exercise) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // 이미지/GIF URL 결정 (우선순위: gifUrl > imageUrl)
  const mediaUrl = exercise.gifUrl || exercise.imageUrl;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden bg-background">
        {/* 헤더 */}
        <div className="p-4 flex items-center justify-between border-b">
          <DialogTitle className="text-lg font-semibold truncate pr-4 flex-1">
            {exercise.exerciseTemplateName}
          </DialogTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInfo(!showInfo)}
              className={cn(
                "h-8 w-8",
                showInfo && "bg-accent text-accent-foreground",
              )}
              title="운동 설명 보기"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* 이미지/GIF 영역 */}
        <div className="aspect-video bg-black relative overflow-hidden">
          {/* 도움말 오버레이 */}
          {showInfo && (
            <div className="absolute inset-0 z-10 bg-background/95 p-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-5">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">운동 설명</h4>
                  <p className="text-sm text-muted-foreground">
                    {exercise.description || "설명이 없습니다."}
                  </p>
                </div>

                {exercise.instructions && (
                  <div>
                    <h4 className="font-semibold mb-1">운동 방법</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {exercise.instructions}
                    </p>
                  </div>
                )}

                {exercise.precautions && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-yellow-500 mb-1">
                          주의사항
                        </p>
                        <p className="text-sm text-yellow-500/90">
                          {exercise.precautions}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === "done" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/10 text-green-500">
              <CheckCircle2 className="h-16 w-16 mb-4" />
              <p className="text-xl font-bold">운동 완료!</p>
            </div>
          ) : mediaUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={mediaUrl}
              alt={exercise.exerciseTemplateName}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <p>이미지 없음</p>
            </div>
          )}
        </div>

        {/* 타이머 및 컨트롤 영역 */}
        <div className="p-6 flex flex-col items-center">
          {mode === "done" ? (
            <div className="w-full py-8 text-center">
              <p className="text-muted-foreground mb-6">
                모든 운동을 마쳤습니다.
                <br />
                수고하셨습니다!
              </p>
              <Button onClick={handleClose} size="lg" className="w-full">
                닫기
              </Button>
            </div>
          ) : (
            <>
              {/* 시간 표시 */}
              <div className="text-6xl font-bold tabular-nums tracking-tight mb-8">
                {`${minutes}:${seconds.toString().padStart(2, "0")}`}
              </div>

              {/* 컨트롤 버튼 */}
              <div className="flex items-center justify-center gap-4 w-full max-w-xs mb-6">
                {mode === "finished" ? (
                  <div className="w-full text-center py-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3 animate-bounce" />
                    <p className="text-lg font-medium text-green-500">
                      {hasNext ? "잠시 후 다음 운동으로..." : "운동 완료!"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hasNext ? "2초 후 자동 전환됩니다" : "수고하셨습니다"}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 리셋 버튼 */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-14 w-14 rounded-full"
                      onClick={resetTimer}
                    >
                      <RotateCcw className="h-6 w-6" />
                    </Button>

                    {/* 메인 버튼: 시작/종료 토글 */}
                    {mode === "idle" ? (
                      <Button
                        size="icon"
                        className="h-20 w-20 rounded-full shadow-lg bg-primary hover:bg-primary/90"
                        onClick={startTimer}
                      >
                        <Play className="h-10 w-10 fill-current ml-1" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        className="h-20 w-20 rounded-full shadow-lg bg-destructive hover:bg-destructive/90"
                        onClick={stopExercise}
                      >
                        <Square className="h-8 w-8 fill-current" />
                      </Button>
                    )}

                    {/* 일시정지/재개 버튼 */}
                    {(mode === "running" || mode === "paused") && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-14 w-14 rounded-full"
                        onClick={mode === "running" ? pauseTimer : resumeTimer}
                      >
                        {mode === "running" ? (
                          <Pause className="h-6 w-6" />
                        ) : (
                          <Play className="h-6 w-6 ml-0.5" />
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* 운동 정보 */}
              <div className="flex gap-2 text-sm text-muted-foreground">
                {exercise.sets && (
                  <Badge variant="secondary">{exercise.sets}세트</Badge>
                )}
                {exercise.reps && (
                  <Badge variant="secondary">{exercise.reps}회</Badge>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
