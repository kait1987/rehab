/**
 * P3-AI-05: 사용자 선호도 분석 유틸리티
 * 
 * 완수율/스킵율 기반으로 선호/회피 운동을 분석합니다.
 */

import { prisma } from '@/lib/prisma/client';

export interface UserPreferences {
  /** 선호 운동 (완수율 높은 순) */
  favoriteExercises: Array<{
    exerciseId: string;
    name: string;
    completionRate: number;
    totalAttempts: number;
  }>;
  /** 회피 운동 (스킵율 높은 순) */
  avoidedExercises: Array<{
    exerciseId: string;
    name: string;
    skipRate: number;
    totalAttempts: number;
  }>;
  /** 선호 운동 시간 */
  preferredDuration: 60 | 90 | 120;
  /** 선호 운동 시간대 */
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | null;
  /** 전체 평균 완수율 */
  avgCompletionRate: number;
  /** 데이터 충분 여부 */
  hasEnoughData: boolean;
}

// 분석 기준 상수
const MIN_ATTEMPTS_FOR_ANALYSIS = 3;
const FAVORITE_THRESHOLD = 0.8; // 80% 이상 완수
const AVOID_THRESHOLD = 0.4; // 40% 이상 스킵

/**
 * 사용자 선호도 분석
 */
export async function analyzeUserPreferences(
  userId: string,
  lookbackDays: number = 60
): Promise<UserPreferences> {
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  // 기본값 반환용
  const defaultPreferences: UserPreferences = {
    favoriteExercises: [],
    avoidedExercises: [],
    preferredDuration: 60,
    preferredTimeOfDay: null,
    avgCompletionRate: 0,
    hasEnoughData: false
  };

  try {
    // 완료 로그 조회
    const completionLogs = await prisma.courseCompletionLog.findMany({
      where: {
        userId,
        completedAt: { gte: lookbackDate }
      },
      include: {
        exerciseTemplate: { select: { id: true, name: true } },
        course: { select: { totalDurationMinutes: true } }
      }
    });

    if (completionLogs.length < MIN_ATTEMPTS_FOR_ANALYSIS) {
      return defaultPreferences;
    }

    // 1. 운동별 통계 계산
    const exerciseStats = new Map<string, {
      name: string;
      total: number;
      completed: number;
      skipped: number;
    }>();

    let totalCompleted = 0;
    const totalLogs = completionLogs.length;

    for (const log of completionLogs) {
      const id = log.exerciseTemplate.id;
      if (!exerciseStats.has(id)) {
        exerciseStats.set(id, {
          name: log.exerciseTemplate.name,
          total: 0,
          completed: 0,
          skipped: 0
        });
      }
      const stats = exerciseStats.get(id)!;
      stats.total++;
      
      if (log.status === 'completed') {
        stats.completed++;
        totalCompleted++;
      } else if (log.status === 'skipped') {
        stats.skipped++;
      }
    }

    // 2. 선호 운동 추출
    const favoriteExercises: UserPreferences['favoriteExercises'] = [];
    const avoidedExercises: UserPreferences['avoidedExercises'] = [];

    for (const [exerciseId, stats] of exerciseStats) {
      if (stats.total >= MIN_ATTEMPTS_FOR_ANALYSIS) {
        const completionRate = stats.completed / stats.total;
        const skipRate = stats.skipped / stats.total;

        if (completionRate >= FAVORITE_THRESHOLD) {
          favoriteExercises.push({
            exerciseId,
            name: stats.name,
            completionRate: Math.round(completionRate * 100) / 100,
            totalAttempts: stats.total
          });
        }

        if (skipRate >= AVOID_THRESHOLD) {
          avoidedExercises.push({
            exerciseId,
            name: stats.name,
            skipRate: Math.round(skipRate * 100) / 100,
            totalAttempts: stats.total
          });
        }
      }
    }

    // 정렬
    favoriteExercises.sort((a, b) => b.completionRate - a.completionRate);
    avoidedExercises.sort((a, b) => b.skipRate - a.skipRate);

    // 3. 선호 운동 시간 분석
    const durationCounts = new Map<number, number>();
    for (const log of completionLogs) {
      if (log.course.totalDurationMinutes) {
        const duration = log.course.totalDurationMinutes;
        durationCounts.set(duration, (durationCounts.get(duration) || 0) + 1);
      }
    }
    
    let preferredDuration: 60 | 90 | 120 = 60;
    let maxDurationCount = 0;
    for (const [duration, count] of durationCounts) {
      if (count > maxDurationCount && [60, 90, 120].includes(duration)) {
        maxDurationCount = count;
        preferredDuration = duration as 60 | 90 | 120;
      }
    }

    // 4. 선호 시간대 분석
    const timeOfDayCounts = { morning: 0, afternoon: 0, evening: 0 };
    for (const log of completionLogs) {
      const hour = log.completedAt.getHours();
      if (hour >= 5 && hour < 12) {
        timeOfDayCounts.morning++;
      } else if (hour >= 12 && hour < 18) {
        timeOfDayCounts.afternoon++;
      } else {
        timeOfDayCounts.evening++;
      }
    }

    let preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | null = null;
    const maxTimeCount = Math.max(...Object.values(timeOfDayCounts));
    if (maxTimeCount > completionLogs.length * 0.4) { // 40% 이상이면 선호
      for (const [time, count] of Object.entries(timeOfDayCounts)) {
        if (count === maxTimeCount) {
          preferredTimeOfDay = time as 'morning' | 'afternoon' | 'evening';
          break;
        }
      }
    }

    // 5. 전체 완수율
    const avgCompletionRate = Math.round((totalCompleted / totalLogs) * 100) / 100;

    return {
      favoriteExercises: favoriteExercises.slice(0, 5), // 상위 5개
      avoidedExercises: avoidedExercises.slice(0, 5),
      preferredDuration,
      preferredTimeOfDay,
      avgCompletionRate,
      hasEnoughData: true
    };

  } catch (error) {
    console.error('User preferences analysis error:', error);
    return defaultPreferences;
  }
}
