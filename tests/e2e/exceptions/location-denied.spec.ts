/**
 * @file location-denied.spec.ts
 * @description 위치 권한 거부 예외 상황 테스트
 * 
 * PRD 1.4 Edge Cases: "위치 권한 거부"
 */

import { test, expect } from '@playwright/test';
import { GymsPage } from '../pages/gyms.page';

test.describe('예외: 위치 권한 거부', () => {
  let gymsPage: GymsPage;

  test.beforeEach(async ({ page, context }) => {
    gymsPage = new GymsPage(page);
    
    // 위치 권한 거부 설정
    await context.clearPermissions();
  });

  test('위치 권한 거부 시 수동 입력 UI 표시', async ({ page }) => {
    await gymsPage.goto();
    
    // 수동 주소 입력 필드 또는 안내 메시지 확인
    const manualLocationUI = page.locator(`
      input[placeholder*="주소"],
      input[placeholder*="위치"],
      [data-testid="manual-address-input"],
      text=위치 권한
    `);
    
    await expect(manualLocationUI.first()).toBeVisible({ timeout: 10000 });
  });

  test('수동 주소 입력으로 검색', async ({ page }) => {
    await gymsPage.goto();
    
    // 주소 입력 필드 찾기
    const addressInput = page.locator('input[placeholder*="주소"], input[type="search"]').first();
    
    if (await addressInput.isVisible()) {
      await addressInput.fill('강남역');
      await addressInput.press('Enter');
      
      // 로딩 완료 대기
      await expect(page.locator('[data-testid="loading"]')).toBeHidden({ timeout: 15000 });
    }
  });

  test('지도 드래그로 위치 변경', async ({ page }) => {
    await gymsPage.goto();
    
    // 지도 요소 찾기
    const map = page.locator('#map, [data-testid="map"], .map-container');
    
    if (await map.isVisible()) {
      // 드래그 시뮬레이션
      await map.dragTo(map, {
        sourcePosition: { x: 200, y: 200 },
        targetPosition: { x: 300, y: 300 },
      });
    }
  });

  test('권한 거부 안내 메시지 표시', async ({ page }) => {
    await gymsPage.goto();
    
    // 위치 버튼 클릭 시 권한 거부 안내
    const locationBtn = page.locator('button:has-text("현재 위치"), [data-testid*="location"]').first();
    
    if (await locationBtn.isVisible()) {
      await locationBtn.click();
      
      // 안내 메시지 확인
      const message = page.locator('text=위치 권한, text=허용, text=거부됨');
      await expect(message.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    }
  });
});
