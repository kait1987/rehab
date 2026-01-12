/**
 * P2-F1-01: 사용자 개인화 데이터 조회 유틸
 * 
 * UserPainProfile과 UserProgressLog를 조회하여 코스 생성에 반영합니다.
 */

import { prisma } from '@/lib/prisma/client';

export interface PersonalizationData {
  /** 저장된 부상 부위 프로필 */
  painProfiles: Array<{
    bodyPartId: string;
    bodyPartName: string;
    painLevel: number;
    experienceLevel: string | null;
    equipmentAvailable: string[];
  }>;
  
  /** 최근 진행 로그 기반 추세 분석 */
  progressTrend: {
    trend: 'improving' | 'stable' | 'worsening';
    avgRecentPain: number;
    avgOlderPain: number;
    recommendation: 'increase_intensity' | 'maintain' | 'decrease_intensity';
  } | null;
  
  /** 사용자 피트니스 프로필 */
  fitnessProfile: {
    fitnessLevel: number;
    rehabPhase: string;
    totalCoursesCompleted: number;
  } | null;
}

interface ProgressLog {
  painLevel: number;
}

/**
 * 사용자 개인화 데이터 조회
 * 
 * @param userId 내부 사용자 ID (UUID)
 * @returns 개인화 데이터 또는 null (데이터 없음)
 */
export async function getUserPersonalization(
  userId: string | null | undefined
): Promise<PersonalizationData | null> {
  if (!userId) return null;

  try {
    // 1. 부상 부위 프로필 조회
    const painProfiles = await prisma.userPainProfile.findMany({
      where: { userId },
      include: {
        bodyPart: {
          select: { id: true, name: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // 2. 최근 진행 로그 조회 (최신 10개)
    let progressLogs: ProgressLog[] = [];
    try {
      const logs = await prisma.userProgressLog.findMany({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        take: 10,
        select: { painLevel: true }
      });
      progressLogs = logs;
    } catch {
      // UserProgressLog 테이블이 없거나 오류 시 빈 배열
      progressLogs = [];
    }

    // 3. 피트니스 프로필 조회
    let fitnessProfile: PersonalizationData['fitnessProfile'] = null;
    try {
      const profile = await prisma.userFitnessProfile.findUnique({
        where: { userId },
        select: {
          fitnessLevel: true,
          rehabPhase: true,
          totalCoursesCompleted: true
        }
      });
      fitnessProfile = profile;
    } catch {
      // UserFitnessProfile 테이블이 없거나 오류 시 null
      fitnessProfile = null;
    }

    // 4. 진행 추세 분석
    let progressTrend: PersonalizationData['progressTrend'] = null;
    
    if (progressLogs.length >= 4) {
      // 최근 절반 vs 이전 절반 비교
      const midpoint = Math.floor(progressLogs.length / 2);
      const recentLogs = progressLogs.slice(0, midpoint);
      const olderLogs = progressLogs.slice(midpoint);

      const avgRecentPain = recentLogs.reduce((sum: number, log: ProgressLog) => sum + log.painLevel, 0) / recentLogs.length;
      const avgOlderPain = olderLogs.reduce((sum: number, log: ProgressLog) => sum + log.painLevel, 0) / olderLogs.length;

      const diff = avgRecentPain - avgOlderPain;
      let trend: 'improving' | 'stable' | 'worsening';
      let recommendation: 'increase_intensity' | 'maintain' | 'decrease_intensity';

      if (diff < -0.5) {
        trend = 'improving';
        recommendation = 'increase_intensity';
      } else if (diff > 0.5) {
        trend = 'worsening';
        recommendation = 'decrease_intensity';
      } else {
        trend = 'stable';
        recommendation = 'maintain';
      }

      progressTrend = {
        trend,
        avgRecentPain: Math.round(avgRecentPain * 10) / 10,
        avgOlderPain: Math.round(avgOlderPain * 10) / 10,
        recommendation
      };
    }

    // 5. 결과 반환 (painLevel이 null인 경우 기본값 3 사용)
    return {
      painProfiles: painProfiles.map(p => ({
        bodyPartId: p.bodyPartId,
        bodyPartName: p.bodyPart.name,
        painLevel: p.painLevel ?? 3,
        experienceLevel: p.experienceLevel,
        equipmentAvailable: p.equipmentAvailable as string[]
      })),
      progressTrend,
      fitnessProfile
    };
  } catch (error) {
    console.error('Failed to get user personalization:', error);
    return null;
  }
}

/**
 * 개인화 데이터를 MergeRequest의 bodyParts에 병합
 * 
 * - 사용자가 명시적으로 선택하지 않은 부위도 프로필 기반으로 추가
 * - 통증 레벨은 최근 진행 로그 추세 반영
 */
export function mergePersonalizationWithRequest(
  requestBodyParts: Array<{ bodyPartId: string; bodyPartName: string; painLevel: number }>,
  personalization: PersonalizationData
): {
  mergedBodyParts: Array<{ bodyPartId: string; bodyPartName: string; painLevel: number }>;
  appliedProfiles: string[];
  intensityAdjustment: number; // -1, 0, +1
} {
  const result = [...requestBodyParts];
  const existingIds = new Set(requestBodyParts.map(bp => bp.bodyPartId));
  const appliedProfiles: string[] = [];

  // 프로필 부위 중 요청에 없는 것 추가 (가중치 낮게)
  for (const profile of personalization.painProfiles) {
    if (!existingIds.has(profile.bodyPartId)) {
      result.push({
        bodyPartId: profile.bodyPartId,
        bodyPartName: profile.bodyPartName,
        painLevel: profile.painLevel
      });
      appliedProfiles.push(profile.bodyPartName);
    }
  }

  // 강도 조정 계산
  let intensityAdjustment = 0;
  if (personalization.progressTrend) {
    switch (personalization.progressTrend.recommendation) {
      case 'increase_intensity':
        intensityAdjustment = 1;
        break;
      case 'decrease_intensity':
        intensityAdjustment = -1;
        break;
      default:
        intensityAdjustment = 0;
    }
  }

  return {
    mergedBodyParts: result,
    appliedProfiles,
    intensityAdjustment
  };
}
