/**
 * @file test-fixtures.ts
 * @description E2E 테스트 고정값 및 헬퍼
 * 
 * 이 파일은 다음을 제공합니다:
 * - 테스트 데이터 상수
 * - 헬퍼 함수
 * - Mock 데이터 생성기
 */

// ============================================
// 테스트 데이터 상수
// ============================================

/**
 * 테스트용 좌표 (강남역 주변)
 */
export const TEST_LOCATION = {
  latitude: 37.4979,
  longitude: 127.0276,
  address: '서울특별시 강남구 역삼동',
};

/**
 * 테스트용 부위 선택
 */
export const TEST_BODY_PARTS = {
  허리: { id: 'waist', name: '허리', painLevel: 3 },
  어깨: { id: 'shoulder', name: '어깨', painLevel: 2 },
  무릎: { id: 'knee', name: '무릎', painLevel: 4 },
  목: { id: 'neck', name: '목', painLevel: 2 },
};

/**
 * 테스트용 장비 목록
 */
export const TEST_EQUIPMENT = {
  없음: '없음',
  매트: '매트',
  덤벨: '덤벨',
  밴드: '밴드',
  폼롤러: '폼롤러',
};

/**
 * 테스트용 운동 시간
 */
export const TEST_DURATIONS = {
  SHORT: 60,
  MEDIUM: 90,
  LONG: 120,
};

/**
 * 테스트용 리뷰 태그
 */
export const TEST_REVIEW_TAGS = {
  조용함: 'quiet',
  재활친화: 'rehab-friendly',
  청결함: 'clean',
  친절함: 'friendly',
  장비좋음: 'good-equipment',
};

// ============================================
// data-testid 규칙
// ============================================

/**
 * 표준 data-testid 네이밍 규칙
 * 
 * 형식: [컴포넌트]-[요소]-[수식어?]
 * 
 * 예시:
 * - course-bodypart-허리
 * - course-painlevel-slider
 * - course-duration-60
 * - gym-card-{id}
 * - review-tag-조용함
 * - btn-submit
 * - btn-retry
 * - error-message
 * - loading-spinner
 */
export const TEST_IDS = {
  // 코스 생성 페이지
  course: {
    bodyPart: (name: string) => `course-bodypart-${name}`,
    painLevel: 'course-painlevel-slider',
    equipment: (name: string) => `course-equipment-${name}`,
    duration: (minutes: number) => `course-duration-${minutes}`,
    generateBtn: 'course-generate-btn',
    saveBtn: 'course-save-btn',
    findGymBtn: 'course-find-gym-btn',
    result: 'course-result',
    sectionWarmup: 'course-section-warmup',
    sectionMain: 'course-section-main',
    sectionCooldown: 'course-section-cooldown',
  },
  
  // 헬스장 검색 페이지
  gym: {
    searchInput: 'gym-search-input',
    searchBtn: 'gym-search-btn',
    card: (id: string) => `gym-card-${id}`,
    filter: (name: string) => `gym-filter-${name}`,
    locationBtn: 'gym-location-btn',
    manualAddressInput: 'gym-manual-address-input',
  },
  
  // 리뷰 페이지
  review: {
    tag: (name: string) => `review-tag-${name}`,
    commentInput: 'review-comment-input',
    submitBtn: 'review-submit-btn',
  },
  
  // 공통
  common: {
    loading: 'loading-spinner',
    error: 'error-message',
    retryBtn: 'retry-btn',
    emptyState: 'empty-state',
    toast: 'toast-message',
  },
};

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 테스트용 랜덤 문자열 생성
 */
export function randomString(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * 테스트용 고유 이메일 생성
 */
export function randomEmail(): string {
  return `test-${randomString()}@e2e.test`;
}

/**
 * 테스트용 코멘트 생성
 */
export function randomComment(): string {
  const comments = [
    '좋은 헬스장입니다!',
    '재활운동하기에 적합합니다.',
    '조용하고 청결해요.',
    '트레이너분이 친절합니다.',
    '장비 상태가 좋습니다.',
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}
