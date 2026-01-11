/**
 * @file onboarding.page.ts
 * @description 온보딩(통증 체크) 모달 Page Object Model
 */

import { Page, Locator, expect } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;
  
  // 진입점
  readonly startButton: Locator;
  
  // 모달 요소
  readonly modalContent: Locator;
  readonly nextButton: Locator;
  readonly prevButton: Locator;
  readonly generateButton: Locator;
  
  // Step 1: 부위 선택
  readonly bodyPartButtons: Locator;
  
  // Step 2: 장비 선택
  readonly equipmentButtons: Locator;
  
  // Step 3: 운동 경험
  readonly experienceButtons: Locator;
  
  // Step 4: 시간 선택
  readonly durationButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // 진입점 (홈 페이지의 버튼)
    this.startButton = page.getByRole('button', { name: /내 몸 상태로 재활 코스 만들기/i });
    
    // 모달 공통
    this.modalContent = page.locator('[role="dialog"]');
    this.nextButton = page.getByRole('button', { name: /다음/i });
    this.prevButton = page.getByRole('button', { name: /이전/i });
    this.generateButton = page.getByRole('button', { name: /코스 생성하기/i });
    
    // Step 1: 부위 선택
    // BodyPartSelector 내부의 버튼들
    this.bodyPartButtons = this.modalContent.locator('button');
    
    // Step 2: 장비 선택
    this.equipmentButtons = this.modalContent.locator('button');
    
    // Step 3: 운동 경험
    this.experienceButtons = this.modalContent.locator('button');
    
    // Step 4: 시간 선택
    this.durationButtons = this.modalContent.locator('button');
  }

  /**
   * 온보딩 모달 열기
   */
  async open() {
    await this.page.goto('/');
    
    // 페이지 로드 대기
    await this.page.waitForLoadState('domcontentloaded');

    // 로그인 상태 확인 (디버깅용)
    // Clerk 로딩 대기: 로그인 버튼이나 재활 코스 버튼 중 하나가 나올 때까지 대기
    try {
      await expect(
        this.page.getByRole('button', { name: /로그인|재활 코스|내 몸 상태로/i }).first()
      ).toBeVisible({ timeout: 15000 });
    } catch (e) {
      console.log('⚠️ 버튼을 찾을 수 없습니다. 페이지 소스를 확인합니다.');
      // 디버깅을 위해 스크린샷이나 소스를 찍을 수 있음
    }

    const loginBtn = this.page.getByRole('button', { name: /로그인/i }).first();
    if (await loginBtn.isVisible()) {
      throw new Error('❌ 테스트가 미인증 상태입니다. storageState가 제대로 로드되지 않았거나 로그인이 풀렸습니다.');
    }

    // 시작 버튼 클릭
    const heroBtn = this.page.getByRole('button', { name: /내 몸 상태로 재활 코스 만들기/i });
    const navbarBtn = this.page.getByRole('button', { name: /재활 코스/i }).first();

    if (await heroBtn.isVisible()) {
      await heroBtn.click();
    } else if (await navbarBtn.isVisible()) {
      console.log('⚠️ Hero 버튼을 찾을 수 없어 Navbar 버튼을 사용합니다.');
      await navbarBtn.click();
    } else {
      // 디버깅: 현재 페이지의 모든 버튼 텍스트 출력
      const buttons = await this.page.getByRole('button').all();
      console.log('🔍 현재 페이지의 버튼 목록:');
      for (const btn of buttons) {
        if (await btn.isVisible()) {
          console.log(`- "${await btn.innerText()}"`);
        }
      }
      throw new Error('❌ 온보딩 시작 버튼을 찾을 수 없습니다. (로그인 상태 확인 필요)');
    }

    await expect(this.modalContent).toBeVisible();
  }

  /**
   * Step 1: 부위 및 통증 레벨 선택
   */
  async selectBodyPart(name: string, painLevel: number = 3) {
    // 부위 선택
    const bodyPartBtn = this.modalContent.locator(`button:has-text("${name}")`).first();
    await bodyPartBtn.click();
    
    // 통증 레벨 선택 (부위 선택 후 나타나는 버튼)
    // 부위 버튼의 부모/형제 요소 내에서 통증 레벨 버튼 찾기
    // BodyPartSelector 구조상 부위 버튼 아래에 통증 레벨 버튼들이 렌더링됨
    const painLevelBtn = this.modalContent.locator(`button[aria-label="통증 정도 ${painLevel}"]`).last();
    await painLevelBtn.click();
  }

  /**
   * Step 2: 장비 선택
   */
  async selectEquipment(name: string) {
    const equipmentBtn = this.modalContent.locator(`button:has-text("${name}")`).first();
    await equipmentBtn.click();
  }

  /**
   * Step 3: 운동 경험 선택
   */
  async selectExperience(level: '거의 안 함' | '주 1-2회' | '주 3회 이상') {
    const experienceBtn = this.modalContent.locator(`button:has-text("${level}")`).first();
    await experienceBtn.click();
  }

  /**
   * Step 4: 시간 선택
   */
  async selectDuration(minutes: 60 | 90 | 120) {
    const durationBtn = this.modalContent.locator(`button:has-text("${minutes}분")`).first();
    await durationBtn.click();
  }

  /**
   * 다음 단계로 이동
   */
  async next() {
    await this.nextButton.click();
  }

  /**
   * 코스 생성 (마지막 단계)
   */
  async generate() {
    await this.generateButton.click();
    // 로딩 대기 (모달이 닫히거나 URL이 변경될 때까지)
    await expect(this.modalContent).toBeHidden({ timeout: 30000 });
    await expect(this.page).toHaveURL(/\/rehab/);
  }

  /**
   * 전체 플로우 실행
   */
  async completeOnboarding(options: {
    bodyPart: string;
    painLevel?: number;
    equipment: string;
    experience: '거의 안 함' | '주 1-2회' | '주 3회 이상';
    duration: 60 | 90 | 120;
  }) {
    await this.open();
    
    // Step 1
    await this.selectBodyPart(options.bodyPart, options.painLevel);
    await this.next();
    
    // Step 2
    await this.selectEquipment(options.equipment);
    await this.next();
    
    // Step 3
    await this.selectExperience(options.experience);
    await this.next();
    
    // Step 4
    await this.selectDuration(options.duration);
    await this.generate();
  }
}
