/**
 * P3-AI-03: 코스 완료 API
 * POST /api/courses/complete
 *
 * 운동별 완료/스킵/수정 정보를 배치로 저장합니다.
 * + P2-S2: 연속 운동(Streak) 및 통계 업데이트
 */

import { prisma } from "@/lib/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { differenceInCalendarDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 허용된 상태값
const EXERCISE_STATUS = ["completed", "skipped", "modified"] as const;

// 개별 운동 스키마
const exerciseLogSchema = z.object({
  exerciseTemplateId: z.string().uuid(),
  status: z.enum(EXERCISE_STATUS),
  actualDuration: z.number().int().positive().optional(),
  userRating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
});

// 요청 본문 스키마
const completeBodySchema = z.object({
  courseId: z.string().uuid(),
  exercises: z.array(exerciseLogSchema).min(1).max(50),
  overallRating: z.number().int().min(1).max(5).optional(),
  painAfter: z.number().int().min(1).max(10).optional(),
});

/**
 * POST: 코스 완료 로그 저장 및 스트릭 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const validation = completeBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "입력 데이터가 올바르지 않습니다.",
          details: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { courseId, exercises, overallRating, painAfter } = validation.data;

    // 코스 존재 확인
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, userId: true },
    });

    if (!course) {
      return NextResponse.json(
        { error: "코스를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 배치 저장 및 스트릭 업데이트 (트랜잭션)
    const result = await prisma.$transaction(async (tx) => {
      // 1. 코스 완료 로그 저장
      const logPromises = exercises.map((exercise) =>
        tx.courseCompletionLog.create({
          data: {
            userId: user.id,
            courseId,
            exerciseTemplateId: exercise.exerciseTemplateId,
            status: exercise.status,
            actualDuration: exercise.actualDuration || null,
            userRating: exercise.userRating || overallRating || null,
            painAfter: painAfter || null,
            notes: exercise.notes || null,
          },
          select: { id: true, status: true, exerciseTemplateId: true },
        }),
      );

      const createdLogs = await Promise.all(logPromises);

      // 2. 스트릭 및 피트니스 프로필 업데이트
      const now = new Date();
      let profile = await tx.userFitnessProfile.findUnique({
        where: { userId: user.id },
      });

      let currentStreak = 0;
      let isStreakUpdated = false;

      if (!profile) {
        // 프로필이 없으면 생성 (첫 운동)
        profile = await tx.userFitnessProfile.create({
          data: {
            userId: user.id,
            currentStreak: 1,
            longestStreak: 1,
            lastWorkoutDate: now,
            totalCoursesCompleted: 1,
            // 기본값 설정 (schema default가 있지만 명시)
            fitnessLevel: 2,
            rehabPhase: "initial",
          },
        });
        currentStreak = 1;
        isStreakUpdated = true;
      } else {
        // 기존 프로필 업데이트
        const lastDate = profile.lastWorkoutDate;
        const diff = lastDate ? differenceInCalendarDays(now, lastDate) : -1;

        let newCurrentStreak = profile.currentStreak;
        let newLongestStreak = profile.longestStreak;

        if (!lastDate || diff > 1) {
          // 마지막 운동 기록이 없거나(오류 방지), 하루 이상 지났으면 스트릭 리셋
          // diff > 1 means missed at least one calendar day (e.g. Mon -> Wed)
          newCurrentStreak = 1;
        } else if (diff === 1) {
          // 어제 운동함 -> 연속
          newCurrentStreak += 1;
        }
        // diff === 0 (오늘 이미 운동함) -> 스트릭 증가 안 함

        if (newCurrentStreak > newLongestStreak) {
          newLongestStreak = newCurrentStreak;
        }

        await tx.userFitnessProfile.update({
          where: { userId: user.id },
          data: {
            currentStreak: newCurrentStreak,
            longestStreak: newLongestStreak,
            lastWorkoutDate: now,
            totalCoursesCompleted: { increment: 1 },
          },
        });

        currentStreak = newCurrentStreak;
        // 스트릭이 업데이트 되었다고 표시 (축하 메시지용):
        // 1. 연속 일수가 증가했거나 (diff===1)
        // 2. 끊겼다가 다시 1일이 되었거나 (diff > 1)
        // 3. 아예 처음이거나 (!lastDate)
        // 하지만 "연속 성공!" 축하는 diff === 1 일 때 가장 의미가 있고,
        // diff > 1 이어도 "다시 시작! 1일차" 라고 격려 가능.
        // 여기서는 그냥 현재 스트릭 값을 반환하므로 프론트에서 처리.
      }

      return {
        logs: createdLogs,
        streak: {
          currentStreak,
          longestStreak:
            profile.longestStreak > currentStreak
              ? profile.longestStreak
              : currentStreak,
        },
      };
    });

    const { logs, streak } = result;

    // 통계 계산
    const stats = {
      total: logs.length,
      completed: logs.filter((c) => c.status === "completed").length,
      skipped: logs.filter((c) => c.status === "skipped").length,
      modified: logs.filter((c) => c.status === "modified").length,
      completionRate: Math.round(
        (logs.filter((c) => c.status === "completed").length / logs.length) *
          100,
      ),
    };

    return NextResponse.json(
      {
        success: true,
        message: `${logs.length}개의 운동 로그가 저장되었습니다.`,
        data: {
          logs,
          stats,
          streak, // 스트릭 정보 포함
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Course Complete Error:", error);
    return NextResponse.json(
      { error: "코스 완료 저장 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
