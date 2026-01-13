/**
 * P3-AI-04: 운동 누락/오류 감지 유틸리티
 * 
 * 최근 기록을 분석하여 문제점을 감지합니다:
 * - missing_body_part: 부상 부위 7일 이상 미운동
 * - low_completion: 특정 운동 완수율 < 50%
 * - pain_increase: 운동 후 통증 증가 추세
 * - imbalance: 상/하체 불균형
 */

import { prisma } from '@/lib/prisma/client';

export interface IssueDetectionInput {
  userId: string;
  lookbackDays?: number; // 기본 30일
}

export interface DetectedIssue {
  type: 'missing_body_part' | 'low_completion' | 'pain_increase' | 'imbalance';
  severity: 'info' | 'warning' | 'critical';
  bodyPartId?: string;
  bodyPartName?: string;
  exerciseId?: string;
  exerciseName?: string;
  message: string;
  recommendation: string;
}

// 감지 기준 상수
const MISSING_THRESHOLD_DAYS = 7;
const LOW_COMPLETION_THRESHOLD = 0.5; // 50%
const PAIN_INCREASE_THRESHOLD = 1; // 1점 이상 증가

/**
 * 운동 이슈 감지 메인 함수
 */
export async function detectExerciseIssues(
  input: IssueDetectionInput
): Promise<DetectedIssue[]> {
  const { userId, lookbackDays = 30 } = input;
  const issues: DetectedIssue[] = [];
  
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  try {
    // 1. 사용자 부상 부위 조회
    const painProfiles = await prisma.userPainProfile.findMany({
      where: { userId },
      include: { bodyPart: { select: { id: true, name: true } } }
    });

    // 2. 최근 완료 로그 조회
    const completionLogs = await prisma.courseCompletionLog.findMany({
      where: {
        userId,
        completedAt: { gte: lookbackDate }
      },
      include: {
        exerciseTemplate: {
          select: { id: true, name: true, bodyPartId: true }
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    // 3. missing_body_part 감지
    const missingIssues = detectMissingBodyParts(painProfiles, completionLogs);
    issues.push(...missingIssues);

    // 4. low_completion 감지
    const lowCompletionIssues = detectLowCompletion(completionLogs);
    issues.push(...lowCompletionIssues);

    // 5. pain_increase 감지
    const painIssues = await detectPainIncrease(userId, completionLogs);
    issues.push(...painIssues);

    // 6. imbalance 감지
    const imbalanceIssues = detectImbalance(completionLogs);
    issues.push(...imbalanceIssues);

    return issues;
  } catch (error) {
    console.error('Issue detection error:', error);
    return [];
  }
}

/**
 * 부상 부위 미운동 감지
 */
function detectMissingBodyParts(
  painProfiles: Array<{ bodyPartId: string; bodyPart: { id: string; name: string } }>,
  completionLogs: Array<{ exerciseTemplate: { bodyPartId: string } }>
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  
  // 최근 운동한 부위 집합
  const exercisedBodyParts = new Set(
    completionLogs.map(log => log.exerciseTemplate.bodyPartId)
  );

  for (const profile of painProfiles) {
    if (!exercisedBodyParts.has(profile.bodyPartId)) {
      issues.push({
        type: 'missing_body_part',
        severity: 'warning',
        bodyPartId: profile.bodyPartId,
        bodyPartName: profile.bodyPart.name,
        message: `${profile.bodyPart.name} 부위가 ${MISSING_THRESHOLD_DAYS}일 이상 운동되지 않았습니다.`,
        recommendation: `${profile.bodyPart.name} 관련 운동을 추가하세요.`
      });
    }
  }

  return issues;
}

/**
 * 낮은 완수율 감지
 */
function detectLowCompletion(
  completionLogs: Array<{ 
    status: string; 
    exerciseTemplate: { id: string; name: string } 
  }>
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  
  // 운동별 통계
  const exerciseStats = new Map<string, { name: string; total: number; completed: number }>();
  
  for (const log of completionLogs) {
    const id = log.exerciseTemplate.id;
    if (!exerciseStats.has(id)) {
      exerciseStats.set(id, { name: log.exerciseTemplate.name, total: 0, completed: 0 });
    }
    const stats = exerciseStats.get(id)!;
    stats.total++;
    if (log.status === 'completed') {
      stats.completed++;
    }
  }

  for (const [exerciseId, stats] of exerciseStats) {
    if (stats.total >= 3) { // 최소 3회 이상 시도한 운동만
      const completionRate = stats.completed / stats.total;
      if (completionRate < LOW_COMPLETION_THRESHOLD) {
        issues.push({
          type: 'low_completion',
          severity: completionRate < 0.3 ? 'critical' : 'warning',
          exerciseId,
          exerciseName: stats.name,
          message: `${stats.name} 운동의 완수율이 ${Math.round(completionRate * 100)}%입니다.`,
          recommendation: `${stats.name}을(를) 더 쉬운 운동으로 대체하거나 강도를 낮추세요.`
        });
      }
    }
  }

  return issues;
}

/**
 * 통증 증가 감지
 */
async function detectPainIncrease(
  userId: string,
  completionLogs: Array<{ painAfter: number | null; completedAt: Date }>
): Promise<DetectedIssue[]> {
  const issues: DetectedIssue[] = [];
  
  // 통증 기록이 있는 로그만 필터
  const logsWithPain = completionLogs
    .filter(log => log.painAfter !== null)
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());

  if (logsWithPain.length >= 4) {
    const midpoint = Math.floor(logsWithPain.length / 2);
    const recentLogs = logsWithPain.slice(midpoint);
    const olderLogs = logsWithPain.slice(0, midpoint);

    const avgRecentPain = recentLogs.reduce((sum, log) => sum + (log.painAfter || 0), 0) / recentLogs.length;
    const avgOlderPain = olderLogs.reduce((sum, log) => sum + (log.painAfter || 0), 0) / olderLogs.length;

    if (avgRecentPain - avgOlderPain >= PAIN_INCREASE_THRESHOLD) {
      issues.push({
        type: 'pain_increase',
        severity: avgRecentPain - avgOlderPain >= 2 ? 'critical' : 'warning',
        message: `운동 후 통증이 증가하고 있습니다 (${avgOlderPain.toFixed(1)} → ${avgRecentPain.toFixed(1)}).`,
        recommendation: '운동 강도를 낮추거나 휴식을 취하세요.'
      });
    }
  }

  return issues;
}

/**
 * 불균형 감지 (상체/하체 비율)
 */
function detectImbalance(
  completionLogs: Array<{ exerciseTemplate: { bodyPartId: string } }>
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  
  // 상체/하체 분류 (간단 버전 - 실제로는 BodyPart 카테고리 필요)
  // TODO: BodyPart에 category 필드 추가 시 개선
  const bodyPartCounts = new Map<string, number>();
  
  for (const log of completionLogs) {
    const id = log.exerciseTemplate.bodyPartId;
    bodyPartCounts.set(id, (bodyPartCounts.get(id) || 0) + 1);
  }

  // 부위별 운동 횟수의 표준편차 체크
  if (bodyPartCounts.size >= 3) {
    const counts = Array.from(bodyPartCounts.values());
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const maxDiff = Math.max(...counts) - Math.min(...counts);
    
    if (maxDiff > avg * 2) { // 최대-최소 차이가 평균의 2배 이상
      issues.push({
        type: 'imbalance',
        severity: 'info',
        message: '특정 부위에 운동이 집중되어 있습니다.',
        recommendation: '다양한 부위를 골고루 운동하세요.'
      });
    }
  }

  return issues;
}
