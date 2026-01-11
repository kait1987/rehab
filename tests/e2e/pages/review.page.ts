/**
 * @file review.page.ts
 * @description 리뷰 작성 페이지 Page Object Model
 */

import { Page, Locator, expect } from '@playwright/test';
import { TEST_IDS } from '../fixtures/test-fixtures';

export class ReviewPage {
  readonly page: Page;

  // 태그 선택
  readonly tagButtons: Locator;
  
  // 코멘트 입력
  readonly commentInput: Locator;
  
  // 제출 버튼
  readonly submitButton: Locator;
  
  // 상태
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // 태그 선택
    this.tagButtons = page.locator('[data-testid^="review-tag-"]');
    
    // 코멘트 입력
    this.commentInput = page.locator(`[data-testid="${TEST_IDS.review.commentInput}"]`);
    
    // 제출 버튼
    this.submitButton = page.locator(`[data-testid="${TEST_IDS.review.submitBtn}"]`);
    
    // 상태
    this.loadingSpinner = page.locator(`[data-testid="${TEST_IDS.common.loading}"]`);
    this.errorMessage = page.locator(`[data-testid="${TEST_IDS.common.error}"]`);
    this.successToast = page.locator(`[data-testid="${TEST_IDS.common.toast}"]`);
  }

  /**
   * 리뷰 작성 페이지로 이동
   */
  async goto(gymId: string) {
    await this.page.goto(`/gyms/${gymId}/review`);
  }

  /**
   * 태그 선택
   */
  async selectTag(tagName: string) {
    const tag = this.page.locator(`[data-testid="${TEST_IDS.review.tag(tagName)}"]`);
    await tag.click();
    await expect(tag).toHaveClass(/selected|active|checked/i);
  }

  /**
   * 여러 태그 선택
   */
  async selectTags(tagNames: string[]) {
    for (const tagName of tagNames) {
      await this.selectTag(tagName);
    }
  }

  /**
   * 코멘트 입력
   */
  async fillComment(comment: string) {
    await this.commentInput.fill(comment);
  }

  /**
   * 리뷰 제출
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * 리뷰 작성 전체 플로우
   */
  async writeReview(options: {
    tags: string[];
    comment?: string;
  }) {
    await this.selectTags(options.tags);
    if (options.comment) {
      await this.fillComment(options.comment);
    }
    await this.submit();
  }

  /**
   * 제출 성공 확인
   */
  async expectSuccess() {
    await expect(this.successToast).toContainText(/등록|저장|성공/);
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

  /**
   * 제출 버튼 비활성화 확인 (태그 미선택 시)
   */
  async expectSubmitDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }

  /**
   * 제출 버튼 활성화 확인
   */
  async expectSubmitEnabled() {
    await expect(this.submitButton).toBeEnabled();
  }

  /**
   * 선택된 태그 수 확인
   */
  async getSelectedTagCount(): Promise<number> {
    return await this.tagButtons.filter({ hasClass: /selected|active|checked/ }).count();
  }
}
