/**
 * @file review-form.tsx
 * @description 리뷰 작성 폼 컴포넌트
 * 
 * 헬스장 리뷰를 작성하는 폼 컴포넌트입니다.
 * 
 * 주요 기능:
 * - 태그 다중 선택 (최소 1개 필수)
 * - 코멘트 입력 (선택)
 * - 리뷰 제출
 * - 중복 제출 방지
 * - 에러 처리
 * 
 * @dependencies
 * - @/components/ui/card: Card 컴포넌트
 * - @/components/ui/button: Button 컴포넌트
 * - @/components/ui/badge: Badge 컴포넌트
 * - @/components/ui/textarea: Textarea 컴포넌트
 * - @/components/ui/alert: Alert 컴포넌트
 * - lucide-react: 아이콘
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewTag {
  id: string;
  name: string;
  category: string | null;
  displayOrder: number;
}

interface ReviewFormProps {
  gymId: string;
  tags: ReviewTag[];
  reviewId?: string;
  initialTagIds?: string[];
  initialComment?: string;
  isEdit?: boolean;
}

export function ReviewForm({
  gymId,
  tags,
  reviewId,
  initialTagIds = [],
  initialComment = '',
  isEdit = false,
}: ReviewFormProps) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);
  const [comment, setComment] = useState(initialComment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 추가 안전장치 (클라이언트 사이드)
  if (isLoaded && !isSignedIn) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
            <AlertDescription>
              로그인 후 이용 가능합니다.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // 태그를 카테고리별로 그룹화
  const tagsByCategory = tags.reduce(
    (acc, tag) => {
      const category = tag.category || '기타';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(tag);
      return acc;
    },
    {} as Record<string, ReviewTag[]>
  );

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
    setError(null);
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (selectedTagIds.length === 0) {
      setError('최소 1개 이상의 태그를 선택해주세요.');
      return;
    }

    if (comment && comment.length > 500) {
      setError('코멘트는 500자 이하로 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEdit && reviewId ? `/api/reviews/${reviewId}` : '/api/reviews';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(isEdit ? {} : { gymId }),
          tagIds: selectedTagIds,
          comment: comment.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || (isEdit ? '리뷰 수정에 실패했습니다.' : '리뷰 작성에 실패했습니다.'));
      }

      setSuccess(true);
      
      // 성공 후 헬스장 상세 페이지로 리다이렉트
      setTimeout(() => {
        router.push(`/gyms/${gymId}`);
      }, 1500);
    } catch (err) {
      console.error('Review submit error:', err);
      setError(err instanceof Error ? err.message : (isEdit ? '리뷰 수정에 실패했습니다.' : '리뷰 작성에 실패했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">
          {isEdit ? '리뷰 수정' : '리뷰 작성'}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          최소 1개 이상의 태그를 선택해주세요. 코멘트는 선택 사항입니다.
          {isEdit && (
            <span className="block mt-1 text-xs text-yellow-500">
              리뷰는 작성 후 24시간 이내에만 수정할 수 있습니다.
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 성공 메시지 */}
        {success && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" strokeWidth={1.5} />
            <AlertDescription className="text-green-500">
              {isEdit ? '리뷰가 성공적으로 수정되었습니다.' : '리뷰가 성공적으로 작성되었습니다.'} 헬스장 상세 페이지로 이동합니다...
            </AlertDescription>
          </Alert>
        )}

        {/* 에러 메시지 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 태그 선택 */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              태그 선택 <span className="text-sm text-muted-foreground font-normal">(필수)</span>
            </h3>
            <div className="space-y-4">
              {Object.entries(tagsByCategory).map(([category, categoryTags]) => (
                <div key={category}>
                  <p className="text-sm font-medium text-muted-foreground mb-2">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {categoryTags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <Badge
                          key={tag.id}
                          variant={isSelected ? 'default' : 'outline'}
                          className={cn(
                            'cursor-pointer transition-all duration-200 text-sm px-3 py-1.5',
                            isSelected
                              ? 'bg-primary hover:bg-primary-hover text-white border-primary'
                              : 'bg-secondary/50 hover:bg-secondary/70 text-foreground border-border hover:border-primary/50'
                          )}
                          onClick={() => handleTagToggle(tag.id)}
                        >
                          {tag.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {selectedTagIds.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedTagIds.length}개 태그 선택됨
              </p>
            )}
          </div>
        </div>

        {/* 코멘트 입력 */}
        <div className="space-y-2">
          <label htmlFor="comment" className="text-sm font-medium text-foreground">
            코멘트 <span className="text-muted-foreground font-normal">(선택)</span>
          </label>
          <Textarea
            id="comment"
            placeholder="코멘트를 입력하세요 (선택 사항)"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setError(null);
            }}
            maxLength={500}
            rows={5}
            className="resize-none"
            data-testid="review-comment"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              최대 500자까지 입력 가능합니다.
            </p>
            <p className="text-xs text-muted-foreground">
              {comment.length}/500
            </p>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => router.push(`/gyms/${gymId}`)}
            variant="outline"
            className="flex-1"
            disabled={isSubmitting || success}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || success || selectedTagIds.length === 0}
            className="flex-1 bg-primary hover:bg-primary-hover text-white"
            data-testid="submit-review"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
                {isEdit ? '수정 중...' : '제출 중...'}
              </>
            ) : (
              isEdit ? '리뷰 수정' : '리뷰 작성'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

