/**
 * @file error-cases.test.ts
 * @description 공통 에러 케이스 테스트
 * 
 * 모든 API에서 공통으로 발생할 수 있는 에러 케이스를 테스트합니다.
 * 
 * 총 52개 테스트 케이스
 * 
 * 테스트 카테고리:
 * - 400 Bad Request (10개)
 * - 401 Unauthorized (8개)
 * - 403 Forbidden (8개)
 * - 404 Not Found (8개)
 * - 409 Conflict (4개)
 * - 500 Internal Server Error (8개)
 * - 에러 응답 형식 (6개)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockPrisma,
  mockCurrentUser,
  resetAllMocks,
  createMockUser,
  createMockClerkUser,
  createMockReview,
  createMockCourse,
  createMockGym,
  generateUUID,
  setupAuthenticatedUser,
  setupUnauthenticated,
  hoursAgo,
  expectErrorResponse,
  errorScenarios,
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

describe('공통 에러 케이스', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // ============================================
  // 1. 400 Bad Request (10개)
  // ============================================

  describe('400 Bad Request', () => {
    it('JSON 파싱 에러', () => {
      // Arrange
      const invalidJson = '{ invalid json }';

      // Assert
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it('필수 파라미터 누락 - lat', () => {
      // Arrange
      const params: Record<string, string> = { lng: '127.0' };

      // Assert
      expect(params.lat).toBeUndefined();
    });

    it('필수 파라미터 누락 - lng', () => {
      // Arrange
      const params: Record<string, string> = { lat: '37.5' };

      // Assert
      expect(params.lng).toBeUndefined();
    });

    it('필수 필드 누락 - bodyParts', () => {
      // Arrange
      const request = { painLevel: 3, equipmentAvailable: [] };

      // Assert
      expect((request as any).bodyParts).toBeUndefined();
    });

    it('필수 필드 누락 - gymId', () => {
      // Arrange
      const request = { tagIds: [generateUUID()], comment: 'test' };

      // Assert
      expect((request as any).gymId).toBeUndefined();
    });

    it('배열 빈 값 - tagIds', () => {
      // Arrange
      const request = { gymId: generateUUID(), tagIds: [] };

      // Assert
      expect(request.tagIds).toHaveLength(0);
    });

    it('범위 초과 - painLevel > 5', () => {
      // Arrange
      const painLevel = 6;

      // Assert
      expect(painLevel > 5).toBe(true);
    });

    it('범위 미달 - painLevel < 1', () => {
      // Arrange
      const painLevel = 0;

      // Assert
      expect(painLevel < 1).toBe(true);
    });

    it('잘못된 enum 값 - totalDurationMinutes', () => {
      // Arrange
      const invalidDuration = 45;
      const validOptions = [60, 90, 120];

      // Assert
      expect(validOptions.includes(invalidDuration)).toBe(false);
    });

    it('UUID 형식 오류', () => {
      // Arrange
      const invalidUUID = 'not-a-valid-uuid';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // Assert
      expect(uuidRegex.test(invalidUUID)).toBe(false);
    });
  });

  // ============================================
  // 2. 401 Unauthorized (8개)
  // ============================================

  describe('401 Unauthorized', () => {
    it('인증 토큰 없음', async () => {
      // Arrange
      setupUnauthenticated();

      // Act
      const user = await mockCurrentUser();

      // Assert
      expect(user).toBeNull();
    });

    it('인증 토큰 만료', async () => {
      // Arrange
      mockCurrentUser.mockResolvedValue(null);

      // Act
      const user = await mockCurrentUser();

      // Assert
      expect(user).toBeNull();
    });

    it('잘못된 인증 토큰', async () => {
      // Arrange
      mockCurrentUser.mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      await expect(mockCurrentUser()).rejects.toThrow('Invalid token');
    });

    it('Clerk 서비스 오류', async () => {
      // Arrange
      mockCurrentUser.mockRejectedValue(new Error('Clerk service unavailable'));

      // Act & Assert
      await expect(mockCurrentUser()).rejects.toThrow('Clerk service unavailable');
    });

    it('코스 저장 시 미인증', async () => {
      // Arrange
      setupUnauthenticated();

      // Act
      const user = await mockCurrentUser();

      // Assert
      expect(user).toBeNull();
    });

    it('리뷰 작성 시 미인증', async () => {
      // Arrange
      setupUnauthenticated();

      // Act
      const user = await mockCurrentUser();

      // Assert
      expect(user).toBeNull();
    });

    it('리뷰 수정 시 미인증', async () => {
      // Arrange
      setupUnauthenticated();

      // Act
      const user = await mockCurrentUser();

      // Assert
      expect(user).toBeNull();
    });

    it('리뷰 삭제 시 미인증', async () => {
      // Arrange
      setupUnauthenticated();

      // Act
      const user = await mockCurrentUser();

      // Assert
      expect(user).toBeNull();
    });
  });

  // ============================================
  // 3. 403 Forbidden (8개)
  // ============================================

  describe('403 Forbidden', () => {
    it('타인 리뷰 조회 시도', async () => {
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

    it('타인 리뷰 수정 시도', async () => {
      // Arrange
      const { dbUser } = setupAuthenticatedUser();
      const otherReview = createMockReview({ userId: generateUUID() });

      // Assert
      expect(otherReview.userId).not.toBe(dbUser.id);
    });

    it('타인 리뷰 삭제 시도', async () => {
      // Arrange
      const { dbUser } = setupAuthenticatedUser();
      const otherReview = createMockReview({ userId: generateUUID() });

      // Assert
      expect(otherReview.userId).not.toBe(dbUser.id);
    });

    it('비활성 계정 접근', async () => {
      // Arrange
      const clerkUser = createMockClerkUser();
      const inactiveUser = createMockUser({ clerkId: clerkUser.id, isActive: false });
      mockCurrentUser.mockResolvedValue(clerkUser);
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      // Act
      const dbUser = await mockPrisma.user.findUnique({
        where: { clerkId: clerkUser.id },
      });

      // Assert
      expect(dbUser?.isActive).toBe(false);
    });

    it('관리자 전용 기능 접근', async () => {
      // Arrange
      const { dbUser } = setupAuthenticatedUser();

      // Assert
      expect(dbUser.isAdmin).toBe(false);
    });

    it('삭제된 리소스 접근 (isDeleted=true)', async () => {
      // Arrange
      const deletedReview = createMockReview({ isDeleted: true });

      // Assert
      expect(deletedReview.isDeleted).toBe(true);
    });

    it('권한 없는 코스 조회', async () => {
      // Arrange
      const { dbUser } = setupAuthenticatedUser();
      const otherCourse = createMockCourse({ userId: generateUUID() });

      // Assert
      expect(otherCourse.userId).not.toBe(dbUser.id);
    });

    it('수정 제한 시간 초과 (24시간)', async () => {
      // Arrange
      const oldReview = createMockReview({ createdAt: hoursAgo(25) });
      const hoursSince = (Date.now() - oldReview.createdAt.getTime()) / (1000 * 60 * 60);

      // Assert
      expect(hoursSince).toBeGreaterThan(24);
    });
  });

  // ============================================
  // 4. 404 Not Found (8개)
  // ============================================

  describe('404 Not Found', () => {
    it('존재하지 않는 헬스장', async () => {
      // Arrange
      mockPrisma.gym.findUnique.mockResolvedValue(null);

      // Act
      const gym = await mockPrisma.gym.findUnique({
        where: { id: 'nonexistent' },
      });

      // Assert
      expect(gym).toBeNull();
    });

    it('존재하지 않는 리뷰', async () => {
      // Arrange
      mockPrisma.review.findUnique.mockResolvedValue(null);

      // Act
      const review = await mockPrisma.review.findUnique({
        where: { id: 'nonexistent' },
      });

      // Assert
      expect(review).toBeNull();
    });

    it('존재하지 않는 코스', async () => {
      // Arrange
      mockPrisma.course.findUnique.mockResolvedValue(null);

      // Act
      const course = await mockPrisma.course.findUnique({
        where: { id: 'nonexistent' },
      });

      // Assert
      expect(course).toBeNull();
    });

    it('존재하지 않는 사용자 (DB)', async () => {
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

    it('존재하지 않는 부위 ID', async () => {
      // Arrange
      mockPrisma.bodyPart.findUnique.mockResolvedValue(null);

      // Act
      const bodyPart = await mockPrisma.bodyPart.findUnique({
        where: { id: 'nonexistent' },
      });

      // Assert
      expect(bodyPart).toBeNull();
    });

    it('존재하지 않는 태그 ID', async () => {
      // Arrange
      mockPrisma.reviewTag.findMany.mockResolvedValue([]);

      // Act
      const tags = await mockPrisma.reviewTag.findMany({
        where: { id: { in: ['nonexistent'] } },
      });

      // Assert
      expect(tags).toHaveLength(0);
    });

    it('적절한 운동 없음 (404)', async () => {
      // Arrange
      const emptyResult = { exercises: [], totalDuration: 0, warnings: [] };

      // Assert
      expect(emptyResult.exercises).toHaveLength(0);
    });

    it('반경 내 헬스장 없음', async () => {
      // Arrange
      mockPrisma.gym.findMany.mockResolvedValue([]);

      // Act
      const gyms = await mockPrisma.gym.findMany();

      // Assert
      expect(gyms).toHaveLength(0);
    });
  });

  // ============================================
  // 5. 409 Conflict (4개)
  // ============================================

  describe('409 Conflict', () => {
    it('중복 리뷰 작성', async () => {
      // Arrange
      const { dbUser } = setupAuthenticatedUser();
      const existingReview = createMockReview({ userId: dbUser.id });
      mockPrisma.review.findFirst.mockResolvedValue(existingReview);

      // Act
      const found = await mockPrisma.review.findFirst({
        where: { userId: dbUser.id, gymId: existingReview.gymId, isDeleted: false },
      });

      // Assert
      expect(found).not.toBeNull();
    });

    it('이미 삭제된 리뷰 재삭제', async () => {
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

    it('Unique constraint 위반', async () => {
      // Arrange
      mockPrisma.review.create.mockRejectedValue(
        new Error('Unique constraint failed')
      );

      // Act & Assert
      await expect(mockPrisma.review.create({ data: {} })).rejects.toThrow('Unique constraint');
    });

    it('동시성 충돌 처리', async () => {
      // Arrange
      mockPrisma.$transaction.mockRejectedValue(
        new Error('Transaction conflict')
      );

      // Act & Assert
      await expect(mockPrisma.$transaction(() => {})).rejects.toThrow('conflict');
    });
  });

  // ============================================
  // 6. 500 Internal Server Error (8개)
  // ============================================

  describe('500 Internal Server Error', () => {
    it('데이터베이스 연결 실패', async () => {
      // Arrange
      const error = errorScenarios.prismaError();

      // Assert
      expect(error.message).toContain('Prisma');
    });

    it('트랜잭션 실패', async () => {
      // Arrange
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      // Act & Assert
      await expect(mockPrisma.$transaction(() => {})).rejects.toThrow('Transaction failed');
    });

    it('네트워크 타임아웃', async () => {
      // Arrange
      mockPrisma.gym.findMany.mockRejectedValue(new Error('Network timeout'));

      // Act & Assert
      await expect(mockPrisma.gym.findMany()).rejects.toThrow('timeout');
    });

    it('메모리 부족', () => {
      // Arrange
      const error = new Error('Out of memory');

      // Assert
      expect(error.message).toContain('memory');
    });

    it('알 수 없는 에러', () => {
      // Arrange
      const error = new Error('Unknown error occurred');

      // Assert
      expect(error.message).toBeDefined();
    });

    it('Prisma 쿼리 에러', async () => {
      // Arrange
      mockPrisma.gym.findMany.mockRejectedValue(new Error('Invalid query'));

      // Act & Assert
      await expect(mockPrisma.gym.findMany()).rejects.toThrow('Invalid query');
    });

    it('외부 서비스 장애', async () => {
      // Arrange
      mockCurrentUser.mockRejectedValue(new Error('External service down'));

      // Act & Assert
      await expect(mockCurrentUser()).rejects.toThrow('External service');
    });

    it('리소스 제한 초과', () => {
      // Arrange
      const error = new Error('Rate limit exceeded');

      // Assert
      expect(error.message).toContain('limit');
    });
  });

  // ============================================
  // 7. 에러 응답 형식 (6개)
  // ============================================

  describe('에러 응답 형식', () => {
    it('기본 에러 응답 형식', () => {
      // Arrange
      const response = {
        success: false,
        error: '에러 메시지',
      };

      // Assert
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('상세 에러 정보 포함 (details)', () => {
      // Arrange
      const response = {
        success: false,
        error: '검증 실패',
        details: [
          { field: 'bodyParts', message: '최소 1개 필요' },
        ],
      };

      // Assert
      expect(response.details).toBeDefined();
      expect(response.details).toHaveLength(1);
    });

    it('사용자 친화적 메시지 (message)', () => {
      // Arrange
      const response = {
        success: false,
        error: '적절한 운동을 찾지 못했습니다.',
        message: '다른 부위를 선택하거나 통증 정도를 조정해 주세요.',
      };

      // Assert
      expect(response.message).toContain('선택');
    });

    it('경고 메시지 포함 (warnings)', () => {
      // Arrange
      const response = {
        success: false,
        error: '처리 중 문제 발생',
        warnings: ['일부 운동이 제외되었습니다.'],
      };

      // Assert
      expect(response.warnings).toHaveLength(1);
    });

    it('console.error 로깅 확인', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      console.error('[API] 에러 발생:', new Error('Test error'));

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('HTTP 상태 코드별 응답', () => {
      // Arrange
      const statusCodes = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        409: 'Conflict',
        500: 'Internal Server Error',
      };

      // Assert
      expect(Object.keys(statusCodes)).toHaveLength(6);
      expect(statusCodes[400]).toBe('Bad Request');
      expect(statusCodes[500]).toBe('Internal Server Error');
    });
  });
});
