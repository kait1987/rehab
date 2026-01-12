/**
 * P3-W2-01: 피로도 계산 유틸리티
 * 
 * 걸음 수, 수면 시간, 휴식 심박을 기반으로 피로도 점수를 계산합니다.
 */

export interface FatigueInput {
  /** 최근 7일 걸음 수 배열 (최신순) */
  recentSteps: number[];
  /** 평균 수면 시간 (시간 단위, 선택) */
  avgSleepHours?: number;
  /** 휴식 심박 (bpm, 선택) */
  restingHeartRate?: number;
}

export interface FatigueResult {
  /** 피로도 점수 (0-100, 높을수록 피곤) */
  score: number;
  /** 피로도 레벨 */
  level: 'low' | 'moderate' | 'high';
  /** 권장 사항 */
  recommendation: string;
  /** 계산에 사용된 요소 */
  factors: string[];
}

/**
 * 피로도 계산
 * 
 * 규칙:
 * - 일일 걸음 수 > 12000: +20
 * - 연속 3일 > 10000: +30
 * - 수면 < 6시간: +20
 * - 휴식 심박 > 80: +15
 */
export function calculateFatigue(input: FatigueInput): FatigueResult {
  let score = 0;
  const factors: string[] = [];

  const { recentSteps, avgSleepHours, restingHeartRate } = input;

  // 1. 일일 걸음 수 > 12000
  if (recentSteps.length > 0) {
    const todaySteps = recentSteps[0];
    if (todaySteps > 12000) {
      score += 20;
      factors.push(`오늘 걸음 수 ${todaySteps}보 (고활동)`);
    }
  }

  // 2. 연속 3일 > 10000
  if (recentSteps.length >= 3) {
    const consecutive = recentSteps.slice(0, 3).every(steps => steps > 10000);
    if (consecutive) {
      score += 30;
      factors.push('연속 3일간 10000보 이상');
    }
  }

  // 3. 평균 걸음 수 체크 (지난 7일)
  if (recentSteps.length >= 3) {
    const avgSteps = recentSteps.reduce((a, b) => a + b, 0) / recentSteps.length;
    if (avgSteps > 10000) {
      score += 10;
      factors.push(`평균 ${Math.round(avgSteps)}보/일`);
    }
  }

  // 4. 수면 < 6시간
  if (avgSleepHours !== undefined && avgSleepHours < 6) {
    score += 20;
    factors.push(`평균 수면 ${avgSleepHours.toFixed(1)}시간 (부족)`);
  }

  // 5. 휴식 심박 > 80
  if (restingHeartRate !== undefined && restingHeartRate > 80) {
    score += 15;
    factors.push(`휴식 심박 ${restingHeartRate}bpm (높음)`);
  }

  // 점수 제한 (0-100)
  score = Math.min(100, Math.max(0, score));

  // 레벨 결정
  let level: 'low' | 'moderate' | 'high';
  let recommendation: string;

  if (score >= 50) {
    level = 'high';
    recommendation = '피로도가 높습니다. 오늘은 가벼운 스트레칭 위주의 운동을 권장합니다.';
  } else if (score >= 25) {
    level = 'moderate';
    recommendation = '적당한 피로도입니다. 중강도 운동이 가능합니다.';
  } else {
    level = 'low';
    recommendation = '컨디션이 좋습니다. 계획대로 운동하세요.';
  }

  return {
    score,
    level,
    recommendation,
    factors: factors.length > 0 ? factors : ['충분한 데이터 없음']
  };
}

/**
 * 최근 N일 걸음 수 요약 조회
 * (API에서 호출하여 FatigueInput 구성에 사용)
 */
export function summarizeStepsForFatigue(stepsData: Array<{ value: number; recordedAt: Date }>): number[] {
  // 날짜별 합산
  const dailySteps = new Map<string, number>();
  
  for (const item of stepsData) {
    const dateKey = item.recordedAt.toISOString().split('T')[0];
    dailySteps.set(dateKey, (dailySteps.get(dateKey) || 0) + item.value);
  }

  // 최신순 정렬 후 최대 7일
  const sortedDates = Array.from(dailySteps.keys()).sort().reverse().slice(0, 7);
  return sortedDates.map(date => dailySteps.get(date) || 0);
}
