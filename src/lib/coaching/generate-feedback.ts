/**
 * 규칙 기반 코칭 피드백 생성 로직
 *
 * 운동 세션 완료 후 통증 변화, 완료율, 연속 기록 등을 분석하여
 * 개인화된 코칭 피드백을 생성합니다.
 */

import {
  COMPLETION_MESSAGES,
  PAIN_FEEDBACK_MESSAGES,
  NEXT_SESSION_RECOMMENDATIONS,
  MOTIVATION_MESSAGES,
  BODY_PART_SPECIFIC_ADVICE,
  SECTION_MESSAGES,
  TIME_FEEDBACK,
  pickRandom,
  getStreakMessage,
} from './coaching-messages';
import type { SessionResult, UserFeedback } from '@/hooks/use-session-state';

/**
 * 피드백 유형
 */
export type FeedbackType =
  | 'completion'
  | 'pain'
  | 'streak'
  | 'recommendation'
  | 'motivation'
  | 'bodyPart'
  | 'section'
  | 'time';

/**
 * 단일 피드백 항목
 */
export interface FeedbackItem {
  type: FeedbackType;
  message: string;
  priority: number; // 1이 가장 높음
  emoji?: string;
}

/**
 * 피드백 생성 입력
 */
export interface FeedbackInput {
  sessionResult: SessionResult;
  userFeedback?: UserFeedback;
  painBefore?: Record<string, number>; // 운동 전 부위별 통증
  streak?: number; // 연속 운동 일수
  bodyParts?: string[]; // 운동 대상 부위 이름들
}

/**
 * 피드백 생성 결과
 */
export interface FeedbackResult {
  mainMessage: string;
  feedbackItems: FeedbackItem[];
  summary: {
    overallTone: 'positive' | 'neutral' | 'encouraging';
    shouldRest: boolean;
    intensityRecommendation: 'lower' | 'same' | 'higher';
  };
}

/**
 * 완료율 기반 피드백 생성
 */
function generateCompletionFeedback(
  completionRate: number,
  skippedCount: number
): FeedbackItem {
  let message: string;
  let emoji: string;

  if (completionRate === 100) {
    message = pickRandom(COMPLETION_MESSAGES.perfect);
    emoji = '🎉';
  } else if (completionRate >= 75) {
    message = pickRandom(COMPLETION_MESSAGES.good);
    emoji = '👏';
  } else if (completionRate >= 50) {
    message = pickRandom(COMPLETION_MESSAGES.partial);
    emoji = '💪';
  } else {
    message = pickRandom(COMPLETION_MESSAGES.skippedMany);
    emoji = '🤗';
  }

  return {
    type: 'completion',
    message,
    priority: 1,
    emoji,
  };
}

/**
 * 통증 변화 기반 피드백 생성
 */
function generatePainFeedback(
  painBefore: Record<string, number>,
  painAfter: Record<string, number>
): FeedbackItem[] {
  const feedbackItems: FeedbackItem[] = [];

  for (const bodyPart of Object.keys(painAfter)) {
    const before = painBefore[bodyPart] ?? 5;
    const after = painAfter[bodyPart];
    const diff = before - after;

    let message: string;
    let emoji: string;
    let priority: number;

    if (diff >= 3) {
      // 통증 크게 감소
      message = pickRandom(PAIN_FEEDBACK_MESSAGES.decreased.significant);
      emoji = '✨';
      priority = 2;
    } else if (diff >= 1) {
      // 통증 약간 감소
      message = pickRandom(PAIN_FEEDBACK_MESSAGES.decreased.slight);
      emoji = '👍';
      priority = 3;
    } else if (diff === 0) {
      // 통증 유지
      message = pickRandom(PAIN_FEEDBACK_MESSAGES.same);
      emoji = '➡️';
      priority = 4;
    } else if (diff >= -2) {
      // 통증 약간 증가
      message = pickRandom(PAIN_FEEDBACK_MESSAGES.increased.slight);
      emoji = '⚠️';
      priority = 2;
    } else {
      // 통증 크게 증가
      message = pickRandom(PAIN_FEEDBACK_MESSAGES.increased.significant);
      emoji = '🚨';
      priority = 1;
    }

    feedbackItems.push({
      type: 'pain',
      message: `${bodyPart}: ${message}`,
      priority,
      emoji,
    });
  }

  return feedbackItems;
}

