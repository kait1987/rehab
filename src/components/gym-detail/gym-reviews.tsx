/**
 * @file gym-reviews.tsx
 * @description 헬스장 리뷰 컴포넌트
 * 
 * 헬스장의 리뷰 목록과 태그 통계를 표시합니다.
 * 
 * 주요 기능:
 * - 리뷰 태그 통계 표시 (카테고리별 그룹화)
 * - 리뷰 목록 표시 (최신순)
 * - 작성일 상대 시간 표시
 * 
 * @dependencies
 * - @/components/ui/card: Card 컴포넌트
 * - @/components/ui/badge: Badge 컴포넌트
 * - date-fns: formatDistanceToNow, ko locale
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import type { ReviewTagStats, ReviewWithTags } from '@/types/gym-detail';

interface GymReviewsProps {
  reviews: ReviewWithTags[];
  tagStats: ReviewTagStats[];
  gymId: string;
  currentUserId: string | null;
}

export function GymReviews({ reviews, tagStats, gymId, currentUserId }: GymReviewsProps) {
  const router = useRouter();
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  
  // 태그 통계를 카테고리별로 그룹화
  const positiveStats = tagStats.filter((stat) => stat.tagCategory === 'positive');
  const negativeStats = tagStats.filter((stat) => stat.tagCategory === 'negative');

  // 24시간 이내인지 확인하는 함수
  const isWithin24Hours = (createdAt: Date): boolean => {
    const now = new Date();
    const created = new Date(createdAt);
    const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation <= 24;
  };

  // 본인 리뷰인지 확인하는 함수
  const isOwnReview = (reviewUserId: string | null): boolean => {
    return currentUserId !== null && reviewUserId === currentUserId;
  };

  // 리뷰 삭제 핸들러
  const handleDeleteReview = async (reviewId: string) => {
    setDeletingReviewId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '리뷰 삭제에 실패했습니다.');
      }

      // 성공 시 페이지 새로고침 (Server Component 데이터 갱신)
      router.refresh();
      // 추가로 현재 페이지로 리다이렉트하여 확실히 갱신
      router.push(`/gyms/${gymId}`);
    } catch (err) {
      console.error('Review delete error:', err);
      alert(err instanceof Error ? err.message : '리뷰 삭제에 실패했습니다.');
      setDeletingReviewId(null);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-foreground">
        리뷰 <span className="text-muted-foreground text-lg">({reviews.length})</span>
      </h2>

      {/* 리뷰 태그 통계 */}
      {tagStats.length > 0 && (
        <div className="mb-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">사용자 평가</h3>

          {/* 긍정적 태그 */}
          {positiveStats.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">좋아요</p>
              <div className="flex flex-wrap gap-2">
                {positiveStats
                  .sort((a, b) => b.count - a.count)
                  .map((stat) => (
                    <Badge key={stat.tagId} variant="default" className="text-sm">
                      {stat.tagName} {stat.count}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* 부정적 태그 */}
          {negativeStats.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">아쉬워요</p>
              <div className="flex flex-wrap gap-2">
                {negativeStats
                  .sort((a, b) => b.count - a.count)
                  .map((stat) => (
                    <Badge key={stat.tagId} variant="secondary" className="text-sm">
                      {stat.tagName} {stat.count}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 리뷰 목록 */}
      <div className="space-y-4 border-t border-border pt-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">아직 리뷰가 없습니다</p>
            <p className="text-sm text-muted-foreground">첫 번째 리뷰를 작성해보세요!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="border-b last:border-b-0 pb-4 last:pb-0"
            >
              {/* 리뷰 태그 */}
              {review.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {review.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={tag.category === 'positive' ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 리뷰 코멘트 */}
              {review.comment && (
                <p className="text-sm mb-2 leading-relaxed text-foreground">{review.comment}</p>
              )}

              {/* 작성일 및 액션 버튼 */}
              <div className="flex items-center justify-between gap-2">
                <time className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </time>
                
                {/* 수정/삭제 버튼 (본인 리뷰인 경우만) */}
                {isOwnReview(review.userId) && (
                  <div className="flex items-center gap-2">
                    {/* 수정 버튼 (24시간 이내인 경우만) */}
                    {isWithin24Hours(review.createdAt) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/gyms/${gymId}/review/${review.id}/edit`)}
                        className="h-7 px-2 text-xs text-primary hover:text-primary-hover"
                      >
                        <Edit2 className="h-3 w-3 mr-1" strokeWidth={1.5} />
                        수정
                      </Button>
                    )}
                    
                    {/* 삭제 버튼 */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive/80"
                          disabled={deletingReviewId === review.id}
                        >
                          {deletingReviewId === review.id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" strokeWidth={1.5} />
                          ) : (
                            <Trash2 className="h-3 w-3 mr-1" strokeWidth={1.5} />
                          )}
                          삭제
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>리뷰 삭제</AlertDialogTitle>
                          <AlertDialogDescription>
                            정말로 이 리뷰를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteReview(review.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

