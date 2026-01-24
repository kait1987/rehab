'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { MergedExercise } from '@/types/body-part-merge';

/**
 * 개별 운동 완료 기록
 */
export interface ExerciseCompletionData {
  exerciseTemplateId: string;
  exerciseTemplateName: string;
  section: 'warmup' | 'main' | 'cooldown';
  status: 'completed' | 'skipped' | 'modified';
  plannedDuration: number; // 예정 시간 (초)
  actualDuration: number; // 실제 소요 시간 (초)
  completedAt: Date;
}

/**
 * 세션 상태
 */
export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';

/**
 * 세션 결과 데이터
 */
export interface SessionResult {
  totalExercises: number;
  completedExercises: number;
  skippedExercises: number;
  modifiedExercises: number;
  totalPlannedTime: number; // 초
  totalActualTime: number; // 초
  sessionDuration: number; // 전체 세션 경과 시간 (초)
  completionRate: number; // 백분율
  exerciseLogs: ExerciseCompletionData[];
  sectionStats: {
    warmup: { total: number; completed: number };
    main: { total: number; completed: number };
    cooldown: { total: number; completed: number };
  };
}

/**
 * 사용자 피드백 데이터
 */
export interface UserFeedback {
  painAfter: Record<string, number>; // 부위별 통증 (1-10)
  notes?: string;
}

interface UseSessionStateOptions {
  exercises: MergedExercise[];
  courseId?: string;
  onSessionComplete?: (result: SessionResult) => void;
}

