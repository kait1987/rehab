/**
 * P3-AI: AI 재활 코치 유틸리티 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    userPainProfile: {
      findMany: vi.fn()
    },
    courseCompletionLog: {
      findMany: vi.fn()
    }
  }
}));

describe('detect-exercise-issues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect missing body parts', async () => {
    const { prisma } = await import('@/lib/prisma/client');
    
    // Mock: 사용자에게 부상 부위 있지만 운동 기록 없음
    (prisma.userPainProfile.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { bodyPartId: 'bp-1', bodyPart: { id: 'bp-1', name: '허리' } }
    ]);
    (prisma.courseCompletionLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const { detectExerciseIssues } = await import('@/lib/utils/detect-exercise-issues');
    const issues = await detectExerciseIssues({ userId: 'user-1' });

    expect(issues.some(i => i.type === 'missing_body_part')).toBe(true);
    expect(issues.find(i => i.type === 'missing_body_part')?.bodyPartName).toBe('허리');
  });

  it('should detect low completion rate', async () => {
    const { prisma } = await import('@/lib/prisma/client');
    
    (prisma.userPainProfile.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.courseCompletionLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { status: 'skipped', exerciseTemplate: { id: 'ex-1', name: '스쿼트', bodyPartId: 'bp-1' }, painAfter: null, completedAt: new Date() },
      { status: 'skipped', exerciseTemplate: { id: 'ex-1', name: '스쿼트', bodyPartId: 'bp-1' }, painAfter: null, completedAt: new Date() },
      { status: 'skipped', exerciseTemplate: { id: 'ex-1', name: '스쿼트', bodyPartId: 'bp-1' }, painAfter: null, completedAt: new Date() },
      { status: 'completed', exerciseTemplate: { id: 'ex-1', name: '스쿼트', bodyPartId: 'bp-1' }, painAfter: null, completedAt: new Date() }
    ]);

    const { detectExerciseIssues } = await import('@/lib/utils/detect-exercise-issues');
    const issues = await detectExerciseIssues({ userId: 'user-1' });

    expect(issues.some(i => i.type === 'low_completion')).toBe(true);
    expect(issues.find(i => i.type === 'low_completion')?.exerciseName).toBe('스쿼트');
  });
});

describe('auto-adjust-routine', () => {
  it('should add missing body parts', async () => {
    const { autoAdjustRoutine } = await import('@/lib/algorithms/auto-adjust-routine');
    
    const result = autoAdjustRoutine({
      issues: [{
        type: 'missing_body_part',
        severity: 'warning',
        bodyPartId: 'bp-1',
        bodyPartName: '허리',
        message: '허리 부위가 7일 이상 운동되지 않았습니다.',
        recommendation: '허리 관련 운동을 추가하세요.'
      }],
      preferences: {
        favoriteExercises: [],
        avoidedExercises: [],
        preferredDuration: 60,
        preferredTimeOfDay: null,
        avgCompletionRate: 0,
        hasEnoughData: false
      },
      requestedBodyParts: [
        { bodyPartId: 'bp-2', bodyPartName: '어깨', painLevel: 3 }
      ]
    });

    expect(result.adjustedBodyParts.length).toBe(2);
    expect(result.adjustedBodyParts.some(bp => bp.bodyPartName === '허리')).toBe(true);
    expect(result.adjustments.some(a => a.type === 'add_body_part')).toBe(true);
  });

  it('should decrease intensity on pain increase', async () => {
    const { autoAdjustRoutine } = await import('@/lib/algorithms/auto-adjust-routine');
    
    const result = autoAdjustRoutine({
      issues: [{
        type: 'pain_increase',
        severity: 'critical',
        message: '운동 후 통증이 증가하고 있습니다.',
        recommendation: '휴식을 취하세요.'
      }],
      preferences: {
        favoriteExercises: [],
        avoidedExercises: [],
        preferredDuration: 60,
        preferredTimeOfDay: null,
        avgCompletionRate: 0,
        hasEnoughData: false
      },
      requestedBodyParts: []
    });

    expect(result.intensityAdjustment).toBeLessThan(0);
    expect(result.warnings.some(w => w.includes('통증'))).toBe(true);
  });

  it('should avoid exercises with high skip rate', async () => {
    const { autoAdjustRoutine } = await import('@/lib/algorithms/auto-adjust-routine');
    
    const result = autoAdjustRoutine({
      issues: [],
      preferences: {
        favoriteExercises: [],
        avoidedExercises: [
          { exerciseId: 'ex-1', name: '스쿼트', skipRate: 0.6, totalAttempts: 5 }
        ],
        preferredDuration: 60,
        preferredTimeOfDay: null,
        avgCompletionRate: 0.7,
        hasEnoughData: true
      },
      requestedBodyParts: []
    });

    expect(result.avoidExerciseIds).toContain('ex-1');
  });
});
