/**
 * @file route.ts
 * @description 재활 코스 생성 API 엔드포인트
 * 
 * POST /api/rehab/generate
 * 
 * 사용자가 선택한 부위, 통증 정도, 기구, 경험 수준, 운동 시간을 기반으로
 * 맞춤형 재활 코스를 생성합니다.
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
 * - types/body-part-merge: 타입 정의
 */

import { NextRequest, NextResponse } from "next/server";
import { mergeRequestSchema } from "@/lib/validations/merge-request.schema";
import { mergeBodyParts } from "@/lib/algorithms/merge-body-parts";
import type { MergeRequest, MergeResult } from "@/types/body-part-merge";

/**
 * POST 요청 처리
 * 
 * 재활 코스 생성 요청을 처리하고 결과를 반환합니다.
 */
export async function POST(request: NextRequest) {
  try {
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

    const validatedRequest: MergeRequest = validationResult.data;

    // 3. 코스 생성 로직 호출
    const result: MergeResult = await mergeBodyParts(validatedRequest);

    // 4. Fallback 처리: 운동이 없거나 부족한 경우
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

    // 5. 성공 응답 반환
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

