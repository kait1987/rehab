/**
 * @file landing.spec.ts
 * @description 미인증 상태 랜딩 페이지 테스트
 */

import { test, expect } from "@playwright/test";

test.describe("Landing Page (Unauthenticated)", () => {
  // 첫 로딩이 느릴 수 있으므로 타임아웃 증가 (매우 넉넉하게)
  test.setTimeout(120000);

  // 인증 상태 초기화 (Unauthenticated 보장)
  test.use({ storageState: { cookies: [], origins: [] } });

  test("홈 페이지 로드 및 기본 요소 확인", async ({ page }) => {
    await page.goto("/", { timeout: 60000 });

    // 페이지 로드 대기
    await page.waitForLoadState("domcontentloaded");

    // 타이틀 확인
    await expect(page).toHaveTitle(/REHAB|재활/i);

    // 헤더 텍스트 확인 (h1 태그)
    await expect(page.locator("h1")).toContainText("REHAB");
    await expect(
      page.getByText("개인 맞춤형 재활 운동 추천 시스템"),
    ).toBeVisible();

    // 로그인/시작하기 버튼 확인 (또는 이미 로그인된 경우 '제활 코스 만들기' 버튼)
    const startBtn = page.getByRole("button", { name: /시작하기/i });
    const rehabBtn = page.getByRole("button", {
      name: /내 몸 상태로 재활 코스 만들기/i,
    });
    await expect(startBtn.or(rehabBtn)).toBeVisible({ timeout: 60000 });
  });
});
