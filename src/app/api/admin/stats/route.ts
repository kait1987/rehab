/**
 * Admin Stats API
 * 
 * 관리자 대시보드 지표를 제공합니다.
 * 관리자만 접근 가능합니다.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireAdmin, UnauthorizedError } from '@/lib/auth/admin-guard';

export async function GET() {
  try {
    await requireAdmin();

    // 병렬로 집계 쿼리 실행
    const [
      totalUsers,
      todayCourses,
      newReviews,
      pendingReports
    ] = await Promise.all([
      // 총 사용자 수
      prisma.user.count(),
      
      // 오늘 생성된 코스 수
      prisma.course.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // 최근 7일 신규 리뷰 수
      prisma.review.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          isDeleted: false
        }
      }),
      
      // 대기 중인 제보 수 (gym_reports 테이블이 없으면 0 반환)
      Promise.resolve(0) // Phase 2 S4에서 테이블 생성 후 활성화
    ]);

    return NextResponse.json({
      totalUsers,
      todayCourses,
      newReviews,
      pendingReports
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