/**
 * 연속 기록 피드백 생성
 */
function generateStreakFeedback(streak: number): FeedbackItem | null {
  const message = getStreakMessage(streak);
  if (!message) return null;

  return {
    type: 'streak',
    message,
    priority: 2,
    emoji: '🔥',
  };
}

/**
 * 다음 세션 권장사항 생성
 */
function generateRecommendation(
  completionRate: number,
  painIncreased: boolean,
  streak: number
): FeedbackItem {
  let message: string;
  let intensity: 'lower' | 'same' | 'higher';

  if (painIncreased) {
    message = pickRandom(NEXT_SESSION_RECOMMENDATIONS.lowerIntensity);
    intensity = 'lower';
  } else if (completionRate < 50) {
    message = pickRandom(NEXT_SESSION_RECOMMENDATIONS.lowerIntensity);
    intensity = 'lower';
  } else if (streak > 5 && completionRate === 100) {
    // 연속 5일 이상 + 완벽 완료 시 휴식 권장
    message = pickRandom(NEXT_SESSION_RECOMMENDATIONS.rest);
    intensity = 'same';
  } else if (completionRate === 100) {
    message = pickRandom(NEXT_SESSION_RECOMMENDATIONS.higherIntensity);
    intensity = 'higher';
  } else {
    message = pickRandom(NEXT_SESSION_RECOMMENDATIONS.sameIntensity);
    intensity = 'same';
  }

  return {
    type: 'recommendation',
    message,
    priority: 3,
    emoji: '📌',
  };
}

/**
 * 동기부여 메시지 생성
 */
function generateMotivation(): FeedbackItem {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;

  let message: string;

  if (isWeekend) {
    message = pickRandom(MOTIVATION_MESSAGES.weekend);
  } else if (hour < 12) {
    message = pickRandom(MOTIVATION_MESSAGES.morning);
  } else if (hour >= 18) {
    message = pickRandom(MOTIVATION_MESSAGES.evening);
  } else {
    message = pickRandom(MOTIVATION_MESSAGES.general);
  }

  return {
    type: 'motivation',
    message,
    priority: 5,
    emoji: '💚',
  };
}

/**
 * 부위별 특화 조언 생성
 */
function generateBodyPartAdvice(
  bodyParts: string[],
  painAfter: Record<string, number>
): FeedbackItem[] {
  const items: FeedbackItem[] = [];

  for (const part of bodyParts) {
    const advice = BODY_PART_SPECIFIC_ADVICE[part as keyof typeof BODY_PART_SPECIFIC_ADVICE];
    if (!advice) continue;

    const pain = painAfter[part] ?? 5;

    if (pain >= 7) {
      items.push({
        type: 'bodyPart',
        message: advice.recovery,
        priority: 2,
        emoji: '💆',
      });
    } else if (pain >= 4) {
      items.push({
        type: 'bodyPart',
        message: advice.afterPain,
        priority: 4,
        emoji: '🩹',
      });
    }
  }

  return items;
}

/**
 * 섹션별 피드백 생성
 */
function generateSectionFeedback(
  sectionStats: SessionResult['sectionStats']
): FeedbackItem[] {
  const items: FeedbackItem[] = [];

  // 준비운동 건너뜀 경고
  if (sectionStats.warmup.total > 0 && sectionStats.warmup.completed === 0) {
    items.push({
      type: 'section',
      message: SECTION_MESSAGES.warmup.skip,
      priority: 2,
      emoji: '⚡',
    });
  }

  // 마무리운동 건너뜀 경고
  if (sectionStats.cooldown.total > 0 && sectionStats.cooldown.completed === 0) {
    items.push({
      type: 'section',
      message: SECTION_MESSAGES.cooldown.skip,
      priority: 3,
      emoji: '🧘',
    });
  }

  // 메인 운동 부분 완료
  if (
    sectionStats.main.total > 0 &&
    sectionStats.main.completed > 0 &&
    sectionStats.main.completed < sectionStats.main.total
  ) {
    items.push({
      type: 'section',
      message: SECTION_MESSAGES.main.partial,
      priority: 3,
      emoji: '💪',
    });
  }

  return items;
}

