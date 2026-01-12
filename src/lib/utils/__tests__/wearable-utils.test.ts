/**
 * P3-W2-01/02: 피로도 및 심박 계산 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import { calculateFatigue, summarizeStepsForFatigue } from '@/lib/utils/calculate-fatigue';
import { calculateIntensityFromHR, isZoneAllowed } from '@/lib/utils/calculate-intensity-from-hr';

describe('calculateFatigue', () => {
  it('걸음수만으로 기본 피로도 계산 가능', () => {
    const result = calculateFatigue({
      recentSteps: [8000, 7500, 6000, 5000, 4000, 3000, 2000]
    });
    
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(['low', 'moderate', 'high']).toContain(result.level);
    expect(result.recommendation).toBeTruthy();
  });

  it('고활동량 시 피로도 높음', () => {
    const result = calculateFatigue({
      recentSteps: [15000, 13000, 12000, 11000, 10000, 9000, 8000]
    });
    
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.level).toBe('high');
  });

  it('저활동량 시 피로도 낮음', () => {
    const result = calculateFatigue({
      recentSteps: [3000, 2500, 2000, 1500, 1000, 500, 0]
    });
    
    expect(result.score).toBeLessThan(25);
    expect(result.level).toBe('low');
  });

  it('수면 부족 시 피로도 증가', () => {
    const withSleep = calculateFatigue({
      recentSteps: [5000, 5000, 5000],
      avgSleepHours: 5
    });
    
    const withoutSleep = calculateFatigue({
      recentSteps: [5000, 5000, 5000]
    });
    
    expect(withSleep.score).toBeGreaterThan(withoutSleep.score);
  });

  it('높은 휴식 심박 시 피로도 증가', () => {
    const highHR = calculateFatigue({
      recentSteps: [5000, 5000, 5000],
      restingHeartRate: 85
    });
    
    const normalHR = calculateFatigue({
      recentSteps: [5000, 5000, 5000],
      restingHeartRate: 65
    });
    
    expect(highHR.score).toBeGreaterThan(normalHR.score);
  });
});

describe('summarizeStepsForFatigue', () => {
  it('날짜별로 걸음수를 합산', () => {
    const data = [
      { value: 5000, recordedAt: new Date('2026-01-13') },
      { value: 3000, recordedAt: new Date('2026-01-13') },
      { value: 8000, recordedAt: new Date('2026-01-12') }
    ];
    
    const result = summarizeStepsForFatigue(data);
    
    expect(result[0]).toBe(8000); // 1/13 total
    expect(result[1]).toBe(8000); // 1/12
  });
});

describe('calculateIntensityFromHR', () => {
  it('휴식 심박으로 Zone 계산', () => {
    const result = calculateIntensityFromHR({
      restingHR: 60,
      age: 30
    });
    
    expect(result.maxHR).toBe(190); // 220-30
    expect(result.heartRateReserve).toBe(130); // 190-60
    expect(result.zones).toHaveLength(4);
    expect(result.recommendedZone).toBe('fat_burn'); // recovery phase default
  });

  it('재활 단계별 Zone 제한', () => {
    const initial = calculateIntensityFromHR({
      restingHR: 60,
      rehabPhase: 'initial'
    });
    
    const strengthening = calculateIntensityFromHR({
      restingHR: 60,
      rehabPhase: 'strengthening'
    });
    
    expect(initial.recommendedZone).toBe('recovery');
    expect(initial.restrictedZones).toContain('cardio');
    expect(initial.restrictedZones).toContain('peak');
    
    expect(strengthening.recommendedZone).toBe('cardio');
    expect(strengthening.restrictedZones).not.toContain('cardio');
  });

  it('maxHR 없으면 기본값 사용', () => {
    const result = calculateIntensityFromHR({
      restingHR: 60
    });
    
    expect(result.maxHR).toBe(190); // 기본값 (나이 없으면)
  });
});

describe('isZoneAllowed', () => {
  it('initial 단계에서 recovery만 허용', () => {
    expect(isZoneAllowed('recovery', 'initial')).toBe(true);
    expect(isZoneAllowed('fat_burn', 'initial')).toBe(false);
    expect(isZoneAllowed('cardio', 'initial')).toBe(false);
  });

  it('strengthening 단계에서 cardio까지 허용', () => {
    expect(isZoneAllowed('cardio', 'strengthening')).toBe(true);
    expect(isZoneAllowed('peak', 'strengthening')).toBe(false);
  });
});
