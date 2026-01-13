/**
 * @file route.ts
 * @description 재활 코스 생성 API 엔드포인트
 * 
 * POST /api/rehab/generate
 * 
 * 사용자가 선택한 부위, 통증 정도, 기구, 경험 수준, 운동 시간을 기반으로
 * 맞춤형 재활 코스를 생성합니다.
 * 
 * P2-F1-01: 로그인 사용자의 경우 UserPainProfile/UserProgressLog를 자동 반영합니다.
 * 
 * 요청 본문:
 * {
 *   bodyParts: [
 *     { bodyPartId: "uuid", bodyPartName: "허리", painLevel: 5 }
 *   ],
 *   painLevel: 5,
 *   equipmentAvailable: ["매트", "덤벨"],
 *   experienceLevel?: "beginner",
 *   totalDurationMinutes?: 60 | 90 | 120
 * }
 * 
 * @dependencies
 * - lib/algorithms/merge-body-parts: 코스 생성 로직
 * - lib/validations/merge-request.schema: 요청 검증 스키마
 * - lib/utils/get-user-personalization: 개인화 데이터 조회
 * - types/body-part-merge: 타입 정의
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import { mergeRequestSchema } from "@/lib/validations/merge-request.schema";
import { mergeBodyParts } from "@/lib/algorithms/merge-body-parts";
import { getUserPersonalization, mergePersonalizationWithRequest } from "@/lib/utils/get-user-personalization";
import type { MergeRequest, MergeResult } from "@/types/body-part-merge";

/**
 * POST 요청 처리
 * 
 * 재활 코스 생성 요청을 처리하고 결과를 반환합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 0. 로그인 사용자 확인 (선택적)
    const { userId: clerkId } = await auth();
    let internalUserId: string | null = null;
    
    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true }
      });
      internalUserId = user?.id ?? null;
    }

    // 1. 요청 본문 파싱
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "요청 본문이 유효한 JSON 형식이 아닙니다.",
        },
        { status: 400 }
      );
    }

    // 2. Zod 스키마로 검증
    const validationResult = mergeRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          success: false,
          error: "요청 파라미터 검증에 실패했습니다.",
          details: errors,
        },
        { status: 400 }
      );
    }

    let validatedRequest: MergeRequest = validationResult.data;
    
    // 3. 개인화 데이터 반영 (로그인 사용자만)
    let personalizationApplied = false;
    let appliedProfiles: string[] = [];
    let intensityAdjustment = 0;
    let progressTrendInfo: string | null = null;
    let fatigueInfo: string | null = null;

    if (internalUserId) {
      const personalization = await getUserPersonalization(internalUserId);
      
      if (personalization) {
        // 개인화 데이터 병합
        const merged = mergePersonalizationWithRequest(
          validatedRequest.bodyParts,
          personalization
        );
        
        validatedRequest = {
          ...validatedRequest,
          bodyParts: merged.mergedBodyParts
        };
        
        appliedProfiles = merged.appliedProfiles;
        intensityAdjustment = merged.intensityAdjustment;
        personalizationApplied = appliedProfiles.length > 0 || personalization.progressTrend !== null;
        
        // 진행 추세 정보
        if (personalization.progressTrend) {
          const trend = personalization.progressTrend;
          if (trend.trend === 'improving') {
            progressTrendInfo = `통증이 개선되고 있습니다 (${trend.avgOlderPain} → ${trend.avgRecentPain}). 강도를 높여도 좋습니다.`;
          } else if (trend.trend === 'worsening') {
            progressTrendInfo = `통증이 악화되고 있습니다 (${trend.avgOlderPain} → ${trend.avgRecentPain}). 강도를 낮춥니다.`;
          }
        }
      }

      // P3-W2-03: 웨어러블 데이터 기반 피로도 체크
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const stepsData = await prisma.wearableData.findMany({
          where: {
            userId: internalUserId,
            dataType: 'steps',
            recordedAt: { gte: sevenDaysAgo }
          },
          select: { value: true, recordedAt: true },
          orderBy: { recordedAt: 'desc' }
        });

        if (stepsData.length >= 3) {
          // 피로도 계산을 위한 동적 import (선택적)
          const { calculateFatigue, summarizeStepsForFatigue } = await import('@/lib/utils/calculate-fatigue');
          const recentSteps = summarizeStepsForFatigue(stepsData);
          const fatigue = calculateFatigue({ recentSteps });

          if (fatigue.level === 'high') {
            intensityAdjustment -= 1;
            fatigueInfo = `피로도가 높습니다 (${fatigue.score}점). 강도를 낮춥니다.`;
          } else if (fatigue.level === 'moderate') {
            fatigueInfo = `적당한 피로도입니다 (${fatigue.score}점).`;
          }
        }
      } catch {
        // 웨어러블 데이터 없거나 오류 시 무시
      }

      // P3-AI-07: AI 코치 - 이슈 감지 및 자동 수정
      try {
        const { detectExerciseIssues } = await import('@/lib/utils/detect-exercise-issues');
        const { analyzeUserPreferences } = await import('@/lib/utils/analyze-user-preferences');
        const { autoAdjustRoutine } = await import('@/lib/algorithms/auto-adjust-routine');

        const [issues, preferences] = await Promise.all([
          detectExerciseIssues({ userId: internalUserId }),
          analyzeUserPreferences(internalUserId)
        ]);

        if (issues.length > 0 || preferences.hasEnoughData) {
          const adjustmentResult = autoAdjustRoutine({
            issues,
            preferences,
            requestedBodyParts: validatedRequest.bodyParts
          });

          // 조정 적용
          validatedRequest = {
            ...validatedRequest,
            bodyParts: adjustmentResult.adjustedBodyParts
          };
          intensityAdjustment += adjustmentResult.intensityAdjustment;

          // 회피 운동 ID 저장 (merge-body-parts에서 사용 가능하도록)
          (validatedRequest as unknown as { _avoidExerciseIds?: string[] })._avoidExerciseIds = adjustmentResult.avoidExerciseIds;

          // 경고 추가
          if (adjustmentResult.warnings.length > 0) {
            if (!fatigueInfo) fatigueInfo = '';
            fatigueInfo += (fatigueInfo ? ' ' : '') + adjustmentResult.warnings.join(' ');
          }
        }
      } catch {
        // AI 코치 오류 시 무시 (기존 로직 계속)
      }
    }

    // 4. 코스 생성 로직 호출
    const result: MergeResult = await mergeBodyParts(validatedRequest, intensityAdjustment);

    // 5. Fallback 처리: 운동이 없거나 부족한 경우
    if (result.exercises.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "적절한 운동을 찾지 못했습니다.",
          message: "선택하신 부위와 통증 정도에 맞는 운동이 없습니다. 다른 부위를 선택하거나 통증 정도를 조정해 주세요.",
          warnings: result.warnings,
        },
        { status: 404 }
      );
    }

    // 운동이 3개 미만인 경우 경고 메시지 추가
    if (result.exercises.length < 3) {
      const warnings = result.warnings || [];
      warnings.push("추천 운동이 부족합니다. 더 많은 운동을 위해 다른 부위를 추가하거나 기구 옵션을 확장해 주세요.");
      result.warnings = warnings;
    }

    // 개인화 관련 메시지 추가
    if (appliedProfiles.length > 0) {
      const warnings = result.warnings || [];
      warnings.push(`프로필 기반으로 "${appliedProfiles.join(', ')}" 부위가 추가되었습니다.`);
      result.warnings = warnings;
    }
    
    if (progressTrendInfo) {
      const warnings = result.warnings || [];
      warnings.push(progressTrendInfo);
      result.warnings = warnings;
    }

    // 6. 성공 응답 반환
    return NextResponse.json(
      {
        success: true,
        data: {
          course: {
            exercises: result.exercises,
            totalDuration: result.totalDuration,
            stats: result.stats,
          },
          warnings: result.warnings,
          personalization: personalizationApplied ? {
            applied: true,
            addedBodyParts: appliedProfiles,
            intensityAdjustment: intensityAdjustment > 0 ? 'increased' : intensityAdjustment < 0 ? 'decreased' : 'none'
          } : null
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // 에러 처리
    console.error("Rehab course generation error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "재활 코스를 생성하는 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}


