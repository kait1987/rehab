/**
 * filter-contraindications.ts 단위 테스트
 * 
 * 금기운동 필터링 로직을 검증합니다.
 * 
 * 필터링 규칙:
 * - painLevelMin === null: 항상 금기
 * - userPainLevel >= painLevelMin: 금기
 * - severity === 'strict': 운동 제외
 * - severity === 'warning': 경고만 표시, 운동 포함
 */

import { describe, it, expect } from 'vitest';
import { filterContraindications } from '../filter-contraindications';
import {
  createMergedExercise,
  createContraindication,
  EXERCISES,
  EXERCISE_IDS,
  CONTRAINDICATIONS,
} from './test-fixtures';

describe('filterContraindications', () => {
  // ============================================
  // 기본 동작 테스트
  // ============================================

  describe('기본 동작', () => {
    it('빈 운동 목록을 입력하면 빈 배열을 반환한다', () => {
      // Arrange
      const exercises: Parameters<typeof filterContraindications>[0] = [];
      const contraindications: Parameters<typeof filterContraindications>[1] = [];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 3);
      
      // Assert
      expect(result.exercises).toEqual([]);
      expect(result.excludedExerciseIds).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('금기운동이 없으면 모든 운동이 그대로 반환된다', () => {
      // Arrange
      const exercises = [EXERCISES.latPulldown, EXERCISES.pushUp, EXERCISES.lunge];
      
      // Act
      const result = filterContraindications(exercises, [], 3);
      
      // Assert
      expect(result.exercises).toHaveLength(3);
      expect(result.excludedExerciseIds).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('결과 객체에 exercises, excludedExerciseIds, warnings가 포함된다', () => {
      // Arrange
      const exercises = [EXERCISES.latPulldown];
      
      // Act
      const result = filterContraindications(exercises, [], 3);
      
      // Assert
      expect(result).toHaveProperty('exercises');
      expect(result).toHaveProperty('excludedExerciseIds');
      expect(result).toHaveProperty('warnings');
    });
  });

  // ============================================
  // strict 금기 운동 테스트
  // ============================================

  describe('strict 금기 운동', () => {
    it('painLevelMin이 null이고 severity가 strict이면 항상 운동이 제외된다', () => {
      // Arrange
      const exercises = [EXERCISES.latPulldown];
      const contraindications = [CONTRAINDICATIONS.latPulldownStrictNull];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 1);
      
      // Assert
      expect(result.exercises).toHaveLength(0);
      expect(result.excludedExerciseIds).toContain(EXERCISE_IDS.latPulldown);
    });

    it('userPainLevel >= painLevelMin이고 severity가 strict이면 운동이 제외된다', () => {
      // Arrange
      const exercises = [EXERCISES.pushUp];
      const contraindications = [CONTRAINDICATIONS.pushUpStrictLevel4];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 5);
      
      // Assert
      expect(result.exercises).toHaveLength(0);
      expect(result.excludedExerciseIds).toContain(EXERCISE_IDS.pushUp);
    });

    it('userPainLevel === painLevelMin일 때도 운동이 제외된다', () => {
      // Arrange
      const exercises = [EXERCISES.pushUp];
      const contraindications = [CONTRAINDICATIONS.pushUpStrictLevel4];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 4); // 정확히 4
      
      // Assert
      expect(result.exercises).toHaveLength(0);
      expect(result.excludedExerciseIds).toContain(EXERCISE_IDS.pushUp);
    });

    it('userPainLevel < painLevelMin이면 운동이 포함된다', () => {
      // Arrange
      const exercises = [EXERCISES.pushUp];
      const contraindications = [CONTRAINDICATIONS.pushUpStrictLevel4];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 3); // 4보다 작음
      
      // Assert
      expect(result.exercises).toHaveLength(1);
      expect(result.excludedExerciseIds).toHaveLength(0);
    });

    it('strict로 제외된 운동의 ID가 excludedExerciseIds에 추가된다', () => {
      // Arrange
      const exercises = [EXERCISES.latPulldown, EXERCISES.pushUp];
      const contraindications = [
        CONTRAINDICATIONS.latPulldownStrictNull,
        CONTRAINDICATIONS.pushUpStrictLevel4,
      ];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 5);
      
      // Assert
      expect(result.excludedExerciseIds).toHaveLength(2);
      expect(result.excludedExerciseIds).toContain(EXERCISE_IDS.latPulldown);
      expect(result.excludedExerciseIds).toContain(EXERCISE_IDS.pushUp);
    });
  });

  // ============================================
  // warning 금기 운동 테스트
  // ============================================

  describe('warning 금기 운동', () => {
    it('painLevelMin이 null이고 severity가 warning이면 운동은 포함되고 경고만 표시된다', () => {
      // Arrange
      const exercises = [EXERCISES.seatedRow];
      const contraindications = [CONTRAINDICATIONS.seatedRowWarningNull];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 3);
      
      // Assert
      expect(result.exercises).toHaveLength(1);
      expect(result.excludedExerciseIds).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('userPainLevel >= painLevelMin이고 severity가 warning이면 운동은 포함되고 경고만 표시된다', () => {
      // Arrange
      const exercises = [EXERCISES.lunge];
      const contraindications = [CONTRAINDICATIONS.lungeWarningLevel3];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 4);
      
      // Assert
      expect(result.exercises).toHaveLength(1);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('런지');
    });

    it('warning 경고 메시지에 운동 이름이 포함된다', () => {
      // Arrange
      const exercises = [EXERCISES.lunge];
      const contraindications = [CONTRAINDICATIONS.lungeWarningLevel3];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 3);
      
      // Assert
      expect(result.warnings[0]).toContain('런지');
    });

    it('warning 경고 메시지에 통증 레벨이 포함된다', () => {
      // Arrange
      const exercises = [EXERCISES.lunge];
      const contraindications = [CONTRAINDICATIONS.lungeWarningLevel3];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 3);
      
      // Assert
      expect(result.warnings[0]).toContain('3');
    });
  });

  // ============================================
  // 금기운동 매칭 테스트
  // ============================================

  describe('금기운동 매칭', () => {
    it('금기운동 목록에 없는 운동은 그대로 통과한다', () => {
      // Arrange
      const exercises = [EXERCISES.childPose, EXERCISES.catStretch];
      const contraindications = [CONTRAINDICATIONS.latPulldownStrictNull];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 5);
      
      // Assert
      expect(result.exercises).toHaveLength(2);
      expect(result.excludedExerciseIds).toHaveLength(0);
    });

    it('exerciseTemplateId로 정확히 매칭된다', () => {
      // Arrange
      const exercises = [EXERCISES.latPulldown, EXERCISES.pushUp];
      const contraindications = [
        createContraindication(
          EXERCISE_IDS.latPulldown, // 정확히 이 ID만 매칭
          '랫 풀다운',
          null,
          'strict'
        ),
      ];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 3);
      
      // Assert
      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].exerciseTemplateId).toBe(EXERCISE_IDS.pushUp);
    });
  });

  // ============================================
  // 통증 정도 비교 테스트
  // ============================================

  describe('통증 정도 비교', () => {
    it('userPainLevel이 1이면 painLevelMin 2 이상의 금기는 적용되지 않는다', () => {
      // Arrange
      const exercises = [EXERCISES.lunge];
      const contraindications = [
        createContraindication(EXERCISE_IDS.lunge, '런지', 2, 'strict'),
      ];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 1);
      
      // Assert
      expect(result.exercises).toHaveLength(1);
    });

    it('userPainLevel이 5이면 painLevelMin 1-5 모든 금기가 적용된다', () => {
      // Arrange
      const exercises = [EXERCISES.lunge];
      const contraindications = [
        createContraindication(EXERCISE_IDS.lunge, '런지', 1, 'strict'),
      ];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 5);
      
      // Assert
      expect(result.exercises).toHaveLength(0);
    });

    it('여러 통증 레벨에 대해 정확히 필터링된다', () => {
      // Arrange
      const exercises = [EXERCISES.lunge];
      const contraindications = [
        createContraindication(EXERCISE_IDS.lunge, '런지', 3, 'strict'),
      ];
      
      // Act & Assert
      // painLevel 1, 2: 포함
      expect(filterContraindications(exercises, contraindications, 1).exercises).toHaveLength(1);
      expect(filterContraindications(exercises, contraindications, 2).exercises).toHaveLength(1);
      // painLevel 3, 4, 5: 제외
      expect(filterContraindications(exercises, contraindications, 3).exercises).toHaveLength(0);
      expect(filterContraindications(exercises, contraindications, 4).exercises).toHaveLength(0);
      expect(filterContraindications(exercises, contraindications, 5).exercises).toHaveLength(0);
    });
  });

  // ============================================
  // 복합 시나리오 테스트
  // ============================================

  describe('복합 시나리오', () => {
    it('strict와 warning이 섞인 금기운동이 올바르게 처리된다', () => {
      // Arrange
      const exercises = [
        EXERCISES.latPulldown,
        EXERCISES.pushUp,
        EXERCISES.lunge,
        EXERCISES.seatedRow,
      ];
      const contraindications = [
        CONTRAINDICATIONS.latPulldownStrictNull,  // strict, null
        CONTRAINDICATIONS.pushUpStrictLevel4,     // strict, level 4
        CONTRAINDICATIONS.lungeWarningLevel3,     // warning, level 3
        CONTRAINDICATIONS.seatedRowWarningNull,   // warning, null
      ];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 5);
      
      // Assert
      // latPulldown: 제외 (strict, null)
      // pushUp: 제외 (strict, 5 >= 4)
      // lunge: 포함 + 경고 (warning, 5 >= 3)
      // seatedRow: 포함 + 경고 (warning, null)
      expect(result.exercises).toHaveLength(2);
      expect(result.excludedExerciseIds).toHaveLength(2);
      expect(result.warnings).toHaveLength(2);
    });

    it('문서의 예시 시나리오가 올바르게 처리된다', () => {
      // Arrange
      // VERIFICATION_3.3에서:
      // 사용자 통증: 5점
      // 금기 운동: pain_level_min = 4, severity = 'strict'
      // 결과: 해당 운동 제외
      const exercises = [
        createMergedExercise({
          exerciseTemplateId: 'test-exercise',
          exerciseTemplateName: '테스트 운동',
        }),
      ];
      const contraindications = [
        createContraindication('test-exercise', '테스트 운동', 4, 'strict'),
      ];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 5);
      
      // Assert
      expect(result.exercises).toHaveLength(0);
      expect(result.excludedExerciseIds).toContain('test-exercise');
    });

    it('금기운동이 많아도 올바르게 필터링된다', () => {
      // Arrange
      const exercises = Array.from({ length: 10 }, (_, i) => 
        createMergedExercise({
          exerciseTemplateId: `exercise-${i}`,
          exerciseTemplateName: `운동 ${i}`,
        })
      );
      const contraindications = [
        createContraindication('exercise-0', '운동 0', null, 'strict'),
        createContraindication('exercise-1', '운동 1', 3, 'strict'),
        createContraindication('exercise-2', '운동 2', 3, 'warning'),
      ];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 4);
      
      // Assert
      // exercise-0: 제외 (strict, null)
      // exercise-1: 제외 (strict, 4 >= 3)
      // exercise-2: 포함 + 경고 (warning, 4 >= 3)
      // exercise-3~9: 포함
      expect(result.exercises).toHaveLength(8);
      expect(result.excludedExerciseIds).toHaveLength(2);
      expect(result.warnings).toHaveLength(1);
    });
  });

  // ============================================
  // 경계값 테스트
  // ============================================

  describe('경계값', () => {
    it('painLevelMin이 1이고 userPainLevel이 1이면 금기가 적용된다', () => {
      // Arrange
      const exercises = [EXERCISES.latPulldown];
      const contraindications = [
        createContraindication(EXERCISE_IDS.latPulldown, '랫 풀다운', 1, 'strict'),
      ];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 1);
      
      // Assert
      expect(result.exercises).toHaveLength(0);
    });

    it('painLevelMin이 5이고 userPainLevel이 4이면 금기가 적용되지 않는다', () => {
      // Arrange
      const exercises = [EXERCISES.latPulldown];
      const contraindications = [
        createContraindication(EXERCISE_IDS.latPulldown, '랫 풀다운', 5, 'strict'),
      ];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 4);
      
      // Assert
      expect(result.exercises).toHaveLength(1);
    });

    it('reason이 없는 금기운동도 올바르게 처리된다', () => {
      // Arrange
      const exercises = [EXERCISES.latPulldown];
      const contraindications = [
        createContraindication(EXERCISE_IDS.latPulldown, '랫 풀다운', null, 'warning'),
      ];
      
      // Act
      const result = filterContraindications(exercises, contraindications, 3);
      
      // Assert
      expect(result.exercises).toHaveLength(1);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
