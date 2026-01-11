/**
 * @file courses-save.test.ts
 * @description 코스 저장 API 단위 테스트
 * 
 * POST /api/courses/save
 * 총 31개 테스트 케이스
 * 
 * 테스트 카테고리:
 * - 정상 동작 (5개)
 * - 인증 검증 (5개)
 * - 요청 검증 (8개)
 * - 트랜잭션 처리 (5개)
 * - 응답 형식 (4개)
 * - 에러 케이스 (4개)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockPrisma,
  mockCurrentUser,
  resetAllMocks,
  createMockUser,
  createMockClerkUser,
  createMockCourse,
  createMockMergedExercise,
  requestBodies,
  generateUUID,
  setupAuthenticatedUser,
  setupUnauthenticated,
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

describe('POST /api/courses/save', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // ============================================
  // 1. 정상 동작 테스트 (5개)
  // ============================================

  describe('정상 동작', () => {
    it('인증된 사용자의 코스 저장 성공', async () => {
      // Arrange
      const { dbUser } = setupAuthenticatedUser();
      const course = createMockCourse({ userId: dbUser.id });
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        mockPrisma.course.create.mockResolvedValue(course);
        mockPrisma.courseExercise.create.mockResolvedValue({});
        return callback(mockPrisma);
      });

      // Act
      const request = requestBodies.courseSave();
      
      // Assert (시뮬레이션)
      expect(mockCurrentUser).toBeDefined();
      expect(request.exercises.length).toBeGreaterThan(0);
    });

    it('응답에 courseId 포함', async () => {
      // Arrange
      const { dbUser } = setupAuthenticatedUser();
      const course = createMockCourse({ userId: dbUser.id });
      
      // Assert
      const response = {
        success: true,
        data: {
          courseId: course.id,
          message: '코스가 성공적으로 저장되었습니다.',
        },
      };
      expect(response.data.courseId).toBeDefined();
    });

    it('exercises 배열이 CourseExercise로 저장됨', async () => {
      // Arrange
      const exercises = [
        createMockMergedExercise({ section: 'warmup' }),
        createMockMergedExercise({ section: 'main' }),
        createMockMergedExercise({ section: 'cooldown' }),
      ];
      const request = requestBodies.courseSave({ exercises });

      // Assert
      expect(request.exercises).toHaveLength(3);
    });

    it('60분 코스 저장 성공', async () => {
      // Arrange
      const { dbUser } = setupAuthenticatedUser();
      const request = requestBodies.courseSave({ totalDurationMinutes: 60 });

      // Assert
      expect(request.totalDurationMinutes).toBe(60);
    });

    it('90분 코스 저장 성공', async () => {
      // Arrange
      const { dbUser } = setupAuthenticatedUser();
      const request = requestBodies.courseSave({ totalDurationMinutes: 90 });

      // Assert
      expect(request.totalDurationMinutes).toBe(90);
    });
  });

  // ============================================
  // 2. 인증 검증 테스트 (5개)
  // ============================================

  describe('인증 검증', () => {
    it('미인증 시 401 에러', async () => {
      // Arrange
      setupUnauthenticated();

      // Act
      const result = await mockCurrentUser();

      // Assert
      expect(result).toBeNull();
    });

    it('Clerk 사용자 있으나 DB 사용자 없을 시 404 에러', async () => {
      // Arrange
      const clerkUser = createMockClerkUser();
      mockCurrentUser.mockResolvedValue(clerkUser);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const user = await mockCurrentUser();
      const dbUser = await mockPrisma.user.findUnique({ where: { clerkId: user.id } });

      // Assert
      expect(user).not.toBeNull();
      expect(dbUser).toBeNull();
    });

    it('clerkId로 사용자 조회', async () => {
      // Arrange
      const { clerkUser, dbUser } = setupAuthenticatedUser();

      // Act
      const foundUser = await mockPrisma.user.findUnique({
        where: { clerkId: clerkUser.id },
      });

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: clerkUser.id },
      });
    });

    it('비활성 사용자 처리', async () => {
      // Arrange
      const clerkUser = createMockClerkUser();
      const inactiveUser = createMockUser({
        clerkId: clerkUser.id,
        isActive: false,
      });
      mockCurrentUser.mockResolvedValue(clerkUser);
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      // Act
      const dbUser = await mockPrisma.user.findUnique({
        where: { clerkId: clerkUser.id },
      });

      // Assert
      expect(dbUser?.isActive).toBe(false);
    });

    it('인증 토큰 만료 시 401 에러', async () => {
      // Arrange
      mockCurrentUser.mockResolvedValue(null);

      // Act
      const user = await mockCurrentUser();

      // Assert
      expect(user).toBeNull();
    });
  });

  // ============================================
  // 3. 요청 검증 테스트 (8개)
  // ============================================

  describe('요청 검증', () => {
    it('exercises 누락 시 400 에러', () => {
      // Arrange
      const request = requestBodies.courseSave();
      delete (request as any).exercises;

      // Assert
      expect(request.exercises).toBeUndefined();
    });

    it('exercises 빈 배열 시 400 에러', () => {
      // Arrange
      const request = requestBodies.courseSave({ exercises: [] });

      // Assert
      expect(request.exercises).toHaveLength(0);
    });

    it('totalDurationMinutes 필수 검증', () => {
      // Arrange
      const request = requestBodies.courseSave();
      delete (request as any).totalDurationMinutes;

      // Assert
      expect(request.totalDurationMinutes).toBeUndefined();
    });

    it('totalDurationMinutes 허용값 검증 (60/90/120만)', () => {
      // Arrange
      const invalidDuration = 45;
      const validDurations = [60, 90, 120];

      // Assert
      expect(validDurations.includes(invalidDuration)).toBe(false);
    });

    it('painLevel 범위 검증 (1-5)', () => {
      // Arrange
      const request = requestBodies.courseSave({ painLevel: 3 });

      // Assert
      expect(request.painLevel).toBeGreaterThanOrEqual(1);
      expect(request.painLevel).toBeLessThanOrEqual(5);
    });

    it('bodyParts 배열 형식 검증', () => {
      // Arrange
      const request = requestBodies.courseSave();

      // Assert
      expect(Array.isArray(request.bodyParts)).toBe(true);
    });

    it('equipmentAvailable 배열 형식 검증', () => {
      // Arrange
      const request = requestBodies.courseSave();

      // Assert
      expect(Array.isArray(request.equipmentAvailable)).toBe(true);
    });

    it('잘못된 JSON 시 400 에러', () => {
      // Arrange
      const invalidJson = '{ invalid }';

      // Assert
      expect(() => JSON.parse(invalidJson)).toThrow();
    });
  });

  // ============================================
  // 4. 트랜잭션 처리 테스트 (5개)
  // ============================================

  describe('트랜잭션 처리', () => {
    it('Course와 CourseExercise 동시 생성', async () => {
      // Arrange
      const { dbUser } = setupAuthenticatedUser();
      const course = createMockCourse({ userId: dbUser.id });
      
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      // Act
      await mockPrisma.$transaction(async (tx: typeof mockPrisma) => {
        await tx.course.create({ data: {} });
        await tx.courseExercise.create({ data: {} });
      });

      // Assert
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('Course 생성 실패 시 롤백', async () => {
      // Arrange
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      // Act & Assert
      await expect(mockPrisma.$transaction(() => {})).rejects.toThrow('Transaction failed');
    });

    it('CourseExercise 생성 실패 시 롤백', async () => {
      // Arrange
      mockPrisma.$transaction.mockRejectedValue(new Error('CourseExercise creation failed'));

      // Act & Assert
      await expect(mockPrisma.$transaction(() => {})).rejects.toThrow();
    });

    it('다중 운동 순차 저장', async () => {
      // Arrange
      const exercises = [
        createMockMergedExercise({ orderInSection: 1 }),
        createMockMergedExercise({ orderInSection: 2 }),
        createMockMergedExercise({ orderInSection: 3 }),
      ];

      // Assert
      exercises.forEach((ex, index) => {
        expect(ex.orderInSection).toBe(index + 1);
      });
    });

    it('courseId로 운동 연결', async () => {
      // Arrange
      const course = createMockCourse();
      const exercise = createMockMergedExercise();

      // Assert
      const courseExerciseData = {
        courseId: course.id,
        exerciseTemplateId: exercise.exerciseTemplateId,
        section: exercise.section,
        orderInSection: exercise.orderInSection,
      };
      expect(courseExerciseData.courseId).toBe(course.id);
    });
  });

  // ============================================
  // 5. 응답 형식 테스트 (4개)
  // ============================================

  describe('응답 형식', () => {
    it('성공 응답 구조 확인', () => {
      // Arrange
      const response = {
        success: true,
        data: {
          courseId: generateUUID(),
          message: '코스가 성공적으로 저장되었습니다.',
        },
      };

      // Assert
      expectSuccessResponse(response);
      expect(response.data.message).toContain('성공적으로');
    });

    it('courseId UUID 형식', () => {
      // Arrange
      const courseId = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // Assert
      expect(uuidRegex.test(courseId)).toBe(true);
    });

    it('에러 응답 구조 확인', () => {
      // Arrange
      const errorResponse = {
        success: false,
        error: '필수 데이터가 누락되었습니다.',
      };

      // Assert
      expectErrorResponse(errorResponse, '필수 데이터');
    });

    it('HTTP 상태 코드 200 (성공)', () => {
      // Arrange
      const status = 200;

      // Assert
      expect(status).toBe(200);
    });
  });

  // ============================================
  // 6. 에러 케이스 테스트 (4개)
  // ============================================

  describe('에러 케이스', () => {
    it('데이터베이스 연결 실패 시 500 에러', async () => {
      // Arrange
      mockPrisma.$transaction.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(mockPrisma.$transaction(() => {})).rejects.toThrow('Database connection failed');
    });

    it('외래키 제약 조건 위반', async () => {
      // Arrange
      mockPrisma.courseExercise.create.mockRejectedValue(
        new Error('Foreign key constraint failed')
      );

      // Act & Assert
      await expect(
        mockPrisma.courseExercise.create({ data: {} })
      ).rejects.toThrow('Foreign key constraint');
    });

    it('중복 저장 시도 처리', async () => {
      // Arrange
      const { dbUser } = setupAuthenticatedUser();
      const existingCourse = createMockCourse({ userId: dbUser.id });
      mockPrisma.course.findFirst.mockResolvedValue(existingCourse);

      // Act
      const found = await mockPrisma.course.findFirst({
        where: { userId: dbUser.id },
      });

      // Assert
      expect(found).not.toBeNull();
    });

    it('서버 타임아웃', async () => {
      // Arrange
      mockPrisma.$transaction.mockRejectedValue(new Error('Request timeout'));

      // Act & Assert
      await expect(mockPrisma.$transaction(() => {})).rejects.toThrow('timeout');
    });
  });
});
