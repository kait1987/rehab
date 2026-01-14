/**
 * @file route.ts
 * @description 개별 코스 조회/삭제 API 엔드포인트
 * 
 * DELETE /api/courses/[id] - 코스 삭제
 * 
 * 로그인한 사용자가 본인의 코스를 삭제할 수 있습니다.
 * course_exercises는 ON DELETE CASCADE로 자동 삭제됩니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE 요청 처리 - 코스 삭제
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: courseId } = await params;

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

    // 3. 코스 조회 및 소유권 확인
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, userId: true },
    });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: "코스를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 본인 소유 코스인지 확인
    if (course.userId !== dbUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: "본인의 코스만 삭제할 수 있습니다.",
        },
        { status: 403 }
      );
    }

    // 4. 코스 삭제 (cascade로 course_exercises도 자동 삭제)
    await prisma.course.delete({
      where: { id: courseId },
    });

    console.log(`[DELETE /api/courses/${courseId}] Course deleted by user ${dbUser.id}`);

    return NextResponse.json({
      success: true,
      message: "코스가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Delete course error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "코스를 삭제하는 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
