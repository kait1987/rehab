/**
 * @file gyms.page.ts
 * @description 헬스장 검색 페이지 Page Object Model
 */

import { Page, Locator, expect } from '@playwright/test';
import { TEST_IDS, TEST_LOCATION } from '../fixtures/test-fixtures';

export class GymsPage {
  readonly page: Page;

  // 검색
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly locationButton: Locator;
  readonly manualAddressInput: Locator;
  
  // 필터
  readonly filterButtons: Locator;
  
  // 결과
  readonly gymCards: Locator;
  readonly loadMoreButton: Locator;
  
  // 상태
  readonly loadingSpinner: Locator;
  readonly emptyState: Locator;
  readonly errorMessage: Locator;
  readonly retryButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // 검색
    this.searchInput = page.locator(`[data-testid="${TEST_IDS.gym.searchInput}"]`);
    this.searchButton = page.locator(`[data-testid="${TEST_IDS.gym.searchBtn}"]`);
    this.locationButton = page.locator(`[data-testid="${TEST_IDS.gym.locationBtn}"]`);
    this.manualAddressInput = page.locator(`[data-testid="${TEST_IDS.gym.manualAddressInput}"]`);
    
    // 필터
    this.filterButtons = page.locator('[data-testid^="gym-filter-"]');
    
    // 결과
    this.gymCards = page.locator('[data-testid^="gym-card-"]');
    this.loadMoreButton = page.getByRole('button', { name: /더 보기|Load More/i });
    
    // 상태
    this.loadingSpinner = page.locator(`[data-testid="${TEST_IDS.common.loading}"]`);
    this.emptyState = page.locator(`[data-testid="${TEST_IDS.common.emptyState}"]`);
    this.errorMessage = page.locator(`[data-testid="${TEST_IDS.common.error}"]`);
    this.retryButton = page.locator(`[data-testid="${TEST_IDS.common.retryBtn}"]`);
  }

  /**
   * 헬스장 검색 페이지로 이동
   */
  async goto() {
    await this.page.goto('/gyms', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  }

  /**
   * 위치 권한 허용 설정 (테스트 context에서)
   */
  async grantLocationPermission(context: any) {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({
      latitude: TEST_LOCATION.latitude,
      longitude: TEST_LOCATION.longitude,
    });
  }

  /**
   * 위치 권한 거부 설정 (테스트 context에서)
   */
  async denyLocationPermission(context: any) {
    await context.clearPermissions();
  }

  /**
   * 현재 위치로 검색
   */
  async searchByCurrentLocation() {
    await this.locationButton.click();
    await this.waitForResults();
  }

  /**
   * 주소로 검색
   */
  async searchByAddress(address: string) {
    await this.manualAddressInput.fill(address);
    await this.searchButton.click();
    await this.waitForResults();
  }

  /**
   * 필터 적용
   */
  async applyFilter(filterName: string) {
    const filter = this.page.locator(`[data-testid="${TEST_IDS.gym.filter(filterName)}"]`);
    await filter.click();
    await this.waitForResults();
  }

  /**
   * 필터 해제
   */
  async clearFilter(filterName: string) {
    const filter = this.page.locator(`[data-testid="${TEST_IDS.gym.filter(filterName)}"]`);
    const isActive = await filter.getAttribute('data-active');
    if (isActive === 'true') {
      await filter.click();
      await this.waitForResults();
    }
  }

  /**
   * 헬스장 카드 클릭
   */
  async clickGymCard(index: number = 0) {
    const card = this.gymCards.nth(index);
    await card.click();
    await expect(this.page).toHaveURL(/\/gyms\/[a-z0-9-]+/i);
  }

  /**
   * 더 보기 클릭
   */
  async loadMore() {
    const initialCount = await this.gymCards.count();
    await this.loadMoreButton.click();
    await expect(this.gymCards).toHaveCount(initialCount + 1, { timeout: 10000 });
  }

  /**
   * 결과 로딩 대기
   */
  async waitForResults() {
    await expect(this.loadingSpinner).toBeHidden({ timeout: 15000 });
  }

  /**
   * 결과가 있는지 확인
   */
  async expectResultsVisible() {
    await expect(this.gymCards.first()).toBeVisible();
  }

  /**
   * 결과가 없는지 확인 (Empty State)
   */
  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * 에러 상태 확인
   */
  async expectError() {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.retryButton).toBeVisible();
  }

  /**
   * 재시도 버튼 클릭
   */
  async retry() {
    await this.retryButton.click();
    await this.waitForResults();
  }

  /**
   * 수동 위치 입력 UI 표시 확인
   */
  async expectManualLocationInputVisible() {
    await expect(this.manualAddressInput).toBeVisible();
  }
}