export function useSessionState(options: UseSessionStateOptions) {
  const { exercises, courseId, onSessionComplete } = options;

  // 기본 상태
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completionLogs, setCompletionLogs] = useState<ExerciseCompletionData[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionElapsedTime, setSessionElapsedTime] = useState(0); // 초 단위

  // 현재 운동 시작 시간 (실제 소요 시간 계산용)
  const exerciseStartTimeRef = useRef<Date | null>(null);

  // 세션 타이머 인터벌 ref
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 섹션별 분류
  const sections = {
    warmup: exercises.filter(ex => ex.section === 'warmup'),
    main: exercises.filter(ex => ex.section === 'main'),
    cooldown: exercises.filter(ex => ex.section === 'cooldown'),
  };

  // 현재 운동
  const currentExercise = exercises[currentIndex] ?? null;
  const hasNext = currentIndex < exercises.length - 1;
  const hasPrevious = currentIndex > 0;

  // 진행률 계산
  const progressPercentage = exercises.length > 0
    ? Math.round((completionLogs.length / exercises.length) * 100)
    : 0;

  // 섹션별 진행 상태
  const getSectionProgress = useCallback(() => {
    const warmupCompleted = completionLogs.filter(
      log => log.section === 'warmup' && log.status !== 'skipped'
    ).length;
    const mainCompleted = completionLogs.filter(
      log => log.section === 'main' && log.status !== 'skipped'
    ).length;
    const cooldownCompleted = completionLogs.filter(
      log => log.section === 'cooldown' && log.status !== 'skipped'
    ).length;

    return {
      warmup: { total: sections.warmup.length, completed: warmupCompleted },
      main: { total: sections.main.length, completed: mainCompleted },
      cooldown: { total: sections.cooldown.length, completed: cooldownCompleted },
    };
  }, [completionLogs, sections]);

  // 현재 섹션 판별
  const getCurrentSection = useCallback(() => {
    if (!currentExercise) return null;
    return currentExercise.section;
  }, [currentExercise]);

  // 세션 타이머 시작
  const startSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) return;

    sessionTimerRef.current = setInterval(() => {
      setSessionElapsedTime(prev => prev + 1);
    }, 1000);
  }, []);

  // 세션 타이머 정지
  const stopSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  }, []);

  // 세션 시작
  const startSession = useCallback(() => {
    if (status !== 'idle') return;

    setStatus('running');
    setSessionStartTime(new Date());
    setCurrentIndex(0);
    setCompletionLogs([]);
    setSessionElapsedTime(0);
    exerciseStartTimeRef.current = new Date();
    startSessionTimer();
  }, [status, startSessionTimer]);

  // 세션 일시정지
  const pauseSession = useCallback(() => {
    if (status !== 'running') return;
    setStatus('paused');
    stopSessionTimer();
  }, [status, stopSessionTimer]);

  // 세션 재개
  const resumeSession = useCallback(() => {
    if (status !== 'paused') return;
    setStatus('running');
    startSessionTimer();
  }, [status, startSessionTimer]);

  // 운동 완료 기록
  const completeExercise = useCallback((
    exerciseStatus: 'completed' | 'skipped' | 'modified' = 'completed'
  ) => {
    if (!currentExercise) return;

    const now = new Date();
    const actualDuration = exerciseStartTimeRef.current
      ? Math.floor((now.getTime() - exerciseStartTimeRef.current.getTime()) / 1000)
      : (currentExercise.durationMinutes ?? 3) * 60;

    const log: ExerciseCompletionData = {
      exerciseTemplateId: currentExercise.exerciseTemplateId,
      exerciseTemplateName: currentExercise.exerciseTemplateName,
      section: currentExercise.section,
      status: exerciseStatus,
      plannedDuration: (currentExercise.durationMinutes ?? 3) * 60,
      actualDuration,
      completedAt: now,
    };

    setCompletionLogs(prev => [...prev, log]);
    exerciseStartTimeRef.current = new Date();
  }, [currentExercise]);

  // 다음 운동으로 이동
  const nextExercise = useCallback((
    currentStatus: 'completed' | 'skipped' | 'modified' = 'completed'
  ) => {
    completeExercise(currentStatus);

    if (hasNext) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // 마지막 운동 완료
      setStatus('completed');
      stopSessionTimer();
    }
  }, [hasNext, completeExercise, stopSessionTimer]);

  // 이전 운동으로 이동 (기록 제거 없이)
  const previousExercise = useCallback(() => {
    if (!hasPrevious) return;
    setCurrentIndex(prev => prev - 1);
    exerciseStartTimeRef.current = new Date();
  }, [hasPrevious]);

  // 운동 건너뛰기
  const skipExercise = useCallback(() => {
    nextExercise('skipped');
  }, [nextExercise]);

  // 특정 운동으로 점프
  const jumpToExercise = useCallback((index: number) => {
    if (index < 0 || index >= exercises.length) return;

    // 현재 운동을 건너뛰기로 처리하지 않고 그냥 이동
    setCurrentIndex(index);
    exerciseStartTimeRef.current = new Date();
  }, [exercises.length]);

  // 세션 결과 계산
  const getSessionResult = useCallback((): SessionResult => {
    const completed = completionLogs.filter(l => l.status === 'completed').length;
    const skipped = completionLogs.filter(l => l.status === 'skipped').length;
    const modified = completionLogs.filter(l => l.status === 'modified').length;

    const totalPlannedTime = completionLogs.reduce(
      (sum, log) => sum + log.plannedDuration, 0
    );
    const totalActualTime = completionLogs.reduce(
      (sum, log) => sum + log.actualDuration, 0
    );

    return {
      totalExercises: exercises.length,
      completedExercises: completed,
      skippedExercises: skipped,
      modifiedExercises: modified,
      totalPlannedTime,
      totalActualTime,
      sessionDuration: sessionElapsedTime,
      completionRate: exercises.length > 0
        ? Math.round((completed / exercises.length) * 100)
        : 0,
      exerciseLogs: completionLogs,
      sectionStats: getSectionProgress(),
    };
  }, [completionLogs, exercises.length, sessionElapsedTime, getSectionProgress]);

  // 세션 초기화
  const resetSession = useCallback(() => {
    setStatus('idle');
    setCurrentIndex(0);
    setCompletionLogs([]);
    setSessionStartTime(null);
    setSessionElapsedTime(0);
    exerciseStartTimeRef.current = null;
    stopSessionTimer();
  }, [stopSessionTimer]);

  // 세션 완료 시 콜백 호출
  useEffect(() => {
    if (status === 'completed' && onSessionComplete) {
      onSessionComplete(getSessionResult());
    }
  }, [status, onSessionComplete, getSessionResult]);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, []);

  // 시간 포맷팅 유틸리티
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    // 상태
    status,
    currentIndex,
    currentExercise,
    exercises,
    courseId,

    // 진행 정보
    hasNext,
    hasPrevious,
    progressPercentage,
    sessionElapsedTime,
    formattedSessionTime: formatTime(sessionElapsedTime),

    // 섹션 정보
    sections,
    currentSection: getCurrentSection(),
    sectionProgress: getSectionProgress(),

    // 완료 기록
    completionLogs,

    // 액션
    startSession,
    pauseSession,
    resumeSession,
    nextExercise,
    previousExercise,
    skipExercise,
    jumpToExercise,
    completeExercise,
    resetSession,

    // 결과
    getSessionResult,
  };
}
