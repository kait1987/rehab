/**
 * User History API
 * 
 * 사용자 운동 기록 및 통계를 제공합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자 조회
    const user = await prisma.user.findFirst({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({
        courses: [],
        stats: { totalSessions: 0, thisWeekSessions: 0, byBodyPart: {} }
      });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // 기간 필터
    const dateFilter = from && to ? {
      savedAt: {
        gte: new Date(from),
        lte: new Date(to)
      }
    } : {};

    // 저장된 코스 조회 (Course 포함하여 bodyParts 가져오기)
    const savedCourses = await prisma.userCourseHistory.findMany({
      where: {
        userId: user.id,
        ...dateFilter
      },
      include: {
        course: {
          select: {
            id: true,
            bodyParts: true,
            totalDurationMinutes: true,
          }
        }
      },
      orderBy: { savedAt: 'desc' },
      take: 20
    });

    // 이번 주 시작일
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // 통계 계산
    const totalSessions = await prisma.userCourseHistory.count({
      where: { userId: user.id }
    });

    const thisWeekSessions = await prisma.userCourseHistory.count({
      where: { 
        userId: user.id,
        savedAt: { gte: weekStart }
      }
    });

    // byBodyPart 계산: 모든 히스토리에서 부위별 횟수 집계
    const allHistoryForStats = await prisma.userCourseHistory.findMany({
      where: {
        userId: user.id,
        ...dateFilter
      },
      include: {
        course: {
          select: { bodyParts: true }
        }
      }
    });

    const byBodyPart: Record<string, number> = {};
    allHistoryForStats.forEach((history) => {
      if (history.course?.bodyParts) {
        history.course.bodyParts.forEach((part: string) => {
          byBodyPart[part] = (byBodyPart[part] || 0) + 1;
        });
      }
    });

    // 응답 형식 변환
    const formattedCourses = savedCourses.map((c) => ({
      id: c.id,
      savedAt: c.savedAt,
      completedAt: c.completedAt || c.savedAt,
      courseId: c.courseId,
      isFavorite: c.isFavorite,
      notes: c.notes,
      totalDuration: c.course?.totalDurationMinutes || 0,
      course: {
        bodyParts: c.course?.bodyParts || []
      }
    }));

    return NextResponse.json({
      courses: formattedCourses,
      stats: {
        totalSessions,
        thisWeekSessions,
        byBodyPart
      }
    });
  } catch (error) {
    console.error('User history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

