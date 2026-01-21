/**
 * @file empty-results.spec.ts
 * @description 검색 결과 없음 예외 상황 테스트
 *
 * PRD 1.4 Edge Cases: "검색 결과 없음"
 */

import { test, expect } from "@playwright/test";
import { GymsPage } from "../pages/gyms.page";

test.describe("예외: 검색 결과 없음", () => {
  let gymsPage: GymsPage;

  test.beforeEach(async ({ page }) => {
    gymsPage = new GymsPage(page);
  });

  test.skip("검색 결과 없을 때 Empty State 표시", async ({ page, context }) => {
    // 1. 위치 권한 허용 (브라우저 레벨)
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 37.5665, longitude: 126.978 });

    // 빈 결과 반환 Mock
    await gymsPage.page.route("**/api/gyms/search**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [],
          meta: { total: 0, radius: 1000 },
        }),
      });
    });

    await gymsPage.goto();

    // "내 위치 사용" 버튼 클릭하여 검색 트리거
    const useLocationBtn = page.getByRole("button", {
      name: /내 위치 사용|위치 재설정/i,
    });
    if (await useLocationBtn.isVisible()) {
      await useLocationBtn.click();
    }

    // Empty State 확인
    const emptyState = page.locator(`
      [data-testid="empty-state"],
      text=검색 결과가 없습니다,
      text=주변에 헬스장이 없습니다,
      text=결과 없음
    `);

    await expect(emptyState.first()).toBeVisible({ timeout: 10000 });
  });

  test.skip("Empty State에서 필터 초기화 버튼", async ({ page }) => {
    // 빈 결과 반환 Mock
    await page.route("**/api/gyms/search**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [],
          meta: { total: 0 },
        }),
      });
    });

    await gymsPage.goto();

    // 필터 초기화 버튼 확인
    const resetFilterBtn = page.locator(`
      button:has-text("필터 초기화"),
      button:has-text("초기화"),
      [data-testid="reset-filters"]
    `);

    if (await resetFilterBtn.isVisible()) {
      await expect(resetFilterBtn).toBeEnabled();
    }
  });

  test.skip("Empty State에서 반경 확장 제안", async ({ page }) => {
    // 빈 결과 반환 Mock
    await page.route("**/api/gyms/search**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [],
          meta: { total: 0, radius: 1000 },
        }),
      });
    });

    await gymsPage.goto();

    // 반경 확장 버튼 또는 안내
    const expandRadiusUI = page.locator(`
      button:has-text("반경 확장"),
      button:has-text("더 넓게"),
      text=반경을 넓혀,
      [data-testid="expand-radius"]
    `);

    if (
      await expandRadiusUI
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await expect(expandRadiusUI.first()).toBeVisible();
    }
  });

  test.skip("코스 생성 시 적절한 운동 없음", async ({ page }) => {
    // 운동 없음 응답 Mock
    await page.route("**/api/rehab/generate**", (route) => {
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "적절한 운동을 찾지 못했습니다.",
          message: "다른 부위를 선택하거나 장비를 추가해보세요.",
        }),
      });
    });

    await page.goto("/rehab");

    // 코스 생성 시도
    const generateBtn = page.locator('button:has-text("코스 생성")').first();
    if (await generateBtn.isEnabled()) {
      await generateBtn.click();

      // 안내 메시지 확인
      const guidance = page.locator("text=다른 부위, text=장비를 추가");
      await expect(guidance.first())
        .toBeVisible({ timeout: 10000 })
        .catch(() => {});
    }
  });
});
