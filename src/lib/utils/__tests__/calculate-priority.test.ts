/**
 * calculate-priority.ts 단위 테스트
 * 
 * 우선순위 점수 계산 로직을 검증합니다.
 * 
 * 우선순위 점수 공식:
 * (통증 정도 × 100) + (부위 기본 우선순위 × 10) - (운동 강도 × 1) + (매핑 priority × 0.1) + (선택 순서 × 0.01)
 */

import { describe, it, expect } from 'vitest';
import { calculatePriorityScore } from '../calculate-priority';
import { createBodyPartSelection, BODY_PART_SELECTIONS } from './test-fixtures';

describe('calculatePriorityScore', () => {
  // ============================================
  // 기본 계산 테스트
  // ============================================

  describe('기본 계산', () => {
    it('기본 공식이 올바르게 적용된다', () => {
      // Arrange
      // 허리 통증 5점, 매핑 priority 1, intensity 2
      // 공식: (5 × 100) + (1 × 10) - (2 × 1) + (1 × 0.1) + (0 × 0.01)
      // = 500 + 10 - 2 + 0.1 + 0 = 508.1
      const bodyPart = createBodyPartSelection('test-id', '허리', 5);
      
      // Act
      const result = calculatePriorityScore(bodyPart, 1, 2);
      
      // Assert
      expect(result).toBeCloseTo(508.1, 2);
    });

    it('기본 강도(intensityLevel 2)가 적용된다', () => {
      // Arrange
      const bodyPart = createBodyPartSelection('test-id', '허리', 5);
      
      // Act
      const resultWithDefault = calculatePriorityScore(bodyPart, 1);
      const resultWithExplicit = calculatePriorityScore(bodyPart, 1, 2);
      
      // Assert
      expect(resultWithDefault).toBe(resultWithExplicit);
    });

    it('0 값이 포함된 경우에도 올바르게 계산된다', () => {
      // Arrange
      const bodyPart = createBodyPartSelection('test-id', '허리', 1);
      
      // Act
      const result = calculatePriorityScore(bodyPart, 0, 1);
      
      // Assert
      // (1 × 100) + (1 × 10) - (1 × 1) + (0 × 0.1) = 100 + 10 - 1 + 0 = 109
      expect(result).toBeCloseTo(109, 2);
    });
  });

  // ============================================
  // 통증 정도 가중치 테스트
  // ============================================

  describe('통증 정도 가중치 (× 100)', () => {
    it('통증이 높을수록 점수가 증가한다', () => {
      // Arrange
      const lowPain = createBodyPartSelection('test-id', '허리', 1);
      const highPain = createBodyPartSelection('test-id', '허리', 5);
      
      // Act
      const lowPainScore = calculatePriorityScore(lowPain, 1, 2);
      const highPainScore = calculatePriorityScore(highPain, 1, 2);
      
      // Assert
      expect(highPainScore).toBeGreaterThan(lowPainScore);
      expect(highPainScore - lowPainScore).toBe(400); // (5-1) × 100
    });

    it('통증 레벨 1-5에 대해 100씩 증가한다', () => {
      // Arrange & Act
      const scores = [1, 2, 3, 4, 5].map(painLevel => {
        const bodyPart = createBodyPartSelection('test-id', '허리', painLevel);
        return calculatePriorityScore(bodyPart, 1, 2);
      });
      
      // Assert
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i] - scores[i - 1]).toBeCloseTo(100, 5);
      }
    });
  });

  // ============================================
  // 부위 기본 우선순위 테스트
  // ============================================

  describe('부위 기본 우선순위 (× 10)', () => {
    it('허리는 가장 낮은 기본 우선순위를 가진다 (1)', () => {
      // Arrange
      const waist = createBodyPartSelection('test-id', '허리', 3);
      const chest = createBodyPartSelection('test-id', '가슴', 3);
      
      // Act
      const waistScore = calculatePriorityScore(waist, 1, 2);
      const chestScore = calculatePriorityScore(chest, 1, 2);
      
      // Assert
      expect(waistScore).toBeLessThan(chestScore);
    });

    it('정의되지 않은 부위는 기본값 10을 사용한다', () => {
      // Arrange
      const unknown = createBodyPartSelection('test-id', '알수없는부위', 3);
      const waist = createBodyPartSelection('test-id', '허리', 3);
      
      // Act
      const unknownScore = calculatePriorityScore(unknown, 1, 2);
      const waistScore = calculatePriorityScore(waist, 1, 2);
      
      // Assert
      // 알수없는부위: (3 × 100) + (10 × 10) - 2 + 0.1 = 398.1
      // 허리: (3 × 100) + (1 × 10) - 2 + 0.1 = 308.1
      expect(unknownScore - waistScore).toBe(90); // (10 - 1) × 10
    });

    it('모든 정의된 부위가 올바른 우선순위를 가진다', () => {
      // Arrange
      const bodyParts = [
        { name: '허리', expected: 1 },
        { name: '무릎', expected: 2 },
        { name: '어깨', expected: 3 },
        { name: '목', expected: 4 },
        { name: '손목', expected: 5 },
        { name: '발목', expected: 5 },
        { name: '팔꿈치', expected: 6 },
        { name: '엉덩이', expected: 6 },
        { name: '등', expected: 7 },
        { name: '가슴', expected: 8 },
      ];
      
      // Act & Assert
      bodyParts.forEach(({ name, expected }) => {
        const bodyPart = createBodyPartSelection('test-id', name, 3);
        const score = calculatePriorityScore(bodyPart, 1, 2);
        // 점수 = 300 + (expected × 10) - 2 + 0.1
        const expectedScore = 300 + (expected * 10) - 2 + 0.1;
        expect(score).toBeCloseTo(expectedScore, 2);
      });
    });
  });

  // ============================================
  // 운동 강도 페널티 테스트
  // ============================================

  describe('운동 강도 페널티 (× 1)', () => {
    it('운동 강도가 높을수록 점수가 감소한다 (점수가 낮을수록 우선순위 높음)', () => {
      // Arrange
      const bodyPart = createBodyPartSelection('test-id', '허리', 3);
      
      // Act
      const lowIntensityScore = calculatePriorityScore(bodyPart, 1, 1);
      const highIntensityScore = calculatePriorityScore(bodyPart, 1, 4);
      
      // Assert
      // 공식에서 강도를 빼므로, 강도가 높을수록 점수가 낮아짐
      // 낮은 점수 = 높은 우선순위이므로, 높은 강도 운동이 더 우선순위가 높음
      expect(highIntensityScore).toBeLessThan(lowIntensityScore);
      expect(lowIntensityScore - highIntensityScore).toBe(3); // (4-1) × 1
    });

    it('강도 1-4에 대해 1씩 감소한다', () => {
      // Arrange
      const bodyPart = createBodyPartSelection('test-id', '허리', 3);
      
      // Act
      const scores = [1, 2, 3, 4].map(intensity => 
        calculatePriorityScore(bodyPart, 1, intensity)
      );
      
      // Assert
      // 강도가 높아질수록 점수가 줄어듦 (- 연산자 때문)
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i - 1] - scores[i]).toBe(1);
      }
    });
  });

  // ============================================
  // 매핑 우선순위 테스트
  // ============================================

  describe('매핑 우선순위 (× 0.1)', () => {
    it('매핑 priority가 높을수록 점수가 증가한다', () => {
      // Arrange
      const bodyPart = createBodyPartSelection('test-id', '허리', 3);
      
      // Act
      const lowPriorityScore = calculatePriorityScore(bodyPart, 1, 2);
      const highPriorityScore = calculatePriorityScore(bodyPart, 10, 2);
      
      // Assert
      expect(highPriorityScore).toBeGreaterThan(lowPriorityScore);
      expect(highPriorityScore - lowPriorityScore).toBeCloseTo(0.9, 2); // (10-1) × 0.1
    });

    it('매핑 priority 1-5에 대해 0.1씩 증가한다', () => {
      // Arrange
      const bodyPart = createBodyPartSelection('test-id', '허리', 3);
      
      // Act
      const scores = [1, 2, 3, 4, 5].map(priority => 
        calculatePriorityScore(bodyPart, priority, 2)
      );
      
      // Assert
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i] - scores[i - 1]).toBeCloseTo(0.1, 5);
      }
    });
  });

  // ============================================
  // 선택 순서 가중치 테스트
  // ============================================

  describe('선택 순서 (× 0.01)', () => {
    it('선택 순서가 높을수록 점수가 증가한다', () => {
      // Arrange
      const firstSelection = createBodyPartSelection('test-id', '허리', 3, 1);
      const lastSelection = createBodyPartSelection('test-id', '허리', 3, 5);
      
      // Act
      const firstScore = calculatePriorityScore(firstSelection, 1, 2);
      const lastScore = calculatePriorityScore(lastSelection, 1, 2);
      
      // Assert
      expect(lastScore).toBeGreaterThan(firstScore);
      expect(lastScore - firstScore).toBeCloseTo(0.04, 4); // (5-1) × 0.01
    });

    it('선택 순서가 없으면 0으로 처리된다', () => {
      // Arrange
      const withOrder = createBodyPartSelection('test-id', '허리', 3, 1);
      const withoutOrder = createBodyPartSelection('test-id', '허리', 3);
      
      // Act
      const withScore = calculatePriorityScore(withOrder, 1, 2);
      const withoutScore = calculatePriorityScore(withoutOrder, 1, 2);
      
      // Assert
      expect(withScore - withoutScore).toBeCloseTo(0.01, 4); // 1 × 0.01
    });
  });

  // ============================================
  // 복합 시나리오 테스트
  // ============================================

  describe('복합 시나리오', () => {
    it('허리(통증 5점) vs 어깨(통증 3점) 우선순위 비교', () => {
      // Arrange
      const waist = BODY_PART_SELECTIONS.waistHigh; // 허리, 통증 5
      const shoulder = BODY_PART_SELECTIONS.shoulderMedium; // 어깨, 통증 3
      
      // Act
      const waistScore = calculatePriorityScore(waist, 1, 2);
      const shoulderScore = calculatePriorityScore(shoulder, 1, 2);
      
      // Assert
      // 허리: (5×100) + (1×10) - 2 + 0.1 + (1×0.01) = 508.11
      // 어깨: (3×100) + (3×10) - 2 + 0.1 + (2×0.01) = 328.12
      // 하지만 낮을수록 우선순위가 높으므로... 여기서는 점수가 낮은 게 우선
      // 실제로 허리 통증이 더 높으므로 점수도 높음
      expect(waistScore).toBeGreaterThan(shoulderScore);
    });

    it('동일 부위, 동일 통증에서 강도가 높은 운동이 우선순위가 높다 (점수가 낮을수록 우선)', () => {
      // Arrange
      const bodyPart = BODY_PART_SELECTIONS.waistHigh;
      
      // Act
      const lowIntensity = calculatePriorityScore(bodyPart, 1, 1);
      const highIntensity = calculatePriorityScore(bodyPart, 1, 4);
      
      // Assert
      // 강도가 높을수록 점수가 낮아지므로 우선순위가 높음
      expect(highIntensity).toBeLessThan(lowIntensity);
    });

    it('문서의 예시 시나리오가 올바르게 계산된다', () => {
      // Arrange
      // MERGE_ALGORITHM.md 예시:
      // 허리 운동 (통증 5, 기본 우선순위 1, 강도 1, 매핑 priority 1)
      // 점수: (5×100) + (1×10) - (1×1) + (1×0.1) = 509.1
      const waist = createBodyPartSelection('test-id', '허리', 5);
      
      // Act
      const score = calculatePriorityScore(waist, 1, 1);
      
      // Assert
      expect(score).toBeCloseTo(509.1, 1);
    });

    it('모든 가중치가 함께 적용될 때 올바른 결과를 반환한다', () => {
      // Arrange
      // 통증 3, 부위 어깨(3), 강도 2, 매핑 5, 선택순서 2
      // 공식: (3 × 100) + (3 × 10) - (2 × 1) + (5 × 0.1) + (2 × 0.01)
      // = 300 + 30 - 2 + 0.5 + 0.02 = 328.52
      const bodyPart = createBodyPartSelection('test-id', '어깨', 3, 2);
      
      // Act
      const score = calculatePriorityScore(bodyPart, 5, 2);
      
      // Assert
      expect(score).toBeCloseTo(328.52, 2);
    });
  });

  // ============================================
  // 경계값 테스트
  // ============================================

  describe('경계값', () => {
    it('최소 통증(1)과 최대 통증(5)의 차이가 400이다', () => {
      // Arrange
      const minPain = createBodyPartSelection('test-id', '허리', 1);
      const maxPain = createBodyPartSelection('test-id', '허리', 5);
      
      // Act
      const minScore = calculatePriorityScore(minPain, 1, 2);
      const maxScore = calculatePriorityScore(maxPain, 1, 2);
      
      // Assert
      expect(maxScore - minScore).toBe(400);
    });

    it('매우 큰 매핑 priority 값도 처리된다', () => {
      // Arrange
      const bodyPart = createBodyPartSelection('test-id', '허리', 3);
      
      // Act
      const result = calculatePriorityScore(bodyPart, 100, 2);
      
      // Assert
      // (3 × 100) + (1 × 10) - 2 + (100 × 0.1) = 318
      expect(result).toBeCloseTo(318, 1);
    });
  });
});
