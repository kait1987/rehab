/**
 * @file route.ts
 * @description 코스 목록 조회 API 엔드포인트
 * 
 * GET /api/courses
 * 
 * 로그인한 사용자의 저장된 코스 목록을 조회합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";

/**
 * GET 요청 처리
 * 
 * 사용자의 저장된 코스 목록을 조회합니다.
 */
export async function GET(request: NextRequest) {
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

    // 3. 사용자의 코스 목록 조회
    const courses = await prisma.course.findMany({
      where: {
        userId: dbUser.id,
      },
      include: {
        courseExercises: {
          include: {
            exerciseTemplate: {
              select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                gifUrl: true,
                videoUrl: true,
              },
            },
          },
          orderBy: [
            { section: 'asc' },
            { orderInSection: 'asc' },
          ],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 4. 응답 데이터 변환
    const formattedCourses = courses.map((course) => ({
      id: course.id,
      totalDurationMinutes: course.totalDurationMinutes,
      painLevel: course.painLevel,
      experienceLevel: course.experienceLevel,
      bodyParts: course.bodyParts,
      equipmentAvailable: course.equipmentAvailable,
      courseType: course.courseType,
      createdAt: course.createdAt.toISOString(),
      exercises: course.courseExercises.map((ce) => ({
        id: ce.id,
        section: ce.section,
        orderInSection: ce.orderInSection,
        durationMinutes: ce.durationMinutes,
        reps: ce.reps,
        sets: ce.sets,
        restSeconds: ce.restSeconds,
        notes: ce.notes,
        exercise: {
          id: ce.exerciseTemplate.id,
          name: ce.exerciseTemplate.name,
          description: ce.exerciseTemplate.description,
          imageUrl: ce.exerciseTemplate.imageUrl,
          gifUrl: ce.exerciseTemplate.gifUrl,
          videoUrl: ce.exerciseTemplate.videoUrl,
        },
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        courses: formattedCourses,
        totalCount: formattedCourses.length,
      },
    });
  } catch (error) {
    console.error("Get courses error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "코스 목록을 조회하는 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
