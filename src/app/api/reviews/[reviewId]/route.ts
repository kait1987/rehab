/**
 * @file route.ts
 * @description 리뷰 상세 조회 및 수정 API 엔드포인트
 * 
 * GET /api/reviews/[reviewId] - 리뷰 상세 조회
 * PUT /api/reviews/[reviewId] - 리뷰 수정 (24시간 이내만 가능)
 * DELETE /api/reviews/[reviewId] - 리뷰 삭제 (soft delete)
 * 
 * @dependencies
 * - lib/prisma/client: Prisma 클라이언트
 * - @clerk/nextjs/server: Clerk 인증
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';

/**
 * GET 요청 처리
 * 
 * 리뷰 상세 정보를 조회합니다.
 * 작성자만 접근 가능합니다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;

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

    // 3. 리뷰 조회
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewTagMappings: {
          include: {
            reviewTag: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          error: '리뷰를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    // 4. 작성자 확인
    if (review.userId !== dbUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: '본인의 리뷰만 조회할 수 있습니다.',
        },
        { status: 403 }
      );
    }

    // 5. 응답 반환
    return NextResponse.json(
      {
        success: true,
        data: {
          id: review.id,
          gymId: review.gymId,
          gymName: review.gym.name,
          comment: review.comment,
          tagIds: review.reviewTagMappings.map((mapping) => mapping.reviewTag.id),
          tags: review.reviewTagMappings.map((mapping) => ({
            id: mapping.reviewTag.id,
            name: mapping.reviewTag.name,
            category: mapping.reviewTag.category,
          })),
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ReviewGetAPI] 에러 발생:', error);

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

/**
 * 리뷰 수정 요청 본문
 */
interface UpdateReviewRequest {
  tagIds: string[];
  comment?: string | null;
}

/**
 * PUT 요청 처리
 * 
 * 리뷰를 수정합니다.
 * - 작성자만 수정 가능
 * - 작성 후 24시간 이내만 수정 가능
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;

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

    // 3. 리뷰 조회
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          error: '리뷰를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    // 4. 작성자 확인
    if (review.userId !== dbUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: '본인의 리뷰만 수정할 수 있습니다.',
        },
        { status: 403 }
      );
    }

    // 5. 24시간 이내 확인
    const now = new Date();
    const createdAt = new Date(review.createdAt);
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      return NextResponse.json(
        {
          success: false,
          error: '리뷰는 작성 후 24시간 이내에만 수정할 수 있습니다.',
        },
        { status: 400 }
      );
    }

    // 6. 요청 본문 파싱 및 검증
    const body: unknown = await request.json();
    const { tagIds, comment }: UpdateReviewRequest = body as UpdateReviewRequest;

    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '최소 1개 이상의 태그를 선택해야 합니다.',
        },
        { status: 400 }
      );
    }

    // 7. 태그 존재 확인
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

    // 8. 트랜잭션으로 리뷰 및 태그 매핑 업데이트
    const result = await prisma.$transaction(async (tx) => {
      // 리뷰 업데이트
      const updatedReview = await tx.review.update({
        where: { id: reviewId },
        data: {
          comment: comment || null,
          updatedAt: now,
        },
      });

      // 기존 태그 매핑 삭제
      await tx.reviewTagMapping.deleteMany({
        where: { reviewId },
      });

      // 새로운 태그 매핑 생성
      const tagMappings = await Promise.all(
        tagIds.map((tagId) =>
          tx.reviewTagMapping.create({
            data: {
              reviewId,
              reviewTagId: tagId,
            },
          })
        )
      );

      return { review: updatedReview, tagMappings };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          reviewId: result.review.id,
          message: '리뷰가 성공적으로 수정되었습니다.',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ReviewUpdateAPI] 에러 발생:', error);

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

/**
 * DELETE 요청 처리
 * 
 * 리뷰를 삭제합니다 (soft delete).
 * - 작성자만 삭제 가능
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;

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

    // 3. 리뷰 조회
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          error: '리뷰를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    // 4. 작성자 확인
    if (review.userId !== dbUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: '본인의 리뷰만 삭제할 수 있습니다.',
        },
        { status: 403 }
      );
    }

    // 5. Soft delete
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: '리뷰가 성공적으로 삭제되었습니다.',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ReviewDeleteAPI] 에러 발생:', error);

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

