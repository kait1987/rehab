"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MergedExercise } from "@/types/body-part-merge";

interface ExerciseTimerModalProps {
  isOpen: boolean;
  exercise: MergedExercise | null;
  hasNext: boolean;
  onClose: () => void;
  onNext: () => void;
  onDone?: () => void;
}

type TimerMode = "idle" | "running" | "paused" | "finished" | "done";

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
  const [showInfo, setShowInfo] = useState(false); // 🆕 도움말 표시 상태

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

  // 초기화 및 운동 변경 감지
  useEffect(() => {
    if (isOpen && exercise) {
      // 초기 시간 설정 (분 -> 초 변환)
      const durationSec = (exercise.durationMinutes || 0) * 60;
      setTimeLeft(durationSec);
      setMode("idle");
      setShowInfo(false); // 초기화
      originalTitleRef.current = document.title;
    }

    return () => {
      stopTimer();
      releaseWakeLock();
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    };
  }, [isOpen, exercise, releaseWakeLock]);

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

  // 타이머 로직
  const startTimer = () => {
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
    }, 100); // 0.1초마다 체크하여 반응성 향상
  };

  const pauseTimer = () => {
    setMode("paused");
    stopTimer();
    releaseWakeLock();
  };

  const resetTimer = () => {
    if (!exercise) return;
    const durationSec = (exercise.durationMinutes || 0) * 60;
    setTimeLeft(durationSec);
    setMode("idle");
    stopTimer();
    releaseWakeLock();
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClose = () => {
    stopTimer();
    releaseWakeLock();
    if (originalTitleRef.current) {
      document.title = originalTitleRef.current;
    }
    onClose();
  };

  if (!exercise) return null;

  const hasDuration = (exercise.durationMinutes || 0) > 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // YouTube Embed URL
  const getYouTubeEmbedUrl = (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&showinfo=0`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden bg-background">
        {/* 헤더 (닫기 버튼 포함) */}
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

        {/* 비디오 영역 */}
        <div className="aspect-video bg-black relative overflow-hidden">
          {/* 🆕 도움말 오버레이 */}
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
          ) : exercise.videoUrl ? (
            <iframe
              src={getYouTubeEmbedUrl(exercise.videoUrl)}
              title={exercise.exerciseTemplateName}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <p>영상 없음</p>
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
                {hasDuration ? (
                  `${minutes}:${seconds.toString().padStart(2, "0")}`
                ) : (
                  <span className="text-4xl text-muted-foreground">
                    시간 정보 없음
                  </span>
                )}
              </div>

              {/* 컨트롤 버튼 */}
              <div className="flex items-center gap-4 w-full max-w-xs mb-6">
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
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-14 w-14 rounded-full"
                      onClick={resetTimer}
                      disabled={!hasDuration}
                    >
                      <RotateCcw className="h-6 w-6" />
                    </Button>

                    {mode === "running" ? (
                      <Button
                        size="icon"
                        className="h-20 w-20 rounded-full shadow-lg"
                        onClick={pauseTimer}
                      >
                        <Pause className="h-10 w-10 fill-current" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        className="h-20 w-20 rounded-full shadow-lg"
                        onClick={startTimer}
                        disabled={!hasDuration}
                      >
                        <Play className="h-10 w-10 fill-current ml-1" />
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
