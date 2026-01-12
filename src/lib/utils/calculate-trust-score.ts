/**
 * P2-F2-01: 리뷰 신뢰도 점수 계산 유틸
 * 
 * trustScore = (voteCount * 10) + (authorTotalReviews * 5) + (hasImages ? 15 : 0)
 * - score > 50: featured 추천
 * - score < 10 & 신고 2회 이상: 자동 숨김 후보
 */

export interface TrustScoreInput {
  voteCount: number;
  authorTotalReviews: number;
  hasImages: boolean;
  reportCount?: number;
}

export interface TrustScoreResult {
  score: number;
  tier: 'featured' | 'normal' | 'low_trust';
  shouldHide: boolean;
}

/**
 * 리뷰 신뢰도 점수 계산
 */
export function calculateTrustScore(input: TrustScoreInput): TrustScoreResult {
  const { voteCount, authorTotalReviews, hasImages, reportCount = 0 } = input;

  // 점수 계산
  const score = 
    (voteCount * 10) + 
    (authorTotalReviews * 5) + 
    (hasImages ? 15 : 0);

  // 티어 결정
  let tier: 'featured' | 'normal' | 'low_trust';
  if (score > 50) {
    tier = 'featured';
  } else if (score < 10 && reportCount >= 2) {
    tier = 'low_trust';
  } else {
    tier = 'normal';
  }

  // 숨김 여부 (티어가 low_trust이면 숨김 후보)
  const shouldHide = tier === 'low_trust';

  return { score, tier, shouldHide };
}

/**
 * 리뷰 배열에 trustScore 추가
 */
export function addTrustScoreToReviews<T extends { 
  voteCount: number; 
  userId?: string | null;
  hasImages?: boolean;
}>(
  reviews: T[],
  authorReviewCounts: Record<string, number>
): Array<T & TrustScoreResult> {
  return reviews.map(review => {
    const authorId = review.userId || 'anonymous';
    const trustResult = calculateTrustScore({
      voteCount: review.voteCount,
      authorTotalReviews: authorReviewCounts[authorId] || 1,
      hasImages: review.hasImages || false,
    });
    return { ...review, ...trustResult };
  });
}
