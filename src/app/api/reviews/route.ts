/**
 * @file route.ts
 * @description 리뷰 작성 API 엔드포인트
 * 
 * POST /api/reviews
 * 
 * 헬스장 리뷰를 작성합니다.
 * 
 * @dependencies
 * - lib/prisma/client: Prisma 클라이언트
 * - @clerk/nextjs/server: Clerk 인증
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';

/**
 * 리뷰 작성 요청 본문
 */
interface CreateReviewRequest {
  gymId: string;
  tagIds: string[];
  comment?: string | null;
}

/**
 * POST 요청 처리
 * 
 * 리뷰를 작성하고 태그 매핑을 저장합니다.
 * 중복 제출 방지: 같은 사용자가 같은 헬스장에 이미 리뷰를 작성했는지 확인합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: '로그인이 필요합니다.',
        },
        { status: 401 }
      );
    }

    // 2. DB 사용자 확인
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 정보를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    // 3. 요청 본문 파싱 및 검증
    const body: unknown = await request.json();
    const { gymId, tagIds, comment }: CreateReviewRequest = body as CreateReviewRequest;

    if (!gymId || typeof gymId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: '헬스장 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }

    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '최소 1개 이상의 태그를 선택해야 합니다.',
        },
        { status: 400 }
      );
    }

    // 4. 헬스장 존재 확인
    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym) {
      return NextResponse.json(
        {
          success: false,
          error: '헬스장을 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    // 5. 중복 제출 방지: 같은 사용자가 같은 헬스장에 이미 리뷰를 작성했는지 확인
    const existingReview = await prisma.review.findFirst({
      where: {
        gymId,
        userId: dbUser.id,
        isDeleted: false,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          error: '이미 이 헬스장에 리뷰를 작성하셨습니다.',
        },
        { status: 400 }
      );
    }

    // 6. 태그 존재 확인
    const tags = await prisma.reviewTag.findMany({
      where: {
        id: { in: tagIds },
        isActive: true,
      },
    });

    if (tags.length !== tagIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: '일부 태그를 찾을 수 없거나 비활성화되었습니다.',
        },
        { status: 400 }
      );
    }

    // 7. 트랜잭션으로 리뷰 및 태그 매핑 저장
    const result = await prisma.$transaction(async (tx) => {
      // 리뷰 생성
      const review = await tx.review.create({
        data: {
          gymId,
          userId: dbUser.id,
          comment: comment || null,
          isAdminReview: false,
          isDeleted: false,
        },
      });

      // 태그 매핑 생성
      const tagMappings = await Promise.all(
        tagIds.map((tagId) =>
          tx.reviewTagMapping.create({
            data: {
              reviewId: review.id,
              reviewTagId: tagId,
            },
          })
        )
      );

      return { review, tagMappings };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          reviewId: result.review.id,
          message: '리뷰가 성공적으로 작성되었습니다.',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[ReviewCreateAPI] 에러 발생:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: `서버 에러: ${error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: '알 수 없는 서버 에러가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

