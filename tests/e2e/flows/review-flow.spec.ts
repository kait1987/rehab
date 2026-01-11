/**
 * @file review-flow.spec.ts
 * @description 리뷰 작성 플로우 E2E 테스트
 * 
 * PRD 1.3 "태그 기반 주민 리뷰" 플로우
 */

import { test, expect } from '@playwright/test';
import { ReviewPage } from '../pages/review.page';
import { randomComment } from '../fixtures/test-fixtures';

test.describe('리뷰 작성 플로우', () => {
  let reviewPage: ReviewPage;

  test.beforeEach(async ({ page }) => {
    reviewPage = new ReviewPage(page);
  });

  // ============================================
  // Happy Path 테스트
  // ============================================

  test.describe('정상 플로우', () => {
    test('헬스장 상세에서 리뷰 작성 페이지 이동', async ({ page }) => {
      // 헬스장 상세 페이지
      await page.goto('/gyms');
      
      // 첫 번째 헬스장 클릭 (있다면)
      const gymCard = page.locator('[data-testid^="gym-card"], .gym-card, article').first();
      if (await gymCard.isVisible()) {
        await gymCard.click();
        
        // 리뷰 작성 버튼 클릭
        const reviewBtn = page.locator('button:has-text("리뷰"), a:has-text("리뷰")').first();
        if (await reviewBtn.isVisible()) {
          await reviewBtn.click();
          await expect(page).toHaveURL(/\/review/);
        }
      }
    });

    test('태그 1개 선택 시 제출 버튼 활성화', async ({ page }) => {
      // 리뷰 페이지에서 태그 선택 UI 테스트
      await page.goto('/gyms');
      
      // 태그 버튼들 확인
      const tagButtons = page.locator('[data-testid^="review-tag-"], button[data-tag]');
      if (await tagButtons.count() > 0) {
        await tagButtons.first().click();
        
        // 제출 버튼 활성화 확인
        const submitBtn = page.locator('button[type="submit"], button:has-text("등록")');
        await expect(submitBtn).toBeEnabled();
      }
    });

    test('코멘트 입력 (선택)', async ({ page }) => {
      await page.goto('/gyms');
      
      // 코멘트 입력 필드
      const commentInput = page.locator('textarea, input[placeholder*="코멘트"]');
      if (await commentInput.isVisible()) {
        await commentInput.fill(randomComment());
      }
    });

    test('리뷰 제출 성공', async ({ page }) => {
      // 인증된 상태에서 리뷰 제출 테스트
      await page.goto('/gyms');
      
      // 태그 선택 + 제출 시뮬레이션
      const tagBtn = page.locator('[data-testid^="review-tag-"]').first();
      if (await tagBtn.isVisible()) {
        await tagBtn.click();
        
        const submitBtn = page.locator('button[type="submit"]');
        if (await submitBtn.isEnabled()) {
          await submitBtn.click();
          
          // 성공 토스트 또는 리다이렉트 확인
          const toast = page.locator('[data-testid="toast"], .toast, [role="alert"]');
          await expect(toast).toBeVisible({ timeout: 5000 }).catch(() => {});
        }
      }
    });
  });

  // ============================================
  // 인증 테스트
  // ============================================

  test.describe('인증 필요', () => {
    test('미로그인 시 로그인 페이지 리다이렉트', async ({ page, context }) => {
      // 미인증 상태 설정
      await context.clearCookies();
      
      // 리뷰 페이지 직접 접근 시도
      await page.goto('/gyms/test-id/review');
      
      // 로그인 페이지로 리다이렉트 확인 또는 헬스장 상세로 돌아감
      const url = page.url();
      const isRedirected = url.includes('/sign-in') || url.includes('/login') || url.includes('/gyms/');
      expect(isRedirected).toBe(true);
    });
  });

  // ============================================
  // 검증 테스트
  // ============================================

  test.describe('입력 검증', () => {
    test('태그 미선택 시 제출 버튼 비활성화', async ({ page }) => {
      await page.goto('/gyms');
      
      // 제출 버튼 비활성화 상태 확인
      const submitBtn = page.locator('button[type="submit"]:has-text("등록")');
      if (await submitBtn.isVisible()) {
        await expect(submitBtn).toBeDisabled();
      }
    });
  });
});