/**
 * 시간 피드백 생성
 */
function generateTimeFeedback(
  plannedTime: number,
  actualTime: number
): FeedbackItem | null {
  const ratio = actualTime / plannedTime;

  if (ratio < 0.7) {
    return {
      type: 'time',
      message: pickRandom(TIME_FEEDBACK.faster),
      priority: 4,
      emoji: '⏱️',
    };
  } else if (ratio <= 1.1) {
    return {
      type: 'time',
      message: pickRandom(TIME_FEEDBACK.onTime),
      priority: 5,
      emoji: '⏱️',
    };
  } else {
    return {
      type: 'time',
      message: pickRandom(TIME_FEEDBACK.slower),
      priority: 5,
      emoji: '⏱️',
    };
  }
}

/**
 * 전체 피드백 생성
 */
export function generateFeedback(input: FeedbackInput): FeedbackResult {
  const {
    sessionResult,
    userFeedback,
    painBefore = {},
    streak = 0,
    bodyParts = [],
  } = input;

  const feedbackItems: FeedbackItem[] = [];

  // 1. 완료 축하 메시지 (항상 포함)
  feedbackItems.push(
    generateCompletionFeedback(
      sessionResult.completionRate,
      sessionResult.skippedExercises
    )
  );

  // 2. 통증 변화 피드백
  if (userFeedback?.painAfter && Object.keys(painBefore).length > 0) {
    feedbackItems.push(...generatePainFeedback(painBefore, userFeedback.painAfter));
  }

  // 3. 연속 기록 축하
  const streakFeedback = generateStreakFeedback(streak);
  if (streakFeedback) {
    feedbackItems.push(streakFeedback);
  }

  // 4. 섹션별 피드백
  feedbackItems.push(...generateSectionFeedback(sessionResult.sectionStats));

  // 5. 부위별 특화 조언
  if (userFeedback?.painAfter) {
    feedbackItems.push(...generateBodyPartAdvice(bodyParts, userFeedback.painAfter));
  }

  // 6. 시간 피드백
  if (sessionResult.totalPlannedTime > 0) {
    const timeFeedback = generateTimeFeedback(
      sessionResult.totalPlannedTime,
      sessionResult.totalActualTime
    );
    if (timeFeedback) {
      feedbackItems.push(timeFeedback);
    }
  }

  // 7. 다음 세션 권장사항
  const painIncreased = Object.keys(userFeedback?.painAfter ?? {}).some(
    part => (userFeedback?.painAfter?.[part] ?? 0) > (painBefore[part] ?? 5)
  );
  feedbackItems.push(
    generateRecommendation(sessionResult.completionRate, painIncreased, streak)
  );

  // 8. 동기부여 메시지
  feedbackItems.push(generateMotivation());

  // 우선순위로 정렬
  feedbackItems.sort((a, b) => a.priority - b.priority);

  // 요약 생성
  const overallTone =
    sessionResult.completionRate >= 75
      ? 'positive'
      : sessionResult.completionRate >= 50
        ? 'neutral'
        : 'encouraging';

  const shouldRest = painIncreased || streak >= 6;

  const intensityRecommendation = painIncreased
    ? 'lower'
    : sessionResult.completionRate === 100 && !shouldRest
      ? 'higher'
      : 'same';

  // 메인 메시지 (첫 번째 아이템)
  const mainMessage = feedbackItems[0]?.message ?? '운동을 완료했습니다!';

  return {
    mainMessage,
    feedbackItems,
    summary: {
      overallTone,
      shouldRest,
      intensityRecommendation,
    },
  };
}

/**
 * 간단한 피드백 메시지 생성 (UI용)
 * 최대 3개의 피드백만 반환
 */
export function generateSimpleFeedback(
  input: FeedbackInput,
  maxItems: number = 3
): string[] {
  const result = generateFeedback(input);
  return result.feedbackItems
    .slice(0, maxItems)
    .map(item => (item.emoji ? `${item.emoji} ${item.message}` : item.message));
}
