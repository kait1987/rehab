/**
 * P2-LOC-S1-06: 관리자 제보 처리 API
 * PATCH /api/admin/reports/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reviewNote: z.string().max(500).optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 2. 파라미터 추출
    const { id: reportId } = await params;

    // 3. 제보 존재 확인
    const report = await prisma.gymReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      return NextResponse.json({ error: '제보를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (report.status !== 'pending') {
      return NextResponse.json(
        { error: '이미 처리된 제보입니다.' },
        { status: 400 }
      );
    }

    // 4. 요청 본문 파싱
    const body = await request.json();
    const validation = actionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const { action, reviewNote } = validation.data;

    // 5. 관리자 사용자 조회
    const admin = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    // 6. 제보 상태 업데이트
    const updatedReport = await prisma.gymReport.update({
      where: { id: reportId },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: admin?.id || null,
        reviewNote: reviewNote || null,
        reviewedAt: new Date()
      },
      select: {
        id: true,
        status: true,
        reviewedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedReport,
      message: action === 'approve' ? '제보가 승인되었습니다.' : '제보가 거절되었습니다.'
    });

  } catch (error) {
    console.error('Admin Report Action Error:', error);
    return NextResponse.json(
      { error: '제보 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
