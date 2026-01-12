/**
 * P3-W1-03: 웨어러블 데이터 API
 * GET /api/users/wearable-data - 조회 (기간/타입 필터)
 * POST /api/users/wearable-data - 배치 저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// 허용된 데이터 타입
const DATA_TYPES = ['steps', 'heart_rate', 'sleep', 'calories'] as const;
const SOURCES = ['healthkit', 'googlefit', 'manual'] as const;

// POST 요청 스키마
const wearableDataItemSchema = z.object({
  dataType: z.enum(DATA_TYPES),
  value: z.number(),
  unit: z.string().max(20).optional(),
  recordedAt: z.string().datetime()
});

const postBodySchema = z.object({
  source: z.enum(SOURCES),
  data: z.array(wearableDataItemSchema).min(1).max(100)
});

// GET 요청 쿼리 파라미터 파싱
function parseGetParams(request: NextRequest) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const dataType = url.searchParams.get('dataType');
  const limit = url.searchParams.get('limit');
  
  return {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    dataType: dataType && DATA_TYPES.includes(dataType as typeof DATA_TYPES[number]) 
      ? dataType as typeof DATA_TYPES[number] 
      : undefined,
    limit: limit ? Math.min(parseInt(limit, 10), 1000) : 100
  };
}

/**
 * GET: 웨어러블 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    const { from, to, dataType, limit } = parseGetParams(request);

    // 쿼리 조건 구성
    const where: {
      userId: string;
      recordedAt?: { gte?: Date; lte?: Date };
      dataType?: string;
    } = { userId: user.id };

    if (from || to) {
      where.recordedAt = {};
      if (from) where.recordedAt.gte = from;
      if (to) where.recordedAt.lte = to;
    }

    if (dataType) {
      where.dataType = dataType;
    }

    // 데이터 조회
    const data = await prisma.wearableData.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        source: true,
        dataType: true,
        value: true,
        unit: true,
        recordedAt: true
      }
    });

    // 타입별 요약 통계
    const summary: Record<string, { count: number; avg: number; min: number; max: number }> = {};
    
    for (const item of data) {
      if (!summary[item.dataType]) {
        summary[item.dataType] = { count: 0, avg: 0, min: Infinity, max: -Infinity };
      }
      const s = summary[item.dataType];
      s.count++;
      s.avg = (s.avg * (s.count - 1) + item.value) / s.count;
      s.min = Math.min(s.min, item.value);
      s.max = Math.max(s.max, item.value);
    }

    // Infinity 처리
    for (const key of Object.keys(summary)) {
      if (summary[key].min === Infinity) summary[key].min = 0;
      if (summary[key].max === -Infinity) summary[key].max = 0;
    }

    return NextResponse.json({
      success: true,
      data,
      summary,
      count: data.length
    });

  } catch (error) {
    console.error('Wearable Data GET Error:', error);
    return NextResponse.json(
      { error: '웨어러블 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST: 웨어러블 데이터 배치 저장
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 요청 본문 파싱
    const body = await request.json();
    const validation = postBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: '입력 데이터가 올바르지 않습니다.',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { source, data } = validation.data;

    // 배치 저장 (트랜잭션)
    const created = await prisma.$transaction(
      data.map(item => 
        prisma.wearableData.create({
          data: {
            userId: user.id,
            source,
            dataType: item.dataType,
            value: item.value,
            unit: item.unit || null,
            recordedAt: new Date(item.recordedAt)
          },
          select: { id: true, dataType: true, recordedAt: true }
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `${created.length}개의 데이터가 저장되었습니다.`,
      data: created
    }, { status: 201 });

  } catch (error) {
    console.error('Wearable Data POST Error:', error);
    return NextResponse.json(
      { error: '웨어러블 데이터 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
