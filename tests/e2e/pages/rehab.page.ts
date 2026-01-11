/**
 * @file rehab.page.ts
 * @description 재활 코스 결과 페이지 Page Object Model
 */

import { Page, Locator, expect } from '@playwright/test';
import { TEST_IDS } from '../fixtures/test-fixtures';

export class RehabPage {
  readonly page: Page;

  // 결과 표시
  readonly courseResult: Locator;
  readonly warmupSection: Locator;
  readonly mainSection: Locator;
  readonly cooldownSection: Locator;
  
  // 탭
  readonly warmupTab: Locator;
  readonly mainTab: Locator;
  readonly cooldownTab: Locator;
  
  // 액션 버튼
  readonly saveButton: Locator;
  readonly findGymButton: Locator;
  
  // 상태 표시
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // 결과 섹션 (탭 컨텐츠)
    this.courseResult = page.locator('main');
    this.warmupSection = page.locator('[role="tabpanel"][data-state="active"]'); // 현재 활성 탭
    
    // 탭 트리거
    this.warmupTab = page.getByRole('tab', { name: /준비/i });
    this.mainTab = page.getByRole('tab', { name: /메인/i });
    this.cooldownTab = page.getByRole('tab', { name: /마무리/i });
    
    // 액션 버튼
    this.saveButton = page.getByRole('button', { name: /코스 저장하기/i });
    this.findGymButton = page.getByRole('button', { name: /근처 헬스장 보기/i });
    
    // 상태 표시
    this.loadingSpinner = page.locator('.animate-spin');
    this.errorMessage = page.locator('.text-destructive');
    this.successToast = page.locator('.text-green-500');
  }

  /**
   * 재활 코스 페이지로 이동 (직접 이동 시 데이터 없음 에러 발생 가능)
   */
  async goto() {
    await this.page.goto('/rehab');
  }

  /**
   * 코스 저장
   */
  async saveCourse() {
    await this.saveButton.click();
    // 저장 완료 메시지 확인
    await expect(this.successToast).toBeVisible();
  }

  /**
   * 근처 헬스장 찾기
   */
  async findNearbyGyms() {
    await this.findGymButton.click();
    await expect(this.page).toHaveURL(/\/gyms/);
  }

  /**
   * 코스 결과가 표시되는지 확인
   */
  async expectCourseResultVisible() {
    // 헤더 확인
    await expect(this.page.getByText('내 몸에 맞는 재활 코스')).toBeVisible();
    
    // 탭 확인
    await expect(this.warmupTab).toBeVisible();
    await expect(this.mainTab).toBeVisible();
    await expect(this.cooldownTab).toBeVisible();
  }

  /**
   * 특정 섹션으로 탭 전환
   */
  async switchTab(tab: 'warmup' | 'main' | 'cooldown') {
    if (tab === 'warmup') await this.warmupTab.click();
    if (tab === 'main') await this.mainTab.click();
    if (tab === 'cooldown') await this.cooldownTab.click();
  }

  /**
   * 에러 메시지 확인
   */
  async expectError(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }
}
