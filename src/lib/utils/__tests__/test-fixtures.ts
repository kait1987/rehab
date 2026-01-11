/**
 * 테스트용 픽스처 및 Mock 데이터
 * 
 * 모든 테스트에서 공통으로 사용하는 샘플 데이터를 정의합니다.
 */

import type { MergedExercise, BodyPartSelection } from '@/types/body-part-merge';

// ============================================
// 부위 ID (테스트용 UUID)
// ============================================

export const BODY_PART_IDS = {
  waist: '11111111-1111-1111-1111-111111111111',    // 허리
  knee: '22222222-2222-2222-2222-222222222222',     // 무릎
  shoulder: '33333333-3333-3333-3333-333333333333', // 어깨
  neck: '44444444-4444-4444-4444-444444444444',     // 목
  wrist: '55555555-5555-5555-5555-555555555555',    // 손목
  ankle: '66666666-6666-6666-6666-666666666666',    // 발목
  elbow: '77777777-7777-7777-7777-777777777777',    // 팔꿈치
  hip: '88888888-8888-8888-8888-888888888888',      // 엉덩이
  back: '99999999-9999-9999-9999-999999999999',     // 등
  chest: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',    // 가슴
} as const;

// ============================================
// 운동 템플릿 ID (테스트용 UUID)
// ============================================

export const EXERCISE_IDS = {
  // 등 운동
  latPulldown: 'ex-lat-pulldown-001',
  seatedRow: 'ex-seated-row-001',
  childPose: 'ex-child-pose-001',
  superman: 'ex-superman-001',
  catStretch: 'ex-cat-stretch-001',
  
  // 가슴 운동
  pushUp: 'ex-push-up-001',
  chestPress: 'ex-chest-press-001',
  chestFly: 'ex-chest-fly-001',
  wallPushUp: 'ex-wall-push-up-001',
  
  // 팔 운동
  bicepCurl: 'ex-bicep-curl-001',
  tricepDip: 'ex-tricep-dip-001',
  
  // 다리 운동
  lunge: 'ex-lunge-001',
  gluteBridge: 'ex-glute-bridge-001',
  sideLunge: 'ex-side-lunge-001',
  
  // 허리 운동
  pelvicTilt: 'ex-pelvic-tilt-001',
  catCow: 'ex-cat-cow-001',
  
  // 어깨 운동
  shoulderStretch: 'ex-shoulder-stretch-001',
  shoulderPress: 'ex-shoulder-press-001',
} as const;

// ============================================
// 부위 선택 생성 함수
// ============================================

/**
 * BodyPartSelection 객체 생성
 */
export function createBodyPartSelection(
  bodyPartId: string,
  bodyPartName: string,
  painLevel: number,
  selectionOrder?: number
): BodyPartSelection {
  return {
    bodyPartId,
    bodyPartName,
    painLevel,
    selectionOrder,
  };
}

/**
 * 자주 사용하는 부위 선택 프리셋
 */
export const BODY_PART_SELECTIONS = {
  waistHigh: createBodyPartSelection(BODY_PART_IDS.waist, '허리', 5, 1),
  waistMedium: createBodyPartSelection(BODY_PART_IDS.waist, '허리', 3, 1),
  waistLow: createBodyPartSelection(BODY_PART_IDS.waist, '허리', 1, 1),
  shoulderHigh: createBodyPartSelection(BODY_PART_IDS.shoulder, '어깨', 5, 2),
  shoulderMedium: createBodyPartSelection(BODY_PART_IDS.shoulder, '어깨', 3, 2),
  neckMedium: createBodyPartSelection(BODY_PART_IDS.neck, '목', 3, 3),
  kneeLow: createBodyPartSelection(BODY_PART_IDS.knee, '무릎', 2, 4),
  backMedium: createBodyPartSelection(BODY_PART_IDS.back, '등', 3, 5),
} as const;

// ============================================
// MergedExercise 생성 함수
// ============================================

/**
 * MergedExercise 객체 생성
 */
export function createMergedExercise(
  overrides: Partial<MergedExercise> & Pick<MergedExercise, 'exerciseTemplateId' | 'exerciseTemplateName'>
): MergedExercise {
  return {
    bodyPartIds: [BODY_PART_IDS.waist],
    priorityScore: 100,
    section: 'main',
    orderInSection: 1,
    durationMinutes: 10,
    reps: 12,
    sets: 3,
    restSeconds: 60,
    intensityLevel: 2,
    ...overrides,
  };
}

/**
 * 자주 사용하는 운동 프리셋
 */
