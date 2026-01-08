/**
 * @file route.ts
 * @description 헬스장 즐겨찾기 추가/제거 API 엔드포인트
 * 
 * POST /api/gyms/[id]/favorite - 즐겨찾기 추가
 * DELETE /api/gyms/[id]/favorite - 즐겨찾기 제거
 * 
 * @dependencies
 * - lib/prisma/client: Prisma 클라이언트
 * - @clerk/nextjs/server: Clerk 인증
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';

/**
 * POST: 즐겨찾기 추가
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // DB 사용자 조회
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 중복 체크
    const existing = await prisma.userFavorite.findFirst({
      where: {
        userId: dbUser.id,
        gymId: id,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already favorited' },
        { status: 400 }
      );
    }

    // 즐겨찾기 추가
    await prisma.userFavorite.create({
      data: {
        userId: dbUser.id,
        gymId: id,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[FavoriteAPI] POST 에러:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 즐겨찾기 제거
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // DB 사용자 조회
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 즐겨찾기 찾기
    const favorite = await prisma.userFavorite.findFirst({
      where: {
        userId: dbUser.id,
        gymId: id,
      },
    });

    if (!favorite) {
      return NextResponse.json(
        { success: false, error: 'Favorite not found' },
        { status: 404 }
      );
    }

    // 즐겨찾기 제거
    await prisma.userFavorite.delete({
      where: {
        id: favorite.id,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[FavoriteAPI] DELETE 에러:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

