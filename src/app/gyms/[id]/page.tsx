/**
 * @file page.tsx
 * @description 헬스장 상세 페이지
 * 
 * 헬스장 상세 정보를 표시하는 페이지입니다.
 * 
 * 주요 기능:
 * - 헬스장 기본 정보 표시
 * - 시설 정보 표시
 * - 운영시간 표시
 * - 리뷰 목록 및 태그 통계 표시
 * - 즐겨찾기 및 리뷰 작성 버튼
 * - 네이버맵 길찾기 (선택)
 * 
 * @dependencies
 * - @/components/gym-detail/gym-basic-info: 기본 정보 컴포넌트
 * - @/components/gym-detail/gym-facilities: 시설 정보 컴포넌트
 * - @/components/gym-detail/gym-operating-hours: 운영시간 컴포넌트
 * - @/components/gym-detail/gym-reviews: 리뷰 컴포넌트
 * - @/components/gym-detail/gym-actions: 액션 버튼 컴포넌트
 * - @/components/gym-detail/gym-map-directions: 네이버맵 길찾기 컴포넌트 (선택)
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { GymBasicInfo } from '@/components/gym-detail/gym-basic-info';
import { GymFacilities } from '@/components/gym-detail/gym-facilities';
import { GymOperatingHours } from '@/components/gym-detail/gym-operating-hours';
import { GymReviews } from '@/components/gym-detail/gym-reviews';
import { GymActions } from '@/components/gym-detail/gym-actions';
import { GymMapDirections } from '@/components/gym-detail/gym-map-directions';
import type { GymDetailResponse } from '@/types/gym-detail';

interface GymDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getGymDetail(id: string): Promise<GymDetailResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/gyms/${id}`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      notFound();
    }
    throw new Error('Failed to fetch gym details');
  }

  return res.json();
}

export default async function GymDetailPage({ params }: GymDetailPageProps) {
  const { id } = await params;
  const response = await getGymDetail(id);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch gym details');
  }

  const gym = response.data;

  // 현재 사용자의 DB userId 가져오기 (리뷰 수정 버튼 표시용)
  let currentUserId: string | null = null;
  const user = await currentUser();
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true },
    });
    currentUserId = dbUser?.id || null;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl pb-24">
      {/* 뒤로가기 버튼 */}
      <Link
        href="/gyms"
        className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" strokeWidth={1.5} />
        목록으로
      </Link>

      {/* 컨텐츠 */}
      <div className="space-y-6">
        <GymBasicInfo gym={gym} />
        <GymFacilities facilities={gym.facilities} />
        <GymOperatingHours hours={gym.operatingHours} />
        <GymReviews reviews={gym.reviews} tagStats={gym.reviewTagStats} gymId={gym.id} currentUserId={currentUserId} />
        <GymMapDirections gym={gym} />
      </div>

      {/* 액션 버튼 */}
      <GymActions gymId={gym.id} gymName={gym.name} gymAddress={gym.address} initialIsFavorite={gym.isFavorite} />
    </div>
  );
}
