/**
 * deduplicate-exercises.ts 단위 테스트
 * 
 * 중복 운동 제거 및 병합 로직을 검증합니다.
 */

import { describe, it, expect } from 'vitest';
import { deduplicateExercises } from '../deduplicate-exercises';
import {
  createMergedExercise,
  EXERCISE_IDS,
  BODY_PART_IDS,
  EXERCISES,
} from './test-fixtures';

describe('deduplicateExercises', () => {
  // ============================================
  // 기본 동작 테스트
  // ============================================
  
  describe('기본 동작', () => {
    it('빈 배열을 입력하면 빈 배열을 반환한다', () => {
      // Arrange
      const exercises: Parameters<typeof deduplicateExercises>[0] = [];
      
      // Act
      const result = deduplicateExercises(exercises);
      
      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('중복이 없는 운동 목록은 그대로 반환한다', () => {
      // Arrange
      const exercises = [
        EXERCISES.latPulldown,
        EXERCISES.pushUp,
        EXERCISES.lunge,
      ];
      
      // Act
      const result = deduplicateExercises(exercises);
      
      // Assert
      expect(result).toHaveLength(3);
      expect(result.map(e => e.exerciseTemplateId)).toEqual([
        EXERCISE_IDS.latPulldown,
        EXERCISE_IDS.pushUp,
        EXERCISE_IDS.lunge,
      ]);
    });

    it('단일 운동을 입력하면 그대로 반환한다', () => {
      // Arrange
      const exercises = [EXERCISES.latPulldown];
      
      // Act
      const result = deduplicateExercises(exercises);
      
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].exerciseTemplateId).toBe(EXERCISE_IDS.latPulldown);
    });
  });

  // ============================================
  // 중복 제거 테스트
  // ============================================

  describe('중복 제거', () => {
    it('같은 exerciseTemplateId를 가진 운동은 하나로 병합된다', () => {
      // Arrange
      const exercise1 = createMergedExercise({
        exerciseTemplateId: EXERCISE_IDS.latPulldown,
        exerciseTemplateName: '랫 풀다운',
        bodyPartIds: [BODY_PART_IDS.back],
        priorityScore: 100,
      });
      const exercise2 = createMergedExercise({
        exerciseTemplateId: EXERCISE_IDS.latPulldown,
        exerciseTemplateName: '랫 풀다운',
        bodyPartIds: [BODY_PART_IDS.back],
        priorityScore: 150,
      });
      
      // Act
      const result = deduplicateExercises([exercise1, exercise2]);
      
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].exerciseTemplateId).toBe(EXERCISE_IDS.latPulldown);
    });

    it('3개 이상의 동일 운동도 하나로 병합된다', () => {
      // Arrange
      const exercises = [
        createMergedExercise({
          exerciseTemplateId: EXERCISE_IDS.pushUp,
          exerciseTemplateName: '푸쉬업',
          priorityScore: 100,
        }),
        createMergedExercise({
          exerciseTemplateId: EXERCISE_IDS.pushUp,
          exerciseTemplateName: '푸쉬업',
          priorityScore: 200,
        }),
        createMergedExercise({
          exerciseTemplateId: EXERCISE_IDS.pushUp,
          exerciseTemplateName: '푸쉬업',
          priorityScore: 300,
        }),
      ];
      
      // Act
      const result = deduplicateExercises(exercises);
      
      // Assert
      expect(result).toHaveLength(1);
    });
  });

  // ============================================
  // bodyPartIds 병합 테스트
  // ============================================

  describe('bodyPartIds 병합', () => {
    it('다른 부위에서 온 같은 운동은 bodyPartIds가 병합된다', () => {
      // Arrange
      const exerciseFromBack = createMergedExercise({
        exerciseTemplateId: EXERCISE_IDS.superman,
        exerciseTemplateName: '수퍼맨 운동',
        bodyPartIds: [BODY_PART_IDS.back],
        priorityScore: 100,
      });
      const exerciseFromWaist = createMergedExercise({
        exerciseTemplateId: EXERCISE_IDS.superman,
        exerciseTemplateName: '수퍼맨 운동',
        bodyPartIds: [BODY_PART_IDS.waist],
        priorityScore: 150,
      });
      
      // Act
      const result = deduplicateExercises([exerciseFromBack, exerciseFromWaist]);
      
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].bodyPartIds).toContain(BODY_PART_IDS.back);
      expect(result[0].bodyPartIds).toContain(BODY_PART_IDS.waist);
      expect(result[0].bodyPartIds).toHaveLength(2);
    });

    it('bodyPartIds에 중복된 부위 ID가 포함되지 않는다', () => {
      // Arrange
      const exercise1 = createMergedExercise({
        exerciseTemplateId: EXERCISE_IDS.latPulldown,
        exerciseTemplateName: '랫 풀다운',
        bodyPartIds: [BODY_PART_IDS.back, BODY_PART_IDS.shoulder],
        priorityScore: 100,
      });
      const exercise2 = createMergedExercise({
        exerciseTemplateId: EXERCISE_IDS.latPulldown,
        exerciseTemplateName: '랫 풀다운',
        bodyPartIds: [BODY_PART_IDS.back], // 중복된 back
        priorityScore: 150,
      });
      
      // Act
      const result = deduplicateExercises([exercise1, exercise2]);
      
      // Assert
      expect(result).toHaveLength(1);
      // Set을 사용하여 중복이 제거된 개수 확인
      const uniqueBodyParts = new Set(result[0].bodyPartIds);
      expect(result[0].bodyPartIds.length).toBe(uniqueBodyParts.size);
    });

    it('3개 이상의 부위에서 온 같은 운동도 모든 bodyPartIds가 병합된다', () => {
      // Arrange
      const exercises = [
        createMergedExercise({
          exerciseTemplateId: EXERCISE_IDS.catStretch,
          exerciseTemplateName: '캣 스트레칭',
          bodyPartIds: [BODY_PART_IDS.back],
        }),
        createMergedExercise({
          exerciseTemplateId: EXERCISE_IDS.catStretch,
          exerciseTemplateName: '캣 스트레칭',
          bodyPartIds: [BODY_PART_IDS.waist],
        }),
        createMergedExercise({
          exerciseTemplateId: EXERCISE_IDS.catStretch,
          exerciseTemplateName: '캣 스트레칭',
          bodyPartIds: [BODY_PART_IDS.hip],
        }),
      ];
      
      // Act
      const result = deduplicateExercises(exercises);
      
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].bodyPartIds).toHaveLength(3);
    });
  });

  // ============================================
  // 우선순위 점수 최적화 테스트
  // ============================================

  describe('우선순위 점수 최적화', () => {
    it('병합 시 가장 낮은 priorityScore를 사용한다 (낮을수록 우선순위 높음)', () => {
      // Arrange
      const exerciseHighPriority = createMergedExercise({
        exerciseTemplateId: EXERCISE_IDS.latPulldown,
        exerciseTemplateName: '랫 풀다운',
        priorityScore: 50, // 낮음 = 높은 우선순위
      });
      const exerciseLowPriority = createMergedExercise({
        exerciseTemplateId: EXERCISE_IDS.latPulldown,
        exerciseTemplateName: '랫 풀다운',
        priorityScore: 150, // 높음 = 낮은 우선순위
      });
      
      // Act
      const result = deduplicateExercises([exerciseLowPriority, exerciseHighPriority]);
      
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].priorityScore).toBe(50);
    });

    it('역순으로 입력해도 가장 낮은 priorityScore를 사용한다', () => {
      // Arrange
      const exercises = [
        createMergedExercise({
          exerciseTemplateId: EXERCISE_IDS.pushUp,
          exerciseTemplateName: '푸쉬업',
          priorityScore: 300,
        }),
        createMergedExercise({
          exerciseTemplateId: EXERCISE_IDS.pushUp,
          exerciseTemplateName: '푸쉬업',
          priorityScore: 100, // 가장 낮음
        }),
        createMergedExercise({
          exerciseTemplateId: EXERCISE_IDS.pushUp,
          exerciseTemplateName: '푸쉬업',
          priorityScore: 200,
        }),
      ];
      
      // Act
      const result = deduplicateExercises(exercises);
      
      // Assert
      expect(result[0].priorityScore).toBe(100);
    });
  });

  // ============================================
  // 속성 유지 테스트
  // ============================================

  describe('속성 유지', () => {
    it('첫 번째 운동의 다른 속성들이 유지된다', () => {
      // Arrange
      const firstExercise = createMergedExercise({
        exerciseTemplateId: EXERCISE_IDS.latPulldown,
        exerciseTemplateName: '랫 풀다운',
        intensityLevel: 3,
        durationMinutes: 8,
        sets: 3,
        reps: 12,
        description: '첫 번째 설명',
      });
      const secondExercise = createMergedExercise({
        exerciseTemplateId: EXERCISE_IDS.latPulldown,
        exerciseTemplateName: '랫 풀다운',
        intensityLevel: 2, // 다른 값
        durationMinutes: 10, // 다른 값
        description: '두 번째 설명', // 다른 값
      });
      
      // Act
      const result = deduplicateExercises([firstExercise, secondExercise]);
      
      // Assert
      expect(result[0].intensityLevel).toBe(3); // 첫 번째 값 유지
      expect(result[0].durationMinutes).toBe(8); // 첫 번째 값 유지
      expect(result[0].description).toBe('첫 번째 설명'); // 첫 번째 값 유지
    });
  });
});
