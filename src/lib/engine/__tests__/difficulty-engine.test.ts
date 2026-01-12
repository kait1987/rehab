/**
 * ENG-S5-01: Difficulty Engine Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      userFitnessProfile = {
        findUnique: vi.fn()
      }
    }
  };
});

import { 
  calculateDifficulty, 
  applyDifficultyAdjustments 
} from '@/lib/engine/difficulty-engine';

describe('Difficulty Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateDifficulty', () => {
    it('초기 단계 = 낮은 강도, 적은 반복', async () => {
      const result = await calculateDifficulty({
        selectedBodyParts: ['bp-001'],
        painLevels: { 'bp-001': 3 },
        userRehabPhase: 'initial'
      });

      expect(result.recommendedIntensity).toBeLessThanOrEqual(2);
      expect(result.adjustments.repsMultiplier).toBeLessThan(1);
      expect(result.adjustments.restMultiplier).toBeGreaterThan(1);
    });

    it('강화 단계 = 높은 강도, 많은 반복', async () => {
      const result = await calculateDifficulty({
        selectedBodyParts: ['bp-001'],
        painLevels: { 'bp-001': 1 },
        userRehabPhase: 'strengthening'
      });

      expect(result.recommendedIntensity).toBeGreaterThanOrEqual(3);
      expect(result.adjustments.repsMultiplier).toBeGreaterThanOrEqual(1);
      expect(result.adjustments.restMultiplier).toBeLessThanOrEqual(1);
    });

    it('통증 4-5 = 강도 다운', async () => {
      const result = await calculateDifficulty({
        selectedBodyParts: ['bp-001'],
        painLevels: { 'bp-001': 5 },
        userRehabPhase: 'recovery'
      });

      expect(result.recommendedIntensity).toBeLessThanOrEqual(2);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('통증 1-2 = 정상 강도', async () => {
      const result = await calculateDifficulty({
        selectedBodyParts: ['bp-001'],
        painLevels: { 'bp-001': 1 },
        userRehabPhase: 'recovery'
      });

      expect(result.recommendedIntensity).toBeGreaterThanOrEqual(2);
    });
  });

  describe('applyDifficultyAdjustments', () => {
    it('multiplier 적용 결과 검증', () => {
      const exercise = {
        reps: 10,
        sets: 3,
        restSeconds: 30,
        durationMinutes: 5
      };

      const adjustments = {
        repsMultiplier: 0.7,
        setsMultiplier: 1.0,
        restMultiplier: 1.3,
        durationMultiplier: 0.8
      };

      const result = applyDifficultyAdjustments(exercise, adjustments);

      expect(result.reps).toBe(7);  // 10 * 0.7
      expect(result.sets).toBe(3);   // 3 * 1.0
      expect(result.restSeconds).toBe(39);  // 30 * 1.3
      expect(result.durationMinutes).toBe(4);  // 5 * 0.8
    });
  });
});
