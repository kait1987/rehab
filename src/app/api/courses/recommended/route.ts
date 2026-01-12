/**
 * Recommended Course API
 * 
 * 사용자 프로필 기반 오늘의 추천 코스를 제공합니다.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자 조회
    const user = await prisma.user.findFirst({
      where: { clerkId: userId },
      include: {
        userPainProfiles: {
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        userCourseHistory: {
          orderBy: { savedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!user) {
      return NextResponse.json({
        recommended: null,
        reason: '사용자 프로필을 찾을 수 없습니다.'
      });
    }

    // 추천 로직
    let reason = '';
    let suggestedBodyParts: string[] = [];
    let suggestedDuration = 60;

    // 1. 통증 프로필 기반 추천
    if (user.userPainProfiles.length > 0) {
      const recentPain = user.userPainProfiles[0];
      suggestedBodyParts.push(recentPain.bodyPartId);
      reason = '최근 통증 부위 중심 운동을 추천합니다.';
    }

    // 2. 최근 운동 기록 분석
    if (user.userCourseHistory.length > 0) {
      if (!reason) {
        reason = '꾸준한 운동을 위해 오늘도 시작해보세요!';
      }
      // 평균 60분 기본값 사용
      suggestedDuration = 60;
    }

    // 기본값
    if (!reason) {
      reason = '오늘도 건강한 하루를 위한 운동을 시작해보세요!';
      suggestedDuration = 60;
    }

    return NextResponse.json({
      recommended: {
        duration: suggestedDuration,
        bodyParts: suggestedBodyParts,
        intensity: 'moderate'
      },
      reason
    });
  } catch (error) {
    console.error('Recommended course error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

