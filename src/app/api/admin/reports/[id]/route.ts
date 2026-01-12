/**
 * P2-LOC-S1-06: 관리자 제보 처리 API
 * PATCH /api/admin/reports/[id]
 * 
 * P2-F2-03: 승인 시 Gym 데이터 자동 업데이트 + 로그
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reviewNote: z.string().max(500).optional()
});

// 자동 업데이트 가능한 Gym 필드
const UPDATABLE_GYM_FIELDS = ['name', 'address', 'phone', 'website', 'priceRange', 'description'] as const;
type UpdatableGymField = typeof UPDATABLE_GYM_FIELDS[number];

function isUpdatableField(field: string | null | undefined): field is UpdatableGymField {
  return UPDATABLE_GYM_FIELDS.includes(field as UpdatableGymField);
}

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

    // 3. 제보 존재 확인 (Gym 정보 포함)
    const report = await prisma.gymReport.findUnique({
      where: { id: reportId },
      include: {
        gym: {
          select: { id: true, name: true, address: true, phone: true, website: true, priceRange: true, description: true }
        }
      }
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

    // 6. 승인 시 Gym 데이터 자동 업데이트 (P2-F2-03)
    let gymUpdated = false;
    let previousValue: string | null = null;
    
    if (action === 'approve' && report.fieldName && report.suggestedValue) {
      if (isUpdatableField(report.fieldName)) {
        // 현재 값 저장
        previousValue = report.gym[report.fieldName as keyof typeof report.gym] as string | null;
        
        // Gym 데이터 업데이트
        await prisma.gym.update({
          where: { id: report.gymId },
          data: {
            [report.fieldName]: report.suggestedValue,
            lastUpdatedAt: new Date()
          }
        });
        
        gymUpdated = true;
        
        // 업데이트 로그 (Event 테이블 활용)
        await prisma.event.create({
          data: {
            userId: admin?.id,
            eventName: 'gym_report_auto_update',
            eventData: {
              reportId,
              gymId: report.gymId,
              fieldName: report.fieldName,
              previousValue,
              newValue: report.suggestedValue,
              approvedBy: admin?.id
            }
          }
        });
      }
    }

    // 7. 제보 상태 업데이트
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
        reviewedAt: true,
        fieldName: true,
        suggestedValue: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedReport,
        gymUpdated,
        previousValue: gymUpdated ? previousValue : undefined
      },
      message: action === 'approve' 
        ? gymUpdated 
          ? `제보가 승인되었습니다. ${report.fieldName} 필드가 자동 업데이트되었습니다.`
          : '제보가 승인되었습니다.'
        : '제보가 거절되었습니다.'
    });

  } catch (error) {
    console.error('Admin Report Action Error:', error);
    return NextResponse.json(
      { error: '제보 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

