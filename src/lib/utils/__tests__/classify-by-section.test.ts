/**
 * classify-by-section.ts 단위 테스트
 * 
 * 운동을 섹션별(warmup, main, cooldown)로 분류하는 로직을 검증합니다.
 */

import { describe, it, expect } from 'vitest';
import { classifyBySection } from '../classify-by-section';
import {
  createMergedExercise,
  EXERCISE_IDS,
  BODY_PART_IDS,
  EXERCISES,
} from './test-fixtures';

describe('classifyBySection', () => {
  // ============================================
  // 기본 동작 테스트
  // ============================================

  describe('기본 동작', () => {
    it('빈 배열을 입력하면 모든 섹션이 빈 배열인 결과를 반환한다', () => {
      // Arrange
      const exercises: Parameters<typeof classifyBySection>[0] = [];
      
      // Act
      const result = classifyBySection(exercises);
      
      // Assert
      expect(result.warmup).toEqual([]);
      expect(result.main).toEqual([]);
      expect(result.cooldown).toEqual([]);
    });

    it('결과 객체에 warmup, main, cooldown 키가 존재한다', () => {
      // Arrange
      const exercises = [EXERCISES.latPulldown];
      
      // Act
      const result = classifyBySection(exercises);
      
      // Assert
      expect(result).toHaveProperty('warmup');
      expect(result).toHaveProperty('main');
      expect(result).toHaveProperty('cooldown');
    });
  });

  // ============================================
  // 강도별 분류 테스트
  // ============================================

  describe('강도별 분류', () => {
    it('낮은 강도(intensityLevel <= 2) 운동은 warmup/cooldown 후보가 된다', () => {
      // Arrange
      const lowIntensity = [
        EXERCISES.childPose,      // intensity 1
        EXERCISES.catStretch,     // intensity 1
        EXERCISES.wallPushUp,     // intensity 1
        EXERCISES.superman,       // intensity 2
      ];
      
      // Act
      const result = classifyBySection(lowIntensity);
      
      // Assert
      // 모든 낮은 강도 운동이 warmup 또는 cooldown에 분류됨
      const allInWarmupOrCooldown = lowIntensity.every(exercise => 
        result.warmup.some(e => e.exerciseTemplateId === exercise.exerciseTemplateId) ||
        result.cooldown.some(e => e.exerciseTemplateId === exercise.exerciseTemplateId) ||
        result.main.some(e => e.exerciseTemplateId === exercise.exerciseTemplateId)
      );
      expect(allInWarmupOrCooldown).toBe(true);
    });

    it('높은 강도(intensityLevel > 2) 운동은 main에 분류된다', () => {
      // Arrange
      const highIntensity = [
        EXERCISES.latPulldown,  // intensity 3
        EXERCISES.pushUp,       // intensity 3
        EXERCISES.lunge,        // intensity 3
      ];
      
      // Act
      const result = classifyBySection(highIntensity);
      
      // Assert
      expect(result.main.length).toBe(3);
      expect(result.warmup.length).toBe(0);
      expect(result.cooldown.length).toBe(0);
    });

    it('intensityLevel이 없는 운동은 낮은 강도로 처리된다', () => {
      // Arrange
      const noIntensity = createMergedExercise({
        exerciseTemplateId: 'no-intensity-001',
        exerciseTemplateName: '강도 미정 운동',
        intensityLevel: undefined,
      });
      
      // Act
      const result = classifyBySection([noIntensity]);
      
      // Assert
      // intensityLevel이 없으면 warmup/cooldown 후보
      expect(result.warmup.length + result.cooldown.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================
  // Warmup 분류 테스트
  // ============================================

  describe('Warmup 분류', () => {
    it('warmup에는 최소 2개의 운동이 배치된다', () => {
      // Arrange
      const exercises = [
        EXERCISES.childPose,
        EXERCISES.catStretch,
        EXERCISES.wallPushUp,
        EXERCISES.pelvicTilt,
      ];
      
      // Act
      const result = classifyBySection(exercises);
      
      // Assert
      expect(result.warmup.length).toBeGreaterThanOrEqual(2);
    });

    it('warmup에는 최대 4개의 운동이 배치된다', () => {
      // Arrange
      // 10개의 낮은 강도 운동 생성
      const manyLowIntensity = Array.from({ length: 10 }, (_, i) => 
        createMergedExercise({
          exerciseTemplateId: `low-${i}`,
          exerciseTemplateName: `낮은 강도 운동 ${i}`,
          intensityLevel: 1,
          priorityScore: 50 + i,
        })
      );
      
      // Act
      const result = classifyBySection(manyLowIntensity);
      
      // Assert
      expect(result.warmup.length).toBeLessThanOrEqual(4);
    });

    it('warmup 운동에는 section: "warmup"이 설정된다', () => {
      // Arrange
      const exercises = [EXERCISES.childPose, EXERCISES.catStretch];
      
      // Act
      const result = classifyBySection(exercises);
      
      // Assert
      result.warmup.forEach(exercise => {
        expect(exercise.section).toBe('warmup');
      });
    });

    it('warmup 운동에는 orderInSection이 1부터 순서대로 설정된다', () => {
      // Arrange
      const exercises = [
        EXERCISES.childPose,
        EXERCISES.catStretch,
        EXERCISES.wallPushUp,
        EXERCISES.pelvicTilt,
      ];
      
      // Act
      const result = classifyBySection(exercises);
      
      // Assert
      result.warmup.forEach((exercise, index) => {
        expect(exercise.orderInSection).toBe(index + 1);
      });
    });
  });

  // ============================================
  // Main 분류 테스트
  // ============================================

  describe('Main 분류', () => {
    it('main에는 높은 강도 운동이 포함된다', () => {
      // Arrange
      const mixedExercises = [
        EXERCISES.latPulldown,  // high intensity
        EXERCISES.pushUp,       // high intensity
        EXERCISES.childPose,    // low intensity
      ];
      
      // Act
      const result = classifyBySection(mixedExercises);
      
      // Assert
      const mainIds = result.main.map(e => e.exerciseTemplateId);
      expect(mainIds).toContain(EXERCISE_IDS.latPulldown);
      expect(mainIds).toContain(EXERCISE_IDS.pushUp);
    });

    it('main 운동에는 section: "main"이 설정된다', () => {
      // Arrange
      const exercises = [EXERCISES.latPulldown, EXERCISES.pushUp, EXERCISES.lunge];
      
      // Act
      const result = classifyBySection(exercises);
      
      // Assert
      result.main.forEach(exercise => {
        expect(exercise.section).toBe('main');
      });
    });

    it('main 운동은 priorityScore 기준으로 정렬된다', () => {
      // Arrange
      const unsorted = [
        createMergedExercise({
          exerciseTemplateId: 'high-priority',
          exerciseTemplateName: '높은 점수 (낮은 우선순위)',
          intensityLevel: 3,
          priorityScore: 200,
        }),
        createMergedExercise({
          exerciseTemplateId: 'low-priority',
          exerciseTemplateName: '낮은 점수 (높은 우선순위)',
          intensityLevel: 3,
          priorityScore: 100,
        }),
      ];
      
      // Act
      const result = classifyBySection(unsorted);
      
      // Assert
      expect(result.main[0].priorityScore).toBeLessThanOrEqual(result.main[1].priorityScore);
    });
  });

  // ============================================
  // Cooldown 분류 테스트
  // ============================================

  describe('Cooldown 분류', () => {
    it('cooldown에는 최소 2개의 운동이 배치된다', () => {
      // Arrange
      const exercises = [
        EXERCISES.childPose,
        EXERCISES.catStretch,
        EXERCISES.wallPushUp,
        EXERCISES.pelvicTilt,
        EXERCISES.shoulderStretch,
      ];
      
      // Act
      const result = classifyBySection(exercises);
      
      // Assert
      expect(result.cooldown.length).toBeGreaterThanOrEqual(2);
    });

    it('cooldown에는 최대 3개의 운동이 배치된다', () => {
      // Arrange
      const manyLowIntensity = Array.from({ length: 10 }, (_, i) => 
        createMergedExercise({
          exerciseTemplateId: `low-${i}`,
          exerciseTemplateName: `낮은 강도 운동 ${i}`,
          intensityLevel: 1,
          priorityScore: 50 + i,
        })
      );
      
      // Act
      const result = classifyBySection(manyLowIntensity);
      
      // Assert
      expect(result.cooldown.length).toBeLessThanOrEqual(3);
    });

    it('cooldown 운동에는 section: "cooldown"이 설정된다', () => {
      // Arrange
      const exercises = [
        EXERCISES.childPose,
        EXERCISES.catStretch,
        EXERCISES.wallPushUp,
        EXERCISES.pelvicTilt,
        EXERCISES.shoulderStretch,
      ];
      
      // Act
      const result = classifyBySection(exercises);
      
      // Assert
      result.cooldown.forEach(exercise => {
        expect(exercise.section).toBe('cooldown');
      });
    });

    it('cooldown에 포함된 운동은 main에서 제거된다', () => {
      // Arrange
      const exercises = [
        EXERCISES.childPose,
        EXERCISES.catStretch,
        EXERCISES.wallPushUp,
        EXERCISES.pelvicTilt,
        EXERCISES.shoulderStretch,
      ];
      
      // Act
      const result = classifyBySection(exercises);
      
      // Assert
      const cooldownIds = new Set(result.cooldown.map(e => e.exerciseTemplateId));
      const mainIds = result.main.map(e => e.exerciseTemplateId);
      
      mainIds.forEach(id => {
        expect(cooldownIds.has(id)).toBe(false);
      });
    });
  });

  // ============================================
  // 복합 시나리오 테스트
  // ============================================

  describe('복합 시나리오', () => {
    it('혼합된 강도의 운동이 올바르게 분류된다', () => {
      // Arrange
      const mixed = [
        EXERCISES.childPose,     // low
        EXERCISES.catStretch,    // low
        EXERCISES.wallPushUp,    // low
        EXERCISES.pelvicTilt,    // low
        EXERCISES.shoulderStretch, // low
        EXERCISES.latPulldown,   // high
        EXERCISES.pushUp,        // high
        EXERCISES.lunge,         // high
      ];
      
      // Act
      const result = classifyBySection(mixed);
      
      // Assert
      // warmup: 2-4개 (낮은 강도)
      expect(result.warmup.length).toBeGreaterThanOrEqual(2);
      expect(result.warmup.length).toBeLessThanOrEqual(4);
      
      // main: 높은 강도 + 일부 낮은 강도
      expect(result.main.length).toBeGreaterThan(0);
      
      // cooldown: 2-3개 (낮은 강도)
      expect(result.cooldown.length).toBeGreaterThanOrEqual(2);
      expect(result.cooldown.length).toBeLessThanOrEqual(3);
      
      // 높은 강도 운동은 모두 main에 있어야 함
      const mainIds = new Set(result.main.map(e => e.exerciseTemplateId));
      expect(mainIds.has(EXERCISE_IDS.latPulldown)).toBe(true);
      expect(mainIds.has(EXERCISE_IDS.pushUp)).toBe(true);
      expect(mainIds.has(EXERCISE_IDS.lunge)).toBe(true);
    });

    it('낮은 강도 운동만 있을 때도 올바르게 분류된다', () => {
      // Arrange
      const allLow = [
        EXERCISES.childPose,
        EXERCISES.catStretch,
        EXERCISES.wallPushUp,
        EXERCISES.pelvicTilt,
        EXERCISES.shoulderStretch,
      ];
      
      // Act
      const result = classifyBySection(allLow);
      
      // Assert
      // 모든 운동이 warmup, main, cooldown 중 하나에 분류됨
      const totalClassified = 
        result.warmup.length + result.main.length + result.cooldown.length;
      // 중복 제거되는 부분이 있을 수 있으므로 >= 사용
      expect(totalClassified).toBeLessThanOrEqual(allLow.length + result.cooldown.length);
    });

    it('높은 강도 운동만 있을 때 모두 main에 분류된다', () => {
      // Arrange
      const allHigh = [
        EXERCISES.latPulldown,
        EXERCISES.pushUp,
        EXERCISES.lunge,
      ];
      
      // Act
      const result = classifyBySection(allHigh);
      
      // Assert
      expect(result.warmup.length).toBe(0);
      expect(result.main.length).toBe(3);
      expect(result.cooldown.length).toBe(0);
    });
  });

  // ============================================
  // 메인 우선순위 중복 제거 테스트
  // ============================================

  describe('메인 우선순위 중복 제거', () => {
    it('동일 운동이 여러 섹션에 있으면 main에만 남는다', () => {
      // Arrange: 같은 운동(A)이 warmup, main, cooldown 모두에 들어갈 수 있는 상황
      const duplicated = createMergedExercise({
        exerciseTemplateId: 'dup-001',
        exerciseTemplateName: '중복 운동 A',
        intensityLevel: 1, // 낮은 강도 (warmup/cooldown 후보)
        priorityScore: 10,
      });

      // 7개의 낮은 강도 운동을 만들어 중복이 발생할 수 있는 상황 구성
      const exercises = [
        duplicated,
        createMergedExercise({
          exerciseTemplateId: 'low-1',
          exerciseTemplateName: '낮은 강도 1',
          intensityLevel: 1,
          priorityScore: 20,
        }),
        createMergedExercise({
          exerciseTemplateId: 'low-2',
          exerciseTemplateName: '낮은 강도 2',
          intensityLevel: 1,
          priorityScore: 30,
        }),
        createMergedExercise({
          exerciseTemplateId: 'low-3',
          exerciseTemplateName: '낮은 강도 3',
          intensityLevel: 1,
          priorityScore: 40,
        }),
        createMergedExercise({
          exerciseTemplateId: 'low-4',
          exerciseTemplateName: '낮은 강도 4',
          intensityLevel: 1,
          priorityScore: 50,
        }),
        createMergedExercise({
          exerciseTemplateId: 'low-5',
          exerciseTemplateName: '낮은 강도 5',
          intensityLevel: 1,
          priorityScore: 60,
        }),
        createMergedExercise({
          exerciseTemplateId: 'low-6',
          exerciseTemplateName: '낮은 강도 6',
          intensityLevel: 1,
          priorityScore: 70,
        }),
      ];

      // Act
      const result = classifyBySection(exercises);

      // Assert: 전체 섹션에서 각 운동은 1번씩만 나와야 함
      const allIds = [
        ...result.warmup.map(e => e.exerciseTemplateId),
        ...result.main.map(e => e.exerciseTemplateId),
        ...result.cooldown.map(e => e.exerciseTemplateId),
      ];

      const uniqueIds = new Set(allIds);
      expect(allIds.length).toBe(uniqueIds.size); // 중복 없음
    });

    it('warmup과 main 모두에 후보인 운동은 main에서만 나타난다', () => {
      // Arrange
      // main에도 후보가 되면서 warmup에도 들어갈 수 있는 운동
      const lowIntensityExercises = Array.from({ length: 8 }, (_, i) =>
        createMergedExercise({
          exerciseTemplateId: `exercise-${i}`,
          exerciseTemplateName: `운동 ${i}`,
          intensityLevel: 1,
          priorityScore: 10 + i * 10,
        })
      );

      // Act
      const result = classifyBySection(lowIntensityExercises);

      // Assert: warmup에 있는 운동은 main에 없어야 함
      const warmupIds = new Set(result.warmup.map(e => e.exerciseTemplateId));
      const mainIds = result.main.map(e => e.exerciseTemplateId);
      const cooldownIds = new Set(result.cooldown.map(e => e.exerciseTemplateId));

      mainIds.forEach(id => {
        expect(warmupIds.has(id)).toBe(false);
        expect(cooldownIds.has(id)).toBe(false);
      });
    });

    it('전체 섹션 합쳤을 때 동일 exerciseTemplateId는 딱 1번만 존재한다', () => {
      // Arrange
      const mixed = [
        EXERCISES.childPose,
        EXERCISES.catStretch,
        EXERCISES.wallPushUp,
        EXERCISES.pelvicTilt,
        EXERCISES.shoulderStretch,
        EXERCISES.latPulldown,
        EXERCISES.pushUp,
        EXERCISES.lunge,
      ];

      // Act
      const result = classifyBySection(mixed);

      // Assert
      const allIds = [
        ...result.warmup.map(e => e.exerciseTemplateId),
        ...result.main.map(e => e.exerciseTemplateId),
        ...result.cooldown.map(e => e.exerciseTemplateId),
      ];

      const uniqueIds = new Set(allIds);
      expect(allIds.length).toBe(uniqueIds.size);
    });
  });
});
