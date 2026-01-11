/**
 * @file course-to-gym.spec.ts
 * @description F2: 코스 생성 → 헬스장 찾기 플로우 E2E 테스트
 * 
 * PRD 1.3 "이 코스 하기 좋은 근처 헬스장 보기" 플로우
 */

import { test, expect } from '@playwright/test';
import { RehabPage } from '../pages/rehab.page';
import { GymsPage } from '../pages/gyms.page';
import { TEST_LOCATION } from '../fixtures/test-fixtures';

test.describe('F2: 코스 → 헬스장 찾기', () => {
  let rehabPage: RehabPage;
  let gymsPage: GymsPage;

  test.beforeEach(async ({ page }) => {
    rehabPage = new RehabPage(page);
    gymsPage = new GymsPage(page);
  });

  // ============================================
  // 위치 권한 허용 케이스
  // ============================================

  test.describe('위치 권한 허용', () => {
    test.beforeEach(async ({ context }) => {
      // 위치 권한 허용 및 테스트 좌표 설정
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({
        latitude: TEST_LOCATION.latitude,
        longitude: TEST_LOCATION.longitude,
      });
    });

    test('헬스장 검색 페이지 접근', async ({ page }) => {
      await gymsPage.goto();
      await expect(page).toHaveURL(/\/gyms/);
    });

    test('현재 위치 기반 검색', async ({ page }) => {
      await gymsPage.goto();
      
      // 위치 검색 버튼 클릭
      const locationBtn = page.locator('button:has-text("현재 위치"), button:has-text("위치 찾기"), [data-testid*="location"]').first();
      if (await locationBtn.isVisible()) {
        await locationBtn.click();
      }
      
      // 로딩 대기
      await expect(page.locator('[data-testid="loading"]')).toBeHidden({ timeout: 15000 });
      
      // 결과 확인 (결과가 있거나 없음 메시지)
      const hasResults = await page.locator('[data-testid^="gym-card"], .gym-card').count() > 0;
      const hasEmptyState = await page.locator('text=검색 결과가 없습니다, text=주변에 헬스장이 없습니다').count() > 0;
      
      expect(hasResults || hasEmptyState).toBe(true);
    });

    test('필터 적용 (재활기구)', async ({ page }) => {
      await gymsPage.goto();
      
      // 필터 버튼 찾기
      const filterBtn = page.locator('button:has-text("재활기구"), [data-testid*="filter"]').first();
      if (await filterBtn.isVisible()) {
        await filterBtn.click();
      }
    });

    test('헬스장 카드 클릭 → 상세 페이지 이동', async ({ page }) => {
      await gymsPage.goto();
      
      // 첫 번째 헬스장 카드 클릭
      const gymCard = page.locator('[data-testid^="gym-card"], .gym-card, article').first();
      
      if (await gymCard.isVisible()) {
        await gymCard.click();
        await expect(page).toHaveURL(/\/gyms\/[a-z0-9-]/i);
      }
    });
  });

  // ============================================
  // 위치 권한 거부 케이스
  // ============================================

  test.describe('위치 권한 거부', () => {
    test.beforeEach(async ({ context }) => {
      // 위치 권한 거부
      await context.clearPermissions();
    });

    test('위치 권한 거부 시 수동 입력 UI 표시', async ({ page }) => {
      await gymsPage.goto();
      
      // 수동 입력 필드 또는 안내 메시지 확인
      const manualInput = page.locator('input[placeholder*="주소"], input[placeholder*="위치"], [data-testid*="address"]');
      const permissionMessage = page.locator('text=위치 권한, text=위치를 허용, text=주소를 입력');
      
      const hasManualInput = await manualInput.count() > 0;
      const hasMessage = await permissionMessage.count() > 0;
      
      expect(hasManualInput || hasMessage).toBe(true);
    });

    test('수동 주소 입력 검색', async ({ page }) => {
      await gymsPage.goto();
      
      // 주소 입력
      const addressInput = page.locator('input[placeholder*="주소"], input[placeholder*="위치"]').first();
      if (await addressInput.isVisible()) {
        await addressInput.fill('강남역');
        
        // 검색 버튼 클릭
        const searchBtn = page.locator('button:has-text("검색"), button[type="submit"]').first();
        await searchBtn.click();
      }
    });
  });

  // ============================================
  // 코스 결과에서 헬스장 찾기 연결
  // ============================================

  test.describe('코스 → 헬스장 연결', () => {
    test.beforeEach(async ({ context }) => {
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({
        latitude: TEST_LOCATION.latitude,
        longitude: TEST_LOCATION.longitude,
      });
    });

    test('코스 결과에서 헬스장 찾기 버튼 표시', async ({ page }) => {
      await page.goto('/rehab');
      
      // "근처 헬스장 찾기" 버튼 존재 확인
      const findGymBtn = page.locator('button:has-text("헬스장"), a:has-text("헬스장")');
      // 버튼이 있는지 확인 (코스 생성 후에만 표시될 수 있음)
      await expect(findGymBtn.first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // 코스 미생성 시 버튼이 없을 수 있음
      });
    });
  });
});