export const EXERCISES = {
  // 낮은 강도 (warmup/cooldown 후보)
  childPose: createMergedExercise({
    exerciseTemplateId: EXERCISE_IDS.childPose,
    exerciseTemplateName: '등 스트레칭 (차일드 포즈)',
    bodyPartIds: [BODY_PART_IDS.back],
    intensityLevel: 1,
    priorityScore: 50,
    durationMinutes: 5,
  }),
  catStretch: createMergedExercise({
    exerciseTemplateId: EXERCISE_IDS.catStretch,
    exerciseTemplateName: '캣 스트레칭',
    bodyPartIds: [BODY_PART_IDS.back],
    intensityLevel: 1,
    priorityScore: 55,
    durationMinutes: 4,
  }),
  wallPushUp: createMergedExercise({
    exerciseTemplateId: EXERCISE_IDS.wallPushUp,
    exerciseTemplateName: '월 푸쉬업',
    bodyPartIds: [BODY_PART_IDS.chest],
    intensityLevel: 1,
    priorityScore: 60,
    durationMinutes: 5,
  }),
  pelvicTilt: createMergedExercise({
    exerciseTemplateId: EXERCISE_IDS.pelvicTilt,
    exerciseTemplateName: '골반 틸트',
    bodyPartIds: [BODY_PART_IDS.waist],
    intensityLevel: 1,
    priorityScore: 45,
    durationMinutes: 5,
  }),
  shoulderStretch: createMergedExercise({
    exerciseTemplateId: EXERCISE_IDS.shoulderStretch,
    exerciseTemplateName: '어깨 스트레칭',
    bodyPartIds: [BODY_PART_IDS.shoulder],
    intensityLevel: 1,
    priorityScore: 65,
    durationMinutes: 4,
  }),
  
  // 중간 강도
  superman: createMergedExercise({
    exerciseTemplateId: EXERCISE_IDS.superman,
    exerciseTemplateName: '수퍼맨 운동',
    bodyPartIds: [BODY_PART_IDS.back],
    intensityLevel: 2,
    priorityScore: 80,
    durationMinutes: 6,
  }),
  gluteBridge: createMergedExercise({
    exerciseTemplateId: EXERCISE_IDS.gluteBridge,
    exerciseTemplateName: '글루트 브릿지',
    bodyPartIds: [BODY_PART_IDS.hip],
    intensityLevel: 2,
    priorityScore: 85,
    durationMinutes: 6,
  }),
  
  // 높은 강도 (main 후보)
  latPulldown: createMergedExercise({
    exerciseTemplateId: EXERCISE_IDS.latPulldown,
    exerciseTemplateName: '랫 풀다운',
    bodyPartIds: [BODY_PART_IDS.back],
    intensityLevel: 3,
    priorityScore: 100,
    durationMinutes: 8,
  }),
  seatedRow: createMergedExercise({
    exerciseTemplateId: EXERCISE_IDS.seatedRow,
    exerciseTemplateName: '시티드 로우',
    bodyPartIds: [BODY_PART_IDS.back],
    intensityLevel: 3,
    priorityScore: 105,
    durationMinutes: 8,
  }),
  pushUp: createMergedExercise({
    exerciseTemplateId: EXERCISE_IDS.pushUp,
    exerciseTemplateName: '푸쉬업',
    bodyPartIds: [BODY_PART_IDS.chest],
    intensityLevel: 3,
    priorityScore: 110,
    durationMinutes: 8,
  }),
  lunge: createMergedExercise({
    exerciseTemplateId: EXERCISE_IDS.lunge,
    exerciseTemplateName: '런지',
    bodyPartIds: [BODY_PART_IDS.knee],
    intensityLevel: 3,
    priorityScore: 115,
    durationMinutes: 8,
  }),
} as const;

// ============================================
// 금기운동 데이터 생성 함수
// ============================================

export interface ContraindicationData {
  exerciseTemplateId: string;
  exerciseTemplateName: string;
  painLevelMin: number | null;
  severity: 'warning' | 'strict';
  reason?: string | null;
}

/**
 * 금기운동 데이터 생성
 */
export function createContraindication(
  exerciseTemplateId: string,
  exerciseTemplateName: string,
  painLevelMin: number | null,
  severity: 'warning' | 'strict',
  reason?: string
): ContraindicationData {
  return {
    exerciseTemplateId,
    exerciseTemplateName,
    painLevelMin,
    severity,
    reason: reason ?? null,
  };
}

/**
 * 자주 사용하는 금기운동 프리셋
 */
export const CONTRAINDICATIONS = {
  // strict: 항상 제외
  latPulldownStrictNull: createContraindication(
    EXERCISE_IDS.latPulldown,
    '랫 풀다운',
    null,
    'strict',
    '허리 통증 시 금지'
  ),
  // strict: 통증 4 이상일 때 제외
  pushUpStrictLevel4: createContraindication(
    EXERCISE_IDS.pushUp,
    '푸쉬업',
    4,
    'strict',
    '어깨 통증 4 이상 시 금지'
  ),
  // warning: 통증 3 이상일 때 경고
  lungeWarningLevel3: createContraindication(
    EXERCISE_IDS.lunge,
    '런지',
    3,
    'warning',
    '무릎 통증 시 주의'
  ),
  // warning: 항상 경고
  seatedRowWarningNull: createContraindication(
    EXERCISE_IDS.seatedRow,
    '시티드 로우',
    null,
    'warning',
    '자세에 주의하세요'
  ),
} as const;
