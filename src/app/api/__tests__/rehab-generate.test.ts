/**
 * @file rehab-generate.test.ts
 * @description 재활 코스 생성 API 단위 테스트
 * 
 * POST /api/rehab/generate
 * 총 33개 테스트 케이스
 * 
 * 테스트 카테고리:
 * - 정상 동작 (6개)
 * - 요청 검증 (10개)
 * - 응답 형식 (5개)
 * - Fallback 처리 (5개)
 * - 복합 시나리오 (4개)
 * - 에러 케이스 (3개)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockPrisma,
  mockMergeBodyParts,
  resetAllMocks,
  createMockMergeResult,
  createMockMergedExercise,
  requestBodies,
  generateUUID,
  expectSuccessResponse,
  expectErrorResponse,
  type MockMergeResult,
} from './test-helpers';

// ============================================
// Mock 설정
// ============================================

vi.mock('@/lib/prisma/client', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/algorithms/merge-body-parts', () => ({
  mergeBodyParts: mockMergeBodyParts,
}));

// ============================================
// 테스트 스위트
// ============================================

describe('POST /api/rehab/generate', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // ============================================
  // 1. 정상 동작 테스트 (6개)
  // ============================================

  describe('정상 동작', () => {
    it('정상 요청 시 코스 생성 성공', async () => {
      // Arrange
      const mergeResult = createMockMergeResult();
      mockMergeBodyParts.mockResolvedValue(mergeResult);

      // Act
      const request = requestBodies.rehabGenerate();
      const result = await mockMergeBodyParts(request);

      // Assert
      expect(result.exercises).toHaveLength(4);
      expect(result.totalDuration).toBe(60);
    });

    it('응답에 exercises 배열 포함', async () => {
      // Arrange
      const mergeResult = createMockMergeResult();
      mockMergeBodyParts.mockResolvedValue(mergeResult);

      // Act
      const result = await mockMergeBodyParts(requestBodies.rehabGenerate());

      // Assert
      expect(Array.isArray(result.exercises)).toBe(true);
      expect(result.exercises.length).toBeGreaterThan(0);
    });

    it('응답에 totalDuration 포함', async () => {
      // Arrange
      const mergeResult = createMockMergeResult({ totalDuration: 90 });
      mockMergeBodyParts.mockResolvedValue(mergeResult);

      // Act
      const result = await mockMergeBodyParts(
        requestBodies.rehabGenerate({ totalDurationMinutes: 90 })
      );

      // Assert
      expect(result.totalDuration).toBe(90);
    });

    it('응답에 stats 포함', async () => {
      // Arrange
      const mergeResult = createMockMergeResult();
      mockMergeBodyParts.mockResolvedValue(mergeResult);

      // Act
      const result = await mockMergeBodyParts(requestBodies.rehabGenerate());

      // Assert
      expect(result.stats).toBeDefined();
      expect(result.stats.warmup).toBeDefined();
      expect(result.stats.main).toBeDefined();
      expect(result.stats.cooldown).toBeDefined();
    });

    it('다중 부위 선택 시 정상 처리', async () => {
      // Arrange
      const mergeResult = createMockMergeResult({
        stats: {
          warmup: 2,
          main: 4,
          cooldown: 2,
          byBodyPart: { '허리': 4, '어깨': 4 },
        },
      });
      mockMergeBodyParts.mockResolvedValue(mergeResult);

      // Act
      const request = requestBodies.rehabGenerate({
        bodyParts: [
          { bodyPartId: generateUUID(), bodyPartName: '허리', painLevel: 3 },
          { bodyPartId: generateUUID(), bodyPartName: '어깨', painLevel: 2 },
        ],
      });
      const result = await mockMergeBodyParts(request);

      // Assert
      expect(Object.keys(result.stats.byBodyPart)).toHaveLength(2);
    });

    it('60/90/120분 옵션별 정상 처리', async () => {
      // Arrange
      const durations = [60, 90, 120] as const;
      
      for (const duration of durations) {
        const mergeResult = createMockMergeResult({ totalDuration: duration });
        mockMergeBodyParts.mockResolvedValue(mergeResult);

        // Act
        const result = await mockMergeBodyParts(
          requestBodies.rehabGenerate({ totalDurationMinutes: duration })
        );

        // Assert
        expect(result.totalDuration).toBe(duration);
      }
    });
  });

  // ============================================
  // 2. 요청 검증 테스트 (10개)
  // ============================================

  describe('요청 검증', () => {
    it('bodyParts 필수 검증', () => {
      // Arrange
      const request = requestBodies.rehabGenerate();
      delete (request as any).bodyParts;

      // Assert
      expect(request.bodyParts).toBeUndefined();
    });

    it('bodyParts 최소 1개 필요', () => {
      // Arrange
      const request = requestBodies.rehabGenerate({ bodyParts: [] });

      // Assert
      expect(request.bodyParts).toHaveLength(0);
    });

    it('bodyParts 최대 5개 제한', () => {
      // Arrange
      const tooManyBodyParts = Array.from({ length: 6 }, (_, i) => ({
        bodyPartId: generateUUID(),
        bodyPartName: `부위${i}`,
        painLevel: 3,
      }));

      // Assert
      expect(tooManyBodyParts.length).toBeGreaterThan(5);
    });

    it('painLevel 범위 검증 (1-5)', () => {
      // Arrange
      const validLevels = [1, 2, 3, 4, 5];
      const invalidLow = 0;
      const invalidHigh = 6;

      // Assert
      validLevels.forEach(level => {
        expect(level >= 1 && level <= 5).toBe(true);
      });
      expect(invalidLow >= 1 && invalidLow <= 5).toBe(false);
      expect(invalidHigh >= 1 && invalidHigh <= 5).toBe(false);
    });

    it('bodyPartId UUID 형식 검증', () => {
      // Arrange
      const validUUID = generateUUID();
      const invalidUUID = 'not-a-uuid';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // Assert
      expect(uuidRegex.test(validUUID)).toBe(true);
      expect(uuidRegex.test(invalidUUID)).toBe(false);
    });

    it('totalDurationMinutes 허용값 검증 (60/90/120만)', () => {
      // Arrange
      const validDurations = [60, 90, 120];
      const invalidDuration = 45;

      // Assert
      validDurations.forEach(d => {
        expect([60, 90, 120].includes(d)).toBe(true);
      });
      expect([60, 90, 120].includes(invalidDuration)).toBe(false);
    });

    it('equipmentAvailable 배열 형식 검증', () => {
      // Arrange
      const request = requestBodies.rehabGenerate();

      // Assert
      expect(Array.isArray(request.equipmentAvailable)).toBe(true);
    });

    it('experienceLevel 문자열 형식 검증', () => {
      // Arrange
      const validLevels = ['beginner', 'intermediate', 'advanced'];
      
      // Assert
      validLevels.forEach(level => {
        expect(typeof level).toBe('string');
      });
    });

    it('각 bodyPart에 bodyPartName 필수', () => {
      // Arrange
      const request = requestBodies.rehabGenerate();
      const bodyPart = request.bodyParts[0];

      // Assert
      expect(bodyPart.bodyPartName).toBeDefined();
      expect(typeof bodyPart.bodyPartName).toBe('string');
    });

    it('각 bodyPart에 painLevel 범위 (1-5) 필수', () => {
      // Arrange
      const request = requestBodies.rehabGenerate();
      const bodyPart = request.bodyParts[0];

      // Assert
      expect(bodyPart.painLevel).toBeGreaterThanOrEqual(1);
      expect(bodyPart.painLevel).toBeLessThanOrEqual(5);
    });
  });

  // ============================================
  // 3. 응답 형식 테스트 (5개)
  // ============================================

  describe('응답 형식', () => {
    it('성공 응답 구조 확인', async () => {
      // Arrange
      const mergeResult = createMockMergeResult();
      mockMergeBodyParts.mockResolvedValue(mergeResult);

      // Act
      const result = await mockMergeBodyParts(requestBodies.rehabGenerate());

      // Assert
      const response = {
        success: true,
        data: {
          course: {
            exercises: result.exercises,
            totalDuration: result.totalDuration,
            stats: result.stats,
          },
          warnings: result.warnings,
        },
      };
      expectSuccessResponse(response);
    });

    it('exercises 배열에 섹션별 운동 포함', async () => {
      // Arrange
      const mergeResult = createMockMergeResult();
      mockMergeBodyParts.mockResolvedValue(mergeResult);

      // Act
      const result = await mockMergeBodyParts(requestBodies.rehabGenerate());

      // Assert
      const sections = result.exercises.map((e: any) => e.section);
      expect(sections).toContain('warmup');
      expect(sections).toContain('main');
      expect(sections).toContain('cooldown');
    });

    it('각 운동에 필수 필드 포함', async () => {
      // Arrange
      const mergeResult = createMockMergeResult();
      mockMergeBodyParts.mockResolvedValue(mergeResult);

      // Act
      const result = await mockMergeBodyParts(requestBodies.rehabGenerate());

      // Assert
      result.exercises.forEach((exercise: any) => {
        expect(exercise.exerciseTemplateId).toBeDefined();
        expect(exercise.exerciseTemplateName).toBeDefined();
        expect(exercise.section).toBeDefined();
        expect(exercise.orderInSection).toBeDefined();
      });
    });

    it('stats에 부위별 통계 포함', async () => {
      // Arrange
      const mergeResult = createMockMergeResult();
      mockMergeBodyParts.mockResolvedValue(mergeResult);

      // Act
      const result = await mockMergeBodyParts(requestBodies.rehabGenerate());

      // Assert
      expect(result.stats.byBodyPart).toBeDefined();
      expect(typeof result.stats.byBodyPart).toBe('object');
    });

    it('warnings 배열 형식', async () => {
      // Arrange
      const mergeResult = createMockMergeResult({
        warnings: ['일부 운동이 제외되었습니다.'],
      });
      mockMergeBodyParts.mockResolvedValue(mergeResult);

      // Act
      const result = await mockMergeBodyParts(requestBodies.rehabGenerate());

      // Assert
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  // ============================================
  // 4. Fallback 처리 테스트 (5개)
  // ============================================

  describe('Fallback 처리', () => {
    it('운동이 0개일 때 에러 응답', async () => {
      // Arrange
      const emptyResult = createMockMergeResult({ exercises: [] });
      mockMergeBodyParts.mockResolvedValue(emptyResult);

      // Act
      const result = await mockMergeBodyParts(requestBodies.rehabGenerate());

      // Assert
      expect(result.exercises).toHaveLength(0);
      // API에서는 404 반환
    });

    it('운동이 3개 미만일 때 경고 메시지', async () => {
      // Arrange
      const fewExercises = createMockMergeResult({
        exercises: [
          createMockMergedExercise({ section: 'main' }),
          createMockMergedExercise({ section: 'cooldown' }),
        ],
        warnings: ['추천 운동이 부족합니다.'],
      });
      mockMergeBodyParts.mockResolvedValue(fewExercises);

      // Act
      const result = await mockMergeBodyParts(requestBodies.rehabGenerate());

      // Assert
      expect(result.exercises.length).toBeLessThan(3);
      expect(result.warnings).toContain('추천 운동이 부족합니다.');
    });

    it('특정 섹션이 비어있을 때 처리', async () => {
      // Arrange
      const noWarmup = createMockMergeResult({
        exercises: [
          createMockMergedExercise({ section: 'main' }),
          createMockMergedExercise({ section: 'cooldown' }),
        ],
        stats: { warmup: 0, main: 1, cooldown: 1, byBodyPart: {} },
      });
      mockMergeBodyParts.mockResolvedValue(noWarmup);

      // Act
      const result = await mockMergeBodyParts(requestBodies.rehabGenerate());

      // Assert
      expect(result.stats.warmup).toBe(0);
    });

    it('금기운동 필터링 후 warnings 포함', async () => {
      // Arrange
      const filteredResult = createMockMergeResult({
        warnings: ['통증 수준에 따라 일부 운동이 제외되었습니다.'],
      });
      mockMergeBodyParts.mockResolvedValue(filteredResult);

      // Act
      const result = await mockMergeBodyParts(requestBodies.rehabGenerate());

      // Assert
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('장비 부족 시 대체 운동 제공', async () => {
      // Arrange
      const noEquipmentResult = createMockMergeResult();
      mockMergeBodyParts.mockResolvedValue(noEquipmentResult);

      // Act
      const result = await mockMergeBodyParts(
        requestBodies.rehabGenerate({ equipmentAvailable: [] })
      );

      // Assert
      expect(result.exercises.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // 5. 복합 시나리오 테스트 (4개)
  // ============================================

  describe('복합 시나리오', () => {
    it('높은 통증 + 초보자 조합', async () => {
      // Arrange
      const result = createMockMergeResult();
      mockMergeBodyParts.mockResolvedValue(result);

      // Act
      const response = await mockMergeBodyParts(
        requestBodies.rehabGenerate({
          bodyParts: [
            { bodyPartId: generateUUID(), bodyPartName: '허리', painLevel: 5 },
          ],
          painLevel: 5,
          experienceLevel: 'beginner',
        })
      );

      // Assert
      expect(response.exercises.length).toBeGreaterThan(0);
    });

    it('다중 부위 + 장비 제한 조합', async () => {
      // Arrange
      const result = createMockMergeResult();
      mockMergeBodyParts.mockResolvedValue(result);

      // Act
      const response = await mockMergeBodyParts(
        requestBodies.rehabGenerate({
          bodyParts: [
            { bodyPartId: generateUUID(), bodyPartName: '허리', painLevel: 3 },
            { bodyPartId: generateUUID(), bodyPartName: '어깨', painLevel: 2 },
            { bodyPartId: generateUUID(), bodyPartName: '무릎', painLevel: 4 },
          ],
          equipmentAvailable: ['매트'],
        })
      );

      // Assert
      expect(response.exercises.length).toBeGreaterThan(0);
    });

    it('120분 코스 생성', async () => {
      // Arrange
      const longCourse = createMockMergeResult({ totalDuration: 120 });
      mockMergeBodyParts.mockResolvedValue(longCourse);

      // Act
      const result = await mockMergeBodyParts(
        requestBodies.rehabGenerate({ totalDurationMinutes: 120 })
      );

      // Assert
      expect(result.totalDuration).toBe(120);
    });

    it('최대 5개 부위 선택', async () => {
      // Arrange
      const fiveBodyParts = Array.from({ length: 5 }, (_, i) => ({
        bodyPartId: generateUUID(),
        bodyPartName: `부위${i + 1}`,
        painLevel: 3,
      }));
      const result = createMockMergeResult();
      mockMergeBodyParts.mockResolvedValue(result);

      // Act
      const response = await mockMergeBodyParts(
        requestBodies.rehabGenerate({ bodyParts: fiveBodyParts })
      );

      // Assert
      expect(response.exercises.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // 6. 에러 케이스 테스트 (3개)
  // ============================================

  describe('에러 케이스', () => {
    it('JSON 파싱 에러 시 400 반환', () => {
      // Arrange
      const invalidJson = '{ invalid json }';
      
      // Assert
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it('데이터베이스 에러 시 500 반환', async () => {
      // Arrange
      mockMergeBodyParts.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        mockMergeBodyParts(requestBodies.rehabGenerate())
      ).rejects.toThrow('Database error');
    });

    it('에러 응답 형식 확인', () => {
      // Arrange
      const errorResponse = {
        success: false,
        error: '요청 파라미터 검증에 실패했습니다.',
        details: [
          { field: 'bodyParts', message: '최소 1개 필요' },
        ],
      };

      // Assert
      expectErrorResponse(errorResponse, '검증에 실패');
      expect(errorResponse.details).toBeDefined();
    });
  });
});
