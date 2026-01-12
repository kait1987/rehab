/**
 * @file route.ts
 * @description 헬스장 상세 정보 조회 API 엔드포인트
 * 
 * GET /api/gyms/[id]
 * 
 * 헬스장 ID로 상세 정보를 조회합니다.
 * 
 * @dependencies
 * - lib/prisma/client: Prisma 클라이언트
 * - types/gym-detail: 타입 정의
 * - @clerk/nextjs/server: Clerk 인증
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { calculateTrustScore } from '@/lib/utils/calculate-trust-score';
import type { GymDetailResponse, GymDetail, ReviewWithTags, ReviewTagStats } from '@/types/gym-detail';
import type { OperatingHours } from '@/types/operating-hours';
import type { GymFacilities } from '@/types/gym-search';

/**
 * GET 요청 처리
 * 
 * 헬스장 상세 정보를 조회하고 반환합니다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 헬스장 기본 정보 조회
    const gym = await prisma.gym.findUnique({
      where: { id },
      include: {
        facilities: {
          select: {
            hasRehabEquipment: true,
            hasPtCoach: true,
            hasShower: true,
            hasParking: true,
            hasLocker: true,
            otherFacilities: true,
          },
        },
        operatingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
        reviews: {
          where: { isDeleted: false },
          include: {
            reviewTagMappings: {
              include: {
                reviewTag: true,
              },
            },
            _count: {
              select: { votes: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!gym) {
      return NextResponse.json(
        {
          success: false,
          error: '헬스장을 찾을 수 없습니다.',
        } as GymDetailResponse,
        { status: 404 }
      );
    }

    // 2. 현재 사용자 확인 (즐겨찾기 여부 확인용)
    const user = await currentUser();
    let isFavorite = false;
    let votedReviewIds: Set<string> = new Set();

    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
      });

      if (dbUser) {
        const favorite = await prisma.userFavorite.findFirst({
          where: {
            userId: dbUser.id,
            gymId: id,
          },
        });
        isFavorite = !!favorite;

        // 사용자가 투표한 리뷰 ID 목록 조회
        const userVotes = await prisma.reviewVote.findMany({
          where: {
            userId: dbUser.id,
            reviewId: { in: gym.reviews.map(r => r.id) },
          },
          select: { reviewId: true },
        });
        votedReviewIds = new Set(userVotes.map(v => v.reviewId));
      }
    }

    // 3. 시설 정보 변환
    const facilities: GymFacilities = gym.facilities
      ? {
          hasRehabEquipment: gym.facilities.hasRehabEquipment,
          hasPtCoach: gym.facilities.hasPtCoach,
          hasShower: gym.facilities.hasShower,
          hasParking: gym.facilities.hasParking,
          hasLocker: gym.facilities.hasLocker,
          otherFacilities: gym.facilities.otherFacilities || [],
        }
      : {
          hasRehabEquipment: false,
          hasPtCoach: false,
          hasShower: false,
          hasParking: false,
          hasLocker: false,
          otherFacilities: [],
        };

    // 4. 운영시간 변환 (요일별 7개 고정)
    const operatingHoursMap = new Map<number, OperatingHours>();
    
    // DB에서 가져온 운영시간을 Map에 저장
    gym.operatingHours.forEach((hour) => {
      operatingHoursMap.set(hour.dayOfWeek, {
        dayOfWeek: hour.dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
        isClosed: hour.isClosed,
        notes: hour.notes || null,
      });
    });

    // 7개 요일 모두 채우기 (없는 요일은 기본값)
    const operatingHours: OperatingHours[] = [];
    for (let day = 0; day < 7; day++) {
      if (operatingHoursMap.has(day)) {
        operatingHours.push(operatingHoursMap.get(day)!);
      } else {
        operatingHours.push({
          dayOfWeek: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          openTime: null,
          closeTime: null,
          isClosed: true,
          notes: null,
        });
      }
    }

    // P2-F2-01/02: 리뷰에 trustScore 추가 및 정렬
    const reviews: (ReviewWithTags & { voteCount: number; hasVoted: boolean; trustScore: number; tier: string })[] = gym.reviews
      .map((review) => {
        const voteCount = review._count.votes;
        const trustResult = calculateTrustScore({
          voteCount,
          authorTotalReviews: 1, // 간단화: 향후 작성자별 리뷰 수 집계 가능
          hasImages: false, // 현재 이미지 필드 없음
        });
        return {
          id: review.id,
          userId: review.userId,
          comment: review.comment,
          isAdminReview: review.isAdminReview,
          tags: review.reviewTagMappings.map((mapping) => ({
            id: mapping.reviewTag.id,
            name: mapping.reviewTag.name,
            category: mapping.reviewTag.category,
          })),
          createdAt: review.createdAt,
          voteCount,
          hasVoted: votedReviewIds.has(review.id),
          trustScore: trustResult.score,
          tier: trustResult.tier,
        };
      })
      .sort((a, b) => b.trustScore - a.trustScore); // 신뢰도순 정렬

    // 6. 리뷰 태그 통계 계산
    const tagStatsMap = new Map<string, { name: string; category: string | null; count: number }>();
    
    gym.reviews.forEach((review) => {
      review.reviewTagMappings.forEach((mapping) => {
        const tagId = mapping.reviewTag.id;
        const existing = tagStatsMap.get(tagId);
        
        if (existing) {
          existing.count += 1;
        } else {
          tagStatsMap.set(tagId, {
            name: mapping.reviewTag.name,
            category: mapping.reviewTag.category,
            count: 1,
          });
        }
      });
    });

    const reviewTagStats: ReviewTagStats[] = Array.from(tagStatsMap.entries()).map(([tagId, data]) => ({
      tagId,
      tagName: data.name,
      tagCategory: data.category,
      count: data.count,
    }));

    // 7. GymDetail 객체 생성
    const gymDetail: GymDetail = {
      id: gym.id,
      name: gym.name,
      address: gym.address,
      latitude: Number(gym.latitude),
      longitude: Number(gym.longitude),
      phone: gym.phone,
      website: gym.website,
      priceRange: gym.priceRange,
      description: gym.description,
      isActive: gym.isActive,
      facilities,
      operatingHours,
      reviews,
      reviewTagStats,
      isFavorite,
      createdAt: gym.createdAt,
      updatedAt: gym.updatedAt,
    };

    // 8. 응답 반환 (GymDetailResponse 형식)
    return NextResponse.json(
      {
        success: true,
        data: gymDetail,
      } as GymDetailResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('[GymDetailAPI] 에러 발생:', error);

    // 에러 타입에 따라 다른 응답
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: `서버 에러: ${error.message}`,
        } as GymDetailResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: '알 수 없는 서버 에러가 발생했습니다.',
      } as GymDetailResponse,
      { status: 500 }
    );
  }
}

