/**
 * @file test-helpers.ts
 * @description API 테스트를 위한 Mock 객체 및 팩토리 함수
 * 
 * 이 파일은 다음을 제공합니다:
 * - Prisma Mock (20+ methods)
 * - Clerk Mock (currentUser)
 * - NextRequest/NextResponse Mock
 * - 팩토리 함수 (Gym, Review, Course, User 등)
 * - 유틸리티 함수 (응답 검증, 에러 생성 등)
 */

import { vi, expect } from 'vitest';

// ============================================
// 1️⃣ Mock 객체 정의
// ============================================

/**
 * Prisma Mock
 * 모든 Prisma 메서드를 가짜 함수로 대체
 */
export const mockPrisma = {
  // Gym
  gym: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  // GymFacility
  gymFacility: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  // User
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  // Review
  review: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  // ReviewTag
  reviewTag: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  // ReviewTagMapping
  reviewTagMapping: {
    create: vi.fn(),
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  // Course
  course: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  // CourseExercise
  courseExercise: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
  // BodyPart
  bodyPart: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  // ExerciseTemplate
  exerciseTemplate: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  // Transaction
  $transaction: vi.fn((callback) => callback(mockPrisma)),
};

/**
 * Clerk Mock (currentUser)
 */
export const mockCurrentUser = vi.fn();

/**
 * GymSearchService Mock
 */
export const mockGymSearchService = {
  searchGymsNearby: vi.fn(),
};

/**
 * MergeBodyParts Mock
 */
export const mockMergeBodyParts = vi.fn();

// ============================================
// 2️⃣ 타입 정의
// ============================================

export interface MockUser {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  displayName: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockClerkUser {
  id: string;
  emailAddresses: { emailAddress: string }[];
  firstName: string;
  lastName: string;
}

export interface MockGym {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  priceRange: string | null;
  description: string | null;
  isActive: boolean;
  facilities?: MockGymFacility;
  distanceMeters?: number;
}

export interface MockGymFacility {
  id: string;
  gymId: string;
  isQuiet: boolean;
  hasRehabEquipment: boolean;
  hasPtCoach: boolean;
  hasShower: boolean;
  hasParking: boolean;
  hasLocker: boolean;
}

export interface MockReview {
  id: string;
  gymId: string;
  userId: string;
  comment: string | null;
  isAdminReview: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  gym?: { id: string; name: string };
  user?: MockUser;
  reviewTagMappings?: MockReviewTagMapping[];
}

export interface MockReviewTag {
  id: string;
  name: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
}

export interface MockReviewTagMapping {
  id: string;
  reviewId: string;
  reviewTagId: string;
  reviewTag?: MockReviewTag;
}

export interface MockCourse {
  id: string;
  userId: string;
  totalDurationMinutes: 60 | 90 | 120;
  painLevel: number;
  experienceLevel: string | null;
  bodyParts: string[];
  equipmentAvailable: string[];
  courseType: string;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  courseExercises?: MockCourseExercise[];
}

export interface MockCourseExercise {
  id: string;
  courseId: string;
  exerciseTemplateId: string;
  section: 'warmup' | 'main' | 'cooldown';
  orderInSection: number;
  durationMinutes: number | null;
  reps: number | null;
  sets: number | null;
  restSeconds: number | null;
  notes: string | null;
}

export interface MockMergedExercise {
  exerciseTemplateId: string;
  exerciseTemplateName: string;
  bodyPartIds: string[];
  priorityScore: number;
  section: 'warmup' | 'main' | 'cooldown';
  orderInSection: number;
  durationMinutes: number;
  reps: number;
  sets: number;
  restSeconds: number;
  intensityLevel: number;
}

export interface MockMergeResult {
  exercises: MockMergedExercise[];
  totalDuration: number;
  warnings: string[];
  stats: {
    warmup: number;
    main: number;
    cooldown: number;
    byBodyPart: Record<string, number>;
  };
}

// ============================================
// 3️⃣ 팩토리 함수
// ============================================

let idCounter = 0;

/**
 * 고유 UUID 생성
 */
export function generateUUID(): string {
  idCounter++;
  return `00000000-0000-0000-0000-${String(idCounter).padStart(12, '0')}`;
}

/**
 * DB User Mock 생성
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  const id = generateUUID();
  return {
    id,
    clerkId: `clerk_${id.slice(-8)}`,
    email: `user_${id.slice(-8)}@test.com`,
    name: `Test User ${idCounter}`,
    displayName: `테스트 유저 ${idCounter}`,
    isAdmin: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Clerk User Mock 생성
 */
export function createMockClerkUser(overrides: Partial<MockClerkUser> = {}): MockClerkUser {
  const id = `clerk_${generateUUID().slice(-8)}`;
  return {
    id,
    emailAddresses: [{ emailAddress: `${id}@test.com` }],
    firstName: 'Test',
    lastName: 'User',
    ...overrides,
  };
}

/**
 * Gym Mock 생성
 */
export function createMockGym(overrides: Partial<MockGym> = {}): MockGym {
  const id = generateUUID();
  return {
    id,
    name: `테스트 헬스장 ${idCounter}`,
    address: `서울특별시 강남구 테스트로 ${idCounter}`,
    latitude: 37.5 + Math.random() * 0.01,
    longitude: 127.0 + Math.random() * 0.01,
    phone: `02-1234-${String(idCounter).padStart(4, '0')}`,
    website: `https://gym${idCounter}.test.com`,
    priceRange: 'medium',
    description: `테스트 헬스장 ${idCounter} 설명`,
    isActive: true,
    ...overrides,
  };
}

/**
 * GymFacility Mock 생성
 */
export function createMockGymFacility(gymId: string, overrides: Partial<MockGymFacility> = {}): MockGymFacility {
  return {
    id: generateUUID(),
    gymId,
    isQuiet: false,
    hasRehabEquipment: true,
    hasPtCoach: false,
    hasShower: true,
    hasParking: true,
    hasLocker: true,
    ...overrides,
  };
}

/**
 * Gym + Facility Mock 생성
 */
export function createMockGymWithFacility(
  gymOverrides: Partial<MockGym> = {},
  facilityOverrides: Partial<MockGymFacility> = {}
): MockGym {
  const gym = createMockGym(gymOverrides);
  gym.facilities = createMockGymFacility(gym.id, facilityOverrides);
  return gym;
}

/**
 * ReviewTag Mock 생성
 */
export function createMockReviewTag(overrides: Partial<MockReviewTag> = {}): MockReviewTag {
  const id = generateUUID();
  return {
    id,
    name: `태그_${idCounter}`,
    category: 'general',
    displayOrder: idCounter,
    isActive: true,
    ...overrides,
  };
}

/**
 * Review Mock 생성
 */
export function createMockReview(overrides: Partial<MockReview> = {}): MockReview {
  const id = generateUUID();
  const now = new Date();
  return {
    id,
    gymId: generateUUID(),
    userId: generateUUID(),
    comment: `리뷰 내용 ${idCounter}`,
    isAdminReview: false,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Course Mock 생성
 */
export function createMockCourse(overrides: Partial<MockCourse> = {}): MockCourse {
  const id = generateUUID();
  const now = new Date();
  return {
    id,
    userId: generateUUID(),
    totalDurationMinutes: 60,
    painLevel: 3,
    experienceLevel: 'beginner',
    bodyParts: ['허리'],
    equipmentAvailable: ['매트'],
    courseType: 'warmup_main_cooldown',
    isTemplate: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * MergedExercise Mock 생성
 */
export function createMockMergedExercise(overrides: Partial<MockMergedExercise> = {}): MockMergedExercise {
  const id = generateUUID();
  return {
    exerciseTemplateId: id,
    exerciseTemplateName: `운동_${idCounter}`,
    bodyPartIds: [generateUUID()],
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
 * MergeResult Mock 생성
 */
export function createMockMergeResult(overrides: Partial<MockMergeResult> = {}): MockMergeResult {
  return {
    exercises: [
      createMockMergedExercise({ section: 'warmup', orderInSection: 1, intensityLevel: 1 }),
      createMockMergedExercise({ section: 'main', orderInSection: 1, intensityLevel: 3 }),
      createMockMergedExercise({ section: 'main', orderInSection: 2, intensityLevel: 3 }),
      createMockMergedExercise({ section: 'cooldown', orderInSection: 1, intensityLevel: 1 }),
    ],
    totalDuration: 60,
    warnings: [],
    stats: {
      warmup: 1,
      main: 2,
      cooldown: 1,
      byBodyPart: { '허리': 4 },
    },
    ...overrides,
  };
}

// ============================================
// 4️⃣ 유틸리티 함수
// ============================================

/**
 * 모든 Mock 초기화
 */
export function resetAllMocks(): void {
  vi.clearAllMocks();
  idCounter = 0;
}

/**
 * 성공 응답 검증
 */
export function expectSuccessResponse(response: { success: boolean; data?: unknown }): void {
  expect(response.success).toBe(true);
  expect(response.data).toBeDefined();
}

/**
 * 에러 응답 검증
 */
export function expectErrorResponse(
  response: { success: boolean; error?: string },
  expectedError?: string
): void {
  expect(response.success).toBe(false);
  if (expectedError) {
    expect(response.error).toContain(expectedError);
  }
}

/**
 * HTTP 상태 코드 검증
 */
export function expectStatusCode(status: number, expected: number): void {
  expect(status).toBe(expected);
}

/**
 * 날짜가 24시간 이내인지 확인
 */
export function isWithin24Hours(date: Date): boolean {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);
  return hours <= 24;
}

/**
 * 날짜를 N시간 전으로 설정
 */
export function hoursAgo(hours: number): Date {
  const date = new Date();
  date.setTime(date.getTime() - hours * 60 * 60 * 1000);
  return date;
}

/**
 * Gym 검색 결과 Mock 생성
 */
export function createMockGymSearchResults(count: number = 3): MockGym[] {
  return Array.from({ length: count }, (_, i) =>
    createMockGymWithFacility(
      { distanceMeters: (i + 1) * 100 },
      { hasRehabEquipment: i % 2 === 0 }
    )
  );
}

/**
 * API 요청 본문 생성 헬퍼
 */
export const requestBodies = {
  /**
   * 재활 코스 생성 요청
   */
  rehabGenerate: (overrides: Record<string, unknown> = {}) => ({
    bodyParts: [
      { bodyPartId: generateUUID(), bodyPartName: '허리', painLevel: 3 },
    ],
    painLevel: 3,
    equipmentAvailable: ['매트'],
    experienceLevel: 'beginner',
    totalDurationMinutes: 60,
    ...overrides,
  }),

  /**
   * 코스 저장 요청
   */
  courseSave: (overrides: Record<string, unknown> = {}) => ({
    totalDurationMinutes: 60,
    painLevel: 3,
    experienceLevel: 'beginner',
    bodyParts: ['허리'],
    equipmentAvailable: ['매트'],
    exercises: [createMockMergedExercise()],
    ...overrides,
  }),

  /**
   * 리뷰 작성 요청
   */
  reviewCreate: (overrides: Record<string, unknown> = {}) => ({
    gymId: generateUUID(),
    tagIds: [generateUUID()],
    comment: '좋은 헬스장입니다.',
    ...overrides,
  }),

  /**
   * 리뷰 수정 요청
   */
  reviewUpdate: (overrides: Record<string, unknown> = {}) => ({
    tagIds: [generateUUID()],
    comment: '수정된 리뷰입니다.',
    ...overrides,
  }),
};

// ============================================
// 5️⃣ 검색 쿼리 파라미터 헬퍼
// ============================================

export const searchParams = {
  /**
   * 헬스장 검색 기본 파라미터
   */
  gymSearch: (overrides: Record<string, string> = {}) => ({
    lat: '37.5',
    lng: '127.0',
    radius: '1000',
    ...overrides,
  }),

  /**
   * 필터 적용된 헬스장 검색
   */
  gymSearchWithFilters: (filters: Record<string, string> = {}) => ({
    lat: '37.5',
    lng: '127.0',
    radius: '1000',
    hasRehabEquipment: 'true',
    ...filters,
  }),
};

// ============================================
// 6️⃣ 에러 시나리오 헬퍼
// ============================================

export const errorScenarios = {
  /**
   * Prisma 에러 시뮬레이션
   */
  prismaError: () => new Error('Prisma 연결 실패'),

  /**
   * 인증 실패 시뮬레이션
   */
  authError: () => {
    mockCurrentUser.mockResolvedValue(null);
  },

  /**
   * 사용자 없음 시뮬레이션
   */
  userNotFound: () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
  },

  /**
   * 리소스 없음 시뮬레이션
   */
  notFound: (model: 'gym' | 'review' | 'course') => {
    mockPrisma[model].findUnique.mockResolvedValue(null);
  },
};

// ============================================
// 7️⃣ 설정 함수
// ============================================

/**
 * 인증된 사용자 설정
 */
export function setupAuthenticatedUser(): { clerkUser: MockClerkUser; dbUser: MockUser } {
  const clerkUser = createMockClerkUser();
  const dbUser = createMockUser({ clerkId: clerkUser.id });
  
  mockCurrentUser.mockResolvedValue(clerkUser);
  mockPrisma.user.findUnique.mockResolvedValue(dbUser);
  
  return { clerkUser, dbUser };
}

/**
 * 미인증 상태 설정
 */
export function setupUnauthenticated(): void {
  mockCurrentUser.mockResolvedValue(null);
}

/**
 * 헬스장 검색 결과 설정
 */
export function setupGymSearchResults(results: MockGym[]): void {
  mockGymSearchService.searchGymsNearby.mockResolvedValue(results);
}

/**
 * 코스 생성 결과 설정
 */
export function setupMergeResult(result: MockMergeResult): void {
  mockMergeBodyParts.mockResolvedValue(result);
}
