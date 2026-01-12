/**
 * P2-3-S2-02/03: 사용자 진행 상황 API
 * GET /api/users/progress - 진행 기록 조회 (차트용)
 * POST /api/users/progress - 진행 기록 저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// POST 요청 스키마
const progressSchema = z.object({
  bodyPartId: z.string().uuid(),
  painLevel: z.number().min(1).max(10),
  rangeOfMotion: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ logs: [], chartData: {} });
    }

    const { searchParams } = new URL(request.url);
    const bodyPartId = searchParams.get('bodyPartId');
    const days = parseInt(searchParams.get('days') || '30', 10);

    // 날짜 범위
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const whereClause: Record<string, unknown> = {
      userId: user.id,
      recordedAt: { gte: fromDate }
    };

    if (bodyPartId) {
      whereClause.bodyPartId = bodyPartId;
    }

    // 진행 기록 조회
    const logs = await prisma.userProgressLog.findMany({
      where: whereClause,
      include: {
        bodyPart: {
          select: { id: true, name: true }
        }
      },
      orderBy: { recordedAt: 'desc' },
      take: 100
    });

    // 차트용 데이터 가공: 부위별 + 날짜별
    const chartData: Record<string, Array<{
      date: string;
      painLevel: number;
      rangeOfMotion: number | null;
    }>> = {};

    logs.forEach((log) => {
      const partName = log.bodyPart.name;
      if (!chartData[partName]) {
        chartData[partName] = [];
      }
      chartData[partName].push({
        date: log.recordedAt.toISOString().split('T')[0],
        painLevel: log.painLevel,
        rangeOfMotion: log.rangeOfMotion,
      });
    });

    // 날짜순 정렬 (오래된 것부터)
    Object.keys(chartData).forEach((key) => {
      chartData[key].sort((a, b) => a.date.localeCompare(b.date));
    });

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      bodyPartId: log.bodyPartId,
      bodyPartName: log.bodyPart.name,
      painLevel: log.painLevel,
      rangeOfMotion: log.rangeOfMotion,
      notes: log.notes,
      recordedAt: log.recordedAt,
    }));

    return NextResponse.json({
      logs: formattedLogs,
      chartData,
    });
  } catch (error) {
    console.error('Progress GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = progressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { bodyPartId, painLevel, rangeOfMotion, notes } = validation.data;

    // 부위 확인
    const bodyPart = await prisma.bodyPart.findUnique({
      where: { id: bodyPartId },
      select: { id: true, name: true }
    });

    if (!bodyPart) {
      return NextResponse.json({ error: 'Body part not found' }, { status: 404 });
    }

    // 기록 생성
    const log = await prisma.userProgressLog.create({
      data: {
        userId: user.id,
        bodyPartId,
        painLevel,
        rangeOfMotion: rangeOfMotion ?? null,
        notes: notes ?? null,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: log.id,
        bodyPartId: log.bodyPartId,
        bodyPartName: bodyPart.name,
        painLevel: log.painLevel,
        rangeOfMotion: log.rangeOfMotion,
        notes: log.notes,
        recordedAt: log.recordedAt,
      },
      message: '진행 상황이 기록되었습니다.'
    }, { status: 201 });

  } catch (error) {
    console.error('Progress POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
