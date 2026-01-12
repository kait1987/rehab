/**
 * P2-LOC-S1-03: 헬스장 제보 API
 * POST /api/gyms/[id]/report
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// 제보 타입
const REPORT_TYPES = ['info_wrong', 'closed', 'moved', 'hours_changed', 'other'] as const;

// 필드 이름
const FIELD_NAMES = ['name', 'address', 'phone', 'website', 'operatingHours', 'facilities', 'other'] as const;

// 요청 스키마
const reportSchema = z.object({
  reportType: z.enum(REPORT_TYPES),
  fieldName: z.enum(FIELD_NAMES).optional(),
  currentValue: z.string().max(500).optional(),
  suggestedValue: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 인증 확인
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. 파라미터 추출
    const { id: gymId } = await params;

    // 3. 헬스장 존재 확인
    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
      select: { id: true, name: true }
    });

    if (!gym) {
      return NextResponse.json(
        { error: '헬스장을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 4. 사용자 조회 (DB에서 userId 가져오기)
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 5. 요청 본문 파싱 및 검증
    const body = await request.json();
    const validation = reportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { reportType, fieldName, currentValue, suggestedValue, description } = validation.data;

    // 6. 제보 생성 (status는 항상 pending, userId는 서버에서 주입)
    const report = await prisma.gymReport.create({
      data: {
        gymId,
        userId: user.id,
        reportType,
        fieldName: fieldName || null,
        currentValue: currentValue || null,
        suggestedValue: suggestedValue || null,
        description: description || null,
        status: 'pending',
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: report,
      message: '제보가 접수되었습니다. 관리자 검토 후 반영됩니다.'
    }, { status: 201 });

  } catch (error) {
    console.error('Report API Error:', error);
    return NextResponse.json(
      { error: '제보 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
