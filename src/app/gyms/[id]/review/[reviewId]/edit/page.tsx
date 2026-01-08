/**
 * @file page.tsx
 * @description 리뷰 수정 페이지
 * 
 * 헬스장 리뷰를 수정하는 페이지입니다.
 * 
 * 주요 기능:
 * - 기존 리뷰 데이터 로드
 * - 리뷰 태그 목록 로드
 * - ReviewForm 컴포넌트에 초기값 전달
 * 
 * @dependencies
 * - @/components/gym-detail/review-form: 리뷰 작성 폼 컴포넌트
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ReviewForm } from '@/components/gym-detail/review-form';

interface ReviewEditPageProps {
  params: Promise<{ id: string; reviewId: string }>;
}

async function getReviewData(reviewId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/reviews/${reviewId}`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 404 || res.status === 403) {
      notFound();
    }
    throw new Error('Failed to fetch review data');
  }

  const data = await res.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to fetch review data');
  }

  return data.data;
}

async function getReviewTags() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/review-tags`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch review tags');
  }

  const data = await res.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to fetch review tags');
  }

  return data.data;
}

export default async function ReviewEditPage({ params }: ReviewEditPageProps) {
  const { id: gymId, reviewId } = await params;
  const [reviewData, tags] = await Promise.all([
    getReviewData(reviewId),
    getReviewTags(),
  ]);

  // 24시간 이내 확인
  const now = new Date();
  const createdAt = new Date(reviewData.createdAt);
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceCreation > 24) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl pb-24">
        <Link
          href={`/gyms/${gymId}`}
          className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" strokeWidth={1.5} />
          헬스장 상세로
        </Link>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">리뷰 수정 기간이 지났습니다</p>
          <p className="text-sm text-muted-foreground">
            리뷰는 작성 후 24시간 이내에만 수정할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl pb-24">
      {/* 뒤로가기 버튼 */}
      <Link
        href={`/gyms/${gymId}`}
        className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" strokeWidth={1.5} />
        헬스장 상세로
      </Link>

      {/* 페이지 제목 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">리뷰 수정</h1>
        <p className="text-muted-foreground">{reviewData.gymName}</p>
      </div>

      {/* 리뷰 수정 폼 */}
      <ReviewForm
        gymId={gymId}
        tags={tags}
        reviewId={reviewId}
        initialTagIds={reviewData.tagIds}
        initialComment={reviewData.comment || ''}
        isEdit={true}
      />
    </div>
  );
}

