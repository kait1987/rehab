/**
 * P2-LOC-S1-05: 관리자 제보 목록 API
 * GET /api/admin/reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  try {
    // 1. Admin 권한 확인
    const { userId: clerkId, sessionClaims } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const isAdmin = (sessionClaims?.metadata as { role?: string })?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    // 2. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // 3. 필터 조건
    const where: { status?: string } = {};
    if (status !== 'all') {
      where.status = status;
    }

    // 4. 제보 목록 조회
    const [reports, total] = await Promise.all([
      prisma.gymReport.findMany({
        where,
        include: {
          gym: { select: { id: true, name: true, address: true } },
          user: { select: { id: true, email: true, displayName: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.gymReport.count({ where })
    ]);

    return NextResponse.json({
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Admin Reports API Error:', error);
    return NextResponse.json(
      { error: '제보 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
