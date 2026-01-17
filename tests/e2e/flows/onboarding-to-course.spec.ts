/**
 * @file onboarding-to-course.spec.ts
 * @description F1: 온보딩 → 코스 생성 플로우 E2E 테스트
 *
 * PRD 1.3 "내 몸 상태 기반 재활 코스 생성" 플로우
 */

import { test, expect } from "@playwright/test";
import { OnboardingPage } from "../pages/onboarding.page";
import { RehabPage } from "../pages/rehab.page";

test.describe("F1: 온보딩 → 코스 생성", () => {
  let onboardingPage: OnboardingPage;
  let rehabPage: RehabPage;

  test.beforeEach(async ({ page }) => {
    onboardingPage = new OnboardingPage(page);
    rehabPage = new RehabPage(page);
  });

  // ============================================
  // Happy Path 테스트
  // ============================================

  test("홈에서 온보딩 모달 열기", async ({ page }) => {
    // 디버깅: 쿠키 확인
    const cookies = await page.context().cookies();
    console.log("🍪 Loaded Cookies:", JSON.stringify(cookies, null, 2));

    await onboardingPage.open();
    await expect(page.getByText("오늘의 통증 체크")).toBeVisible();
  });

  test("Step 1: 부위 및 통증 레벨 선택", async ({ page }) => {
    await onboardingPage.open();

    // 허리 선택 및 통증 3
    await onboardingPage.selectBodyPart("허리", 3);

    // 다음 버튼 활성화 확인
    await expect(onboardingPage.nextButton).toBeEnabled();
    await onboardingPage.next();

    // Step 2 진입 확인
    await expect(page.getByText("사용 가능한 기구").first()).toBeVisible();
  });

  test("Step 2: 장비 선택 (매트)", async ({ page }) => {
    await onboardingPage.open();
    await onboardingPage.selectBodyPart("허리", 3);
    await onboardingPage.next();

    // 매트 선택
    await onboardingPage.selectEquipment("매트");
    await onboardingPage.next();

    // Step 3 진입 확인
    await expect(page.getByText("평소 운동 빈도").first()).toBeVisible();
  });

  test("Step 3: 운동 경험 선택", async ({ page }) => {
    await onboardingPage.open();
    await onboardingPage.selectBodyPart("허리", 3);
    await onboardingPage.next();
    await onboardingPage.selectEquipment("매트");
    await onboardingPage.next();

    // 주 1-2회 선택
    await onboardingPage.selectExperience("주 1-2회");
    await onboardingPage.next();

    // Step 4 진입 확인
    await expect(page.getByText("원하시는 운동 시간").first()).toBeVisible();
  });

  test("Step 4: 운동 시간 선택 및 생성", async ({ page }) => {
    await onboardingPage.open();
    await onboardingPage.selectBodyPart("허리", 3);
    await expect(onboardingPage.nextButton).toBeEnabled();
    await onboardingPage.next();
    await onboardingPage.selectEquipment("매트");
    await expect(onboardingPage.nextButton).toBeEnabled();
    await onboardingPage.next();
    await onboardingPage.selectExperience("주 1-2회");
    await expect(onboardingPage.nextButton).toBeEnabled();
    await onboardingPage.next();

    // 60분 선택
    await onboardingPage.selectDuration(60);

    // 생성 버튼 클릭
    await onboardingPage.generate();

    // 결과 페이지 확인
    await rehabPage.expectCourseResultVisible();
  });

  test("전체 플로우: 코스 생성 성공", async ({ page }) => {
    await onboardingPage.completeOnboarding({
      bodyPart: "허리",
      painLevel: 3,
      equipment: "매트",
      experience: "주 1-2회",
      duration: 60,
    });

    // 결과 확인
    await rehabPage.expectCourseResultVisible();
  });

  // ============================================
  // 다중 부위 선택 테스트
  // ============================================

  test("여러 부위 선택 (허리 + 어깨)", async ({ page }) => {
    await onboardingPage.open();

    // 허리 선택
    await onboardingPage.selectBodyPart("허리", 3);

    // 어깨 추가 선택
    await onboardingPage.selectBodyPart("어깨", 2);

    // 다음 단계로 진행 가능 확인
    await onboardingPage.next();
    await expect(page.getByText("사용 가능한 기구")).toBeVisible();
  });

  // ============================================
  // 시간별 코스 테스트
  // ============================================

  test("90분 코스 생성", async ({ page }) => {
    await onboardingPage.completeOnboarding({
      bodyPart: "허리",
      painLevel: 3,
      equipment: "매트",
      experience: "주 1-2회",
      duration: 90,
    });

    await rehabPage.expectCourseResultVisible();
    await expect(page.getByText("총 90분")).toBeVisible();
  });

  test("120분 코스 생성", async ({ page }) => {
    await onboardingPage.completeOnboarding({
      bodyPart: "허리",
      painLevel: 3,
      equipment: "매트",
      experience: "주 1-2회",
      duration: 120,
    });

    await rehabPage.expectCourseResultVisible();
    await expect(page.getByText("총 120분")).toBeVisible();
  });
});
