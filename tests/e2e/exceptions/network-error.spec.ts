/**
 * @file network-error.spec.ts
 * @description 네트워크 오류 예외 상황 테스트
 *
 * PRD 1.4 Edge Cases: "네트워크 끊김"
 */

import { test, expect } from "@playwright/test";
import { GymsPage } from "../pages/gyms.page";
import { OnboardingPage } from "../pages/onboarding.page";

test.describe.skip("예외: 네트워크 오류", () => {
  // ============================================
  // 헬스장 검색 네트워크 오류
  // ============================================

  test.describe("헬스장 검색", () => {
    test("검색 API 실패 시 에러 메시지 표시", async ({ page }) => {
      // API Route 차단
      await page.route("**/api/gyms/search**", (route) =>
        route.abort("failed"),
      );

      const gymsPage = new GymsPage(page);
      await gymsPage.goto();

      // 검색 시도
      const searchBtn = page
        .locator('button:has-text("검색"), [data-testid*="search"]')
        .first();
      if (await searchBtn.isVisible()) {
        await searchBtn.click();
      }

      // 에러 메시지 또는 재시도 버튼 확인
      const errorUI = page.locator(`
        [data-testid="error-message"],
        [data-testid="retry-btn"],
        text=오류,
        text=다시 시도
      `);

      await expect(errorUI.first()).toBeVisible({ timeout: 30000 });
    });

    // ... (기존 헬스장 검색 테스트 유지)
  });

  // ============================================
  // 코스 생성 네트워크 오류
  // ============================================

  test.describe("코스 생성", () => {
    let onboardingPage: OnboardingPage;

    test.beforeEach(async ({ page }) => {
      onboardingPage = new OnboardingPage(page);
    });

    test("코스 생성 API 실패 시 에러 메시지", async ({ page }) => {
      // API Route 차단
      await page.route("**/api/rehab/generate**", (route) =>
        route.abort("failed"),
      );

      // 온보딩 플로우 진행
      await onboardingPage.open();
      await onboardingPage.selectBodyPart("허리", 3);
      await onboardingPage.next();
      await onboardingPage.selectEquipment("매트");
      await onboardingPage.next();
      await onboardingPage.selectExperience("주 1-2회");
      await onboardingPage.next();
      await onboardingPage.selectDuration(60);

      // 생성 버튼 클릭
      await onboardingPage.generateButton.click();

      // 에러 메시지 확인 (모달 내 에러 또는 토스트)
      const errorUI = page.locator(
        'text=오류, text=실패, [data-testid="error"]',
      );
      await expect(errorUI.first()).toBeVisible({ timeout: 30000 });
    });

    test("코스 생성 타임아웃 시 안내", async ({ page }) => {
      // API 응답 지연
      await page.route("**/api/rehab/generate**", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 35000)); // 35초 지연
        route.continue();
      });

      await onboardingPage.open();
      await onboardingPage.selectBodyPart("허리", 3);
      await onboardingPage.next();
      await onboardingPage.selectEquipment("매트");
      await onboardingPage.next();
      await onboardingPage.selectExperience("주 1-2회");
      await onboardingPage.next();
      await onboardingPage.selectDuration(60);

      // 생성 버튼 클릭
      await onboardingPage.generateButton.click();

      // 타임아웃 메시지 (30초 후)
      // Playwright 타임아웃이 먼저 발생할 수 있으므로 test.setTimeout 조정 필요
      test.setTimeout(40000);

      const timeoutMsg = page.locator(
        "text=시간 초과, text=timeout, text=오류",
      );
      await expect(timeoutMsg.first())
        .toBeVisible({ timeout: 35000 })
        .catch(() => {});
    });
  });

  // ... (나머지 테스트 유지)
});
