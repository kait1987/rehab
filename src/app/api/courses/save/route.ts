/**
 * @file route.ts
 * @description 코스 저장 API 엔드포인트
 * 
 * POST /api/courses/save
 * 
 * 생성된 재활 코스를 데이터베이스에 저장합니다.
 * 
 * 요청 본문:
 * {
 *   totalDurationMinutes: 60 | 90 | 120,
 *   painLevel: number,
 *   experienceLevel?: string,
 *   bodyParts: string[],
 *   equipmentAvailable: string[],
 *   exercises: MergedExercise[]
 * }
 * 
 * @dependencies
 * - @clerk/nextjs/server: currentUser
 * - @/lib/prisma/client: Prisma 클라이언트
 * - @/types/body-part-merge: MergedExercise 타입
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import type { MergedExercise } from "@/types/body-part-merge";

interface SaveCourseRequest {
  totalDurationMinutes: 60 | 90 | 120;
  painLevel: number;
  experienceLevel?: string;
  bodyParts: string[];
  equipmentAvailable: string[];
  exercises: MergedExercise[];
}

/**
 * POST 요청 처리
 * 
 * 코스를 데이터베이스에 저장합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 사용자 인증 확인
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "인증이 필요합니다.",
        },
        { status: 401 }
      );
    }

    // 2. Clerk 사용자 ID로 DB 사용자 조회
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          success: false,
          error: "사용자 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 3. 요청 본문 파싱
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

    const saveRequest = body as SaveCourseRequest;

    // 4. 요청 데이터 검증
    if (!saveRequest.totalDurationMinutes || !saveRequest.exercises || saveRequest.exercises.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "필수 데이터가 누락되었습니다.",
        },
        { status: 400 }
      );
    }

    // totalDurationMinutes가 60, 90, 120 중 하나인지 확인
    if (![60, 90, 120].includes(saveRequest.totalDurationMinutes)) {
      return NextResponse.json(
        {
          success: false,
          error: "운동 시간은 60, 90, 120분 중 하나여야 합니다.",
        },
        { status: 400 }
      );
    }

    // 5. 트랜잭션으로 코스 및 운동 저장
    const result = await prisma.$transaction(async (tx) => {
      // 코스 생성
      const course = await tx.course.create({
        data: {
          userId: dbUser.id,
          totalDurationMinutes: saveRequest.totalDurationMinutes,
          painLevel: saveRequest.painLevel,
          experienceLevel: saveRequest.experienceLevel || null,
          bodyParts: saveRequest.bodyParts,
          equipmentAvailable: saveRequest.equipmentAvailable,
          courseType: "warmup_main_cooldown",
          isTemplate: false,
        },
      });

      // 운동 목록 생성
      const courseExercises = await Promise.all(
        saveRequest.exercises.map((exercise) =>
          tx.courseExercise.create({
            data: {
              courseId: course.id,
              exerciseTemplateId: exercise.exerciseTemplateId,
              section: exercise.section,
              orderInSection: exercise.orderInSection,
              durationMinutes: exercise.durationMinutes || null,
              reps: exercise.reps || null,
              sets: exercise.sets || null,
              restSeconds: exercise.restSeconds || null,
              notes: exercise.instructions || exercise.description || null,
            },
          })
        )
      );

      return {
        course,
        courseExercises,
      };
    });

    // 6. 성공 응답 반환
    return NextResponse.json(
      {
        success: true,
        data: {
          courseId: result.course.id,
          message: "코스가 성공적으로 저장되었습니다.",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // 에러 처리
    console.error("Course save error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "코스를 저장하는 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

