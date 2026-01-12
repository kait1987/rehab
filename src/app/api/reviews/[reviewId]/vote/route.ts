/**
 * P2-S2-04: 리뷰 투표 API
 * POST /api/reviews/[reviewId]/vote - 투표 추가
 * DELETE /api/reviews/[reviewId]/vote - 투표 취소
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { reviewId } = await params;

    // 사용자 조회
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

    // 리뷰 존재 확인
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true }
    });

    if (!review) {
      return NextResponse.json(
        { error: '리뷰를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 투표했는지 확인
    const existingVote = await prisma.reviewVote.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: user.id,
        }
      }
    });

    if (existingVote) {
      return NextResponse.json(
        { error: '이미 투표하셨습니다.', voted: true },
        { status: 409 }
      );
    }

    // 투표 생성
    await prisma.reviewVote.create({
      data: {
        reviewId,
        userId: user.id,
      }
    });

    // 총 투표 수 조회
    const voteCount = await prisma.reviewVote.count({
      where: { reviewId }
    });

    return NextResponse.json({
      success: true,
      voted: true,
      voteCount,
      message: '도움이 돼요를 눌렀습니다.'
    }, { status: 201 });

  } catch (error) {
    console.error('Vote API Error:', error);
    return NextResponse.json(
      { error: '투표 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { reviewId } = await params;

    // 사용자 조회
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

    // 투표 삭제
    await prisma.reviewVote.deleteMany({
      where: {
        reviewId,
        userId: user.id,
      }
    });

    // 총 투표 수 조회
    const voteCount = await prisma.reviewVote.count({
      where: { reviewId }
    });

    return NextResponse.json({
      success: true,
      voted: false,
      voteCount,
      message: '투표가 취소되었습니다.'
    });

  } catch (error) {
    console.error('Vote Delete API Error:', error);
    return NextResponse.json(
      { error: '투표 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
