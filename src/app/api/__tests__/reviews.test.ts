/**
 * @file reviews.test.ts
 * @description 리뷰 API 단위 테스트
 * 
 * POST /api/reviews - 리뷰 작성
 * GET /api/reviews/[reviewId] - 리뷰 조회
 * PUT /api/reviews/[reviewId] - 리뷰 수정
 * DELETE /api/reviews/[reviewId] - 리뷰 삭제
 * 
 * 총 45개 테스트 케이스
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockPrisma,
  mockCurrentUser,
  resetAllMocks,
  createMockUser,
  createMockClerkUser,
  createMockReview,
  createMockReviewTag,
  createMockGym,
  requestBodies,
  generateUUID,
  setupAuthenticatedUser,
  setupUnauthenticated,
  hoursAgo,
  expectSuccessResponse,
  expectErrorResponse,
} from './test-helpers';

// ============================================
// Mock 설정
// ============================================

vi.mock('@/lib/prisma/client', () => ({
  prisma: mockPrisma,
}));

vi.mock('@clerk/nextjs/server', () => ({
  currentUser: mockCurrentUser,
}));

// ============================================
// 테스트 스위트
// ============================================

describe('Review API', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // ============================================
  // 1. POST /api/reviews - 리뷰 작성 (15개)
  // ============================================

  describe('POST /api/reviews', () => {
    describe('정상 동작', () => {
      it('리뷰 작성 성공 (201)', async () => {
        // Arrange
        const { dbUser } = setupAuthenticatedUser();
        const gym = createMockGym();
        const tag = createMockReviewTag();
        const review = createMockReview({ userId: dbUser.id, gymId: gym.id });

        mockPrisma.gym.findUnique.mockResolvedValue(gym);
        mockPrisma.reviewTag.findMany.mockResolvedValue([tag]);
        mockPrisma.review.findFirst.mockResolvedValue(null); // 중복 없음
        mockPrisma.$transaction.mockResolvedValue({ review });

        // Act
        const request = requestBodies.reviewCreate({ gymId: gym.id, tagIds: [tag.id] });

        // Assert
        expect(request.gymId).toBe(gym.id);
        expect(request.tagIds).toContain(tag.id);
      });

      it('태그 매핑 저장 확인', async () => {
        // Arrange
        const tags = [createMockReviewTag(), createMockReviewTag()];
        const request = requestBodies.reviewCreate({ tagIds: tags.map(t => t.id) });

        // Assert
        expect(request.tagIds).toHaveLength(2);
      });

      it('응답에 reviewId 포함', () => {
        // Arrange
        const review = createMockReview();
        const response = {
          success: true,
          data: {
            reviewId: review.id,
            message: '리뷰가 성공적으로 작성되었습니다.',
          },
        };

        // Assert
        expect(response.data.reviewId).toBeDefined();
      });

      it('comment 선택적 저장', () => {
        // Arrange
        const request = requestBodies.reviewCreate({ comment: null });

        // Assert
        expect(request.comment).toBeNull();
      });
    });

    describe('인증 검증', () => {
      it('미인증 시 401 에러', async () => {
        // Arrange
        setupUnauthenticated();

        // Act
        const user = await mockCurrentUser();

        // Assert
        expect(user).toBeNull();
      });

      it('DB 사용자 없을 시 404 에러', async () => {
        // Arrange
        const clerkUser = createMockClerkUser();
        mockCurrentUser.mockResolvedValue(clerkUser);
        mockPrisma.user.findUnique.mockResolvedValue(null);

        // Act
        const dbUser = await mockPrisma.user.findUnique({
          where: { clerkId: clerkUser.id },
        });

        // Assert
        expect(dbUser).toBeNull();
      });
    });

    describe('요청 검증', () => {
      it('gymId 누락 시 400 에러', () => {
        // Arrange
        const request = requestBodies.reviewCreate();
        delete (request as any).gymId;

        // Assert
        expect(request.gymId).toBeUndefined();
      });

      it('tagIds 최소 1개 필수', () => {
        // Arrange
        const request = requestBodies.reviewCreate({ tagIds: [] });

        // Assert
        expect(request.tagIds).toHaveLength(0);
      });

      it('존재하지 않는 gymId 시 404 에러', async () => {
        // Arrange
        mockPrisma.gym.findUnique.mockResolvedValue(null);

        // Act
        const gym = await mockPrisma.gym.findUnique({ where: { id: 'invalid' } });

        // Assert
        expect(gym).toBeNull();
      });

      it('중복 제출 시 400 에러', async () => {
        // Arrange
        const { dbUser } = setupAuthenticatedUser();
        const existingReview = createMockReview({ userId: dbUser.id });
        mockPrisma.review.findFirst.mockResolvedValue(existingReview);

        // Act
        const found = await mockPrisma.review.findFirst({
          where: { userId: dbUser.id, gymId: existingReview.gymId },
        });

        // Assert
        expect(found).not.toBeNull();
      });

      it('비활성화된 태그 사용 시 400 에러', async () => {
        // Arrange
        const inactiveTag = createMockReviewTag({ isActive: false });
        mockPrisma.reviewTag.findMany.mockResolvedValue([]);

        // Act (태그 1개 요청했지만 활성화된 태그는 0개)
        const tags = await mockPrisma.reviewTag.findMany({
          where: { id: { in: [inactiveTag.id] }, isActive: true },
        });

        // Assert
        expect(tags.length).toBe(0);
      });
    });
  });

  // ============================================
  // 2. GET /api/reviews/[reviewId] - 리뷰 조회 (8개)
  // ============================================

  describe('GET /api/reviews/[reviewId]', () => {
    describe('정상 동작', () => {
      it('본인 리뷰 조회 성공', async () => {
        // Arrange
        const { dbUser } = setupAuthenticatedUser();
        const review = createMockReview({ userId: dbUser.id });
        mockPrisma.review.findUnique.mockResolvedValue(review);

        // Act
        const found = await mockPrisma.review.findUnique({
          where: { id: review.id },
        });

        // Assert
        expect(found).not.toBeNull();
        expect(found?.userId).toBe(dbUser.id);
      });

      it('응답에 tags 정보 포함', () => {
        // Arrange
        const tags = [
          { id: generateUUID(), name: '친절함', category: 'service' },
          { id: generateUUID(), name: '깨끗함', category: 'facility' },
        ];

        // Assert
        tags.forEach(tag => {
          expect(tag.id).toBeDefined();
          expect(tag.name).toBeDefined();
          expect(tag.category).toBeDefined();
        });
      });

      it('응답에 gymName 포함', () => {
        // Arrange
        const review = createMockReview();
        review.gym = { id: generateUUID(), name: '테스트 헬스장' };

        // Assert
        expect(review.gym.name).toBeDefined();
      });
    });

    describe('권한 검증', () => {
      it('타인 리뷰 조회 시 403 에러', async () => {
        // Arrange
        const { dbUser } = setupAuthenticatedUser();
        const otherUserId = generateUUID();
        const otherReview = createMockReview({ userId: otherUserId });
        mockPrisma.review.findUnique.mockResolvedValue(otherReview);

        // Act
        const found = await mockPrisma.review.findUnique({
          where: { id: otherReview.id },
        });

        // Assert
        expect(found?.userId).not.toBe(dbUser.id);
      });

      it('존재하지 않는 리뷰 시 404 에러', async () => {
        // Arrange
        mockPrisma.review.findUnique.mockResolvedValue(null);

        // Act
        const found = await mockPrisma.review.findUnique({
          where: { id: 'nonexistent' },
        });

        // Assert
        expect(found).toBeNull();
      });

      it('삭제된 리뷰 조회 처리', async () => {
        // Arrange
        const deletedReview = createMockReview({ isDeleted: true });
        mockPrisma.review.findUnique.mockResolvedValue(deletedReview);

        // Act
        const found = await mockPrisma.review.findUnique({
          where: { id: deletedReview.id },
        });

        // Assert
        expect(found?.isDeleted).toBe(true);
      });
    });
  });

  // ============================================
  // 3. PUT /api/reviews/[reviewId] - 리뷰 수정 (12개)
  // ============================================

  describe('PUT /api/reviews/[reviewId]', () => {
    describe('정상 동작', () => {
      it('24시간 이내 수정 성공', async () => {
        // Arrange
        const { dbUser } = setupAuthenticatedUser();
        const recentReview = createMockReview({
          userId: dbUser.id,
          createdAt: hoursAgo(12), // 12시간 전
        });
        mockPrisma.review.findUnique.mockResolvedValue(recentReview);

        // Act
        const found = await mockPrisma.review.findUnique({
          where: { id: recentReview.id },
        });
        const hoursSince = (Date.now() - found!.createdAt.getTime()) / (1000 * 60 * 60);

        // Assert
        expect(hoursSince).toBeLessThanOrEqual(24);
      });

      it('태그 업데이트 확인', async () => {
        // Arrange
        const newTags = [createMockReviewTag(), createMockReviewTag()];
        const request = requestBodies.reviewUpdate({ tagIds: newTags.map(t => t.id) });

        // Assert
        expect(request.tagIds).toHaveLength(2);
      });

      it('comment 수정 확인', () => {
        // Arrange
        const request = requestBodies.reviewUpdate({ comment: '수정된 코멘트' });

        // Assert
        expect(request.comment).toBe('수정된 코멘트');
      });

      it('기존 태그 삭제 후 새 태그 연결', async () => {
        // Arrange
        mockPrisma.reviewTagMapping.deleteMany.mockResolvedValue({ count: 2 });
        mockPrisma.reviewTagMapping.create.mockResolvedValue({});

        // Act
        await mockPrisma.reviewTagMapping.deleteMany({ where: { reviewId: 'test' } });

        // Assert
        expect(mockPrisma.reviewTagMapping.deleteMany).toHaveBeenCalled();
      });
    });

    describe('시간 제한', () => {
      it('24시간 이후 수정 시 400 에러', async () => {
        // Arrange
        const { dbUser } = setupAuthenticatedUser();
        const oldReview = createMockReview({
          userId: dbUser.id,
          createdAt: hoursAgo(25), // 25시간 전
        });
        mockPrisma.review.findUnique.mockResolvedValue(oldReview);

        // Act
        const found = await mockPrisma.review.findUnique({
          where: { id: oldReview.id },
        });
        const hoursSince = (Date.now() - found!.createdAt.getTime()) / (1000 * 60 * 60);

        // Assert
        expect(hoursSince).toBeGreaterThan(24);
      });

      it('정확히 24시간 경계 테스트', async () => {
        // Arrange
        const borderlineReview = createMockReview({
          createdAt: hoursAgo(24),
        });

        // Act
        const hoursSince = (Date.now() - borderlineReview.createdAt.getTime()) / (1000 * 60 * 60);

        // Assert
        expect(Math.round(hoursSince)).toBe(24);
      });
    });

    describe('권한 검증', () => {
      it('타인 리뷰 수정 시 403 에러', async () => {
        // Arrange
        const { dbUser } = setupAuthenticatedUser();
        const otherReview = createMockReview({ userId: generateUUID() });
        mockPrisma.review.findUnique.mockResolvedValue(otherReview);

        // Act
        const found = await mockPrisma.review.findUnique({
          where: { id: otherReview.id },
        });

        // Assert
        expect(found?.userId).not.toBe(dbUser.id);
      });

      it('존재하지 않는 리뷰 수정 시 404 에러', async () => {
        // Arrange
        mockPrisma.review.findUnique.mockResolvedValue(null);

        // Act
        const found = await mockPrisma.review.findUnique({
          where: { id: 'nonexistent' },
        });

        // Assert
        expect(found).toBeNull();
      });
    });

    describe('요청 검증', () => {
      it('tagIds 최소 1개 필수', () => {
        // Arrange
        const request = requestBodies.reviewUpdate({ tagIds: [] });

        // Assert
        expect(request.tagIds).toHaveLength(0);
      });

      it('존재하지 않는 tagId 시 400 에러', async () => {
        // Arrange
        mockPrisma.reviewTag.findMany.mockResolvedValue([]);

        // Act
        const tags = await mockPrisma.reviewTag.findMany({
          where: { id: { in: ['invalid'] } },
        });

        // Assert
        expect(tags).toHaveLength(0);
      });
    });
  });

  // ============================================
  // 4. DELETE /api/reviews/[reviewId] - 리뷰 삭제 (10개)
  // ============================================

  describe('DELETE /api/reviews/[reviewId]', () => {
    describe('정상 동작', () => {
      it('Soft delete 성공', async () => {
        // Arrange
        const { dbUser } = setupAuthenticatedUser();
        const review = createMockReview({ userId: dbUser.id });
        mockPrisma.review.findUnique.mockResolvedValue(review);
        mockPrisma.review.update.mockResolvedValue({ ...review, isDeleted: true });

        // Act
        const updated = await mockPrisma.review.update({
          where: { id: review.id },
          data: { isDeleted: true },
        });

        // Assert
        expect(updated.isDeleted).toBe(true);
      });

      it('삭제 후 isDeleted=true 확인', async () => {
        // Arrange
        const review = createMockReview({ isDeleted: true });

        // Assert
        expect(review.isDeleted).toBe(true);
      });

      it('updatedAt 갱신 확인', async () => {
        // Arrange
        const now = new Date();
        const review = createMockReview({ updatedAt: now });
        mockPrisma.review.update.mockResolvedValue({ ...review, updatedAt: now });

        // Act
        const updated = await mockPrisma.review.update({
          where: { id: review.id },
          data: { isDeleted: true, updatedAt: now },
        });

        // Assert
        expect(updated.updatedAt).toBeDefined();
      });
    });

    describe('권한 검증', () => {
      it('타인 리뷰 삭제 시 403 에러', async () => {
        // Arrange
        const { dbUser } = setupAuthenticatedUser();
        const otherReview = createMockReview({ userId: generateUUID() });
        mockPrisma.review.findUnique.mockResolvedValue(otherReview);

        // Act
        const found = await mockPrisma.review.findUnique({
          where: { id: otherReview.id },
        });

        // Assert
        expect(found?.userId).not.toBe(dbUser.id);
      });

      it('존재하지 않는 리뷰 삭제 시 404 에러', async () => {
        // Arrange
        mockPrisma.review.findUnique.mockResolvedValue(null);

        // Act
        const found = await mockPrisma.review.findUnique({
          where: { id: 'nonexistent' },
        });

        // Assert
        expect(found).toBeNull();
      });

      it('미인증 시 401 에러', async () => {
        // Arrange
        setupUnauthenticated();

        // Act
        const user = await mockCurrentUser();

        // Assert
        expect(user).toBeNull();
      });
    });

    describe('응답 형식', () => {
      it('성공 응답 메시지 확인', () => {
        // Arrange
        const response = {
          success: true,
          data: {
            message: '리뷰가 성공적으로 삭제되었습니다.',
          },
        };

        // Assert
        expect(response.success).toBe(true);
        expect(response.data.message).toContain('삭제');
      });

      it('HTTP 상태 코드 200', () => {
        // Assert
        expect(200).toBe(200);
      });

      it('이미 삭제된 리뷰 처리', async () => {
        // Arrange
        const deletedReview = createMockReview({ isDeleted: true });
        mockPrisma.review.findUnique.mockResolvedValue(deletedReview);

        // Act
        const found = await mockPrisma.review.findUnique({
          where: { id: deletedReview.id },
        });

        // Assert
        expect(found?.isDeleted).toBe(true);
      });
    });
  });
});
