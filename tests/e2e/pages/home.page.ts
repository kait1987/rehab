/**
 * @file home.page.ts
 * @description 홈 페이지 Page Object Model
 */

import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  
  // 네비게이션 요소
  readonly rehabCourseButton: Locator;
  readonly findGymButton: Locator;
  readonly myCourseButton: Locator;
  
  // 콘텐츠 요소
  readonly recentCourseSection: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // 메인 네비게이션 버튼
    this.rehabCourseButton = page.getByRole('link', { name: /재활 코스|코스 만들기/i });
    this.findGymButton = page.getByRole('link', { name: /헬스장 찾기|주변 헬스장/i });
    this.myCourseButton = page.getByRole('link', { name: /내 코스|저장된 코스/i });
    
    // 콘텐츠
    this.recentCourseSection = page.locator('[data-testid="recent-courses"]');
    this.loginButton = page.getByRole('link', { name: /로그인|Sign In/i });
  }

  /**
   * 홈 페이지로 이동
   */
  async goto() {
    await this.page.goto('/');
  }

  /**
   * 재활 코스 만들기 페이지로 이동
   */
  async goToRehabCourse() {
    await this.rehabCourseButton.click();
    await expect(this.page).toHaveURL(/\/rehab/);
  }

  /**
   * 헬스장 찾기 페이지로 이동
   */
  async goToFindGym() {
    await this.findGymButton.click();
    await expect(this.page).toHaveURL(/\/gyms/);
  }

  /**
   * 내 코스 페이지로 이동
   */
  async goToMyCourses() {
    await this.myCourseButton.click();
    await expect(this.page).toHaveURL(/\/my\/courses/);
  }

  /**
   * 로그인 페이지로 이동
   */
  async goToLogin() {
    await this.loginButton.click();
    await expect(this.page).toHaveURL(/\/sign-in/);
  }

  /**
   * 최근 코스 섹션이 표시되는지 확인
   */
  async expectRecentCoursesVisible() {
    await expect(this.recentCourseSection).toBeVisible();
  }
}
