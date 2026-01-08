/**
 * @file route.ts
 * @description 리뷰 태그 목록 조회 API 엔드포인트
 * 
 * GET /api/review-tags
 * 
 * 활성화된 리뷰 태그 목록을 조회합니다.
 * displayOrder 기준으로 정렬하여 반환합니다.
 * 
 * @dependencies
 * - lib/prisma/client: Prisma 클라이언트
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

/**
 * GET 요청 처리
 * 
 * 활성화된 리뷰 태그 목록을 조회하고 반환합니다.
 */
export async function GET() {
  try {
    const tags = await prisma.reviewTag.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        category: true,
        displayOrder: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: tags,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ReviewTagsAPI] 에러 발생:', error);

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

