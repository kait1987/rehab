/**
 * @file page.tsx
 * @description 리뷰 작성 페이지
 * 
 * 헬스장에 리뷰를 작성하는 페이지입니다.
 * 
 * 주요 기능:
 * - 리뷰 태그 선택
 * - 코멘트 입력 (선택)
 * - 리뷰 제출
 * - 중복 제출 방지
 * 
 * @dependencies
 * - @/components/gym-detail/review-form: 리뷰 작성 폼 컴포넌트
 */

import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ReviewForm } from '@/components/gym-detail/review-form';

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

async function getGymName(id: string): Promise<string> {
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

  const data = await res.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to fetch gym details');
  }

  return data.data.name;
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

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;
  
  // ❌ 로그인 안 된 사용자: 강제 리다이렉트
  const user = await currentUser();
  if (!user) {
    redirect(`/gyms/${id}`);
  }

  const [gymName, tags] = await Promise.all([getGymName(id), getReviewTags()]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl pb-24">
      {/* 뒤로가기 버튼 */}
      <Link
        href={`/gyms/${id}`}
        className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" strokeWidth={1.5} />
        헬스장 상세로
      </Link>

      {/* 페이지 제목 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">리뷰 작성</h1>
        <p className="text-muted-foreground">{gymName}</p>
      </div>

      {/* 리뷰 작성 폼 */}
      <ReviewForm gymId={id} tags={tags} />
    </div>
  );
}

