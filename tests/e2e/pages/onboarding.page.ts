/**
 * @file onboarding.page.ts
 * @description 온보딩(통증 체크) 모달 Page Object Model
 */

import { Page, Locator, expect } from "@playwright/test";

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
    this.startButton = page.getByRole("button", { name: /재활 코스 만들기/i });

    // 모달 공통
    this.modalContent = page.locator('[role="dialog"]');
    this.nextButton = page.getByRole("button", { name: /다음/i });
    this.prevButton = page.getByRole("button", { name: /이전/i });
    this.generateButton = page.getByRole("button", { name: /코스 생성하기/i });

    // Step 1: 부위 선택
    // BodyPartSelector 내부의 버튼들
    this.bodyPartButtons = this.modalContent.locator("button");

    // Step 2: 장비 선택
    this.equipmentButtons = this.modalContent.locator("button");

    // Step 3: 운동 경험
    this.experienceButtons = this.modalContent.locator("button");

    // Step 4: 시간 선택
    this.durationButtons = this.modalContent.locator("button");
  }

  /**
   * 온보딩 모달 열기
   */
  async open() {
    await this.page.goto("/", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    // 페이지 로드 대기
    await this.page.waitForLoadState("domcontentloaded");

    // 시작 버튼 클릭
    // 시작 버튼 클릭 (PainCheckModal 트리거)
    const heroBtn = this.page.locator('[data-testid="home-start-rehab"]');

    // Clerk 로딩 대기 및 버튼 표시 대기
    await expect(heroBtn).toBeVisible({ timeout: 60000 });
    await heroBtn.click();

    await expect(this.modalContent).toBeVisible({ timeout: 60000 });
  }

  /**
   * Step 1: 부위 및 통증 레벨 선택
   */
  async selectBodyPart(name: string, painLevel: number = 3) {
    // 데이터 로딩 에러 확인
    const errorMsg = this.modalContent.getByText(/오류가 발생했습니다/);
    if (await errorMsg.isVisible()) {
      throw new Error(`❌ 데이터 로딩 실패: ${await errorMsg.innerText()}`);
    }

    // 부위 선택
    const bodyPartBtn = this.modalContent
      .getByRole("button", { name: name, exact: true })
      .first();
    await expect(bodyPartBtn).toBeVisible({ timeout: 60000 });
    await bodyPartBtn.click();

    // 통증 레벨 선택 (부위 선택 후 나타나는 버튼)
    const painLevelBtn = this.modalContent
      .locator(`button[aria-label="통증 정도 ${painLevel}"]`)
      .last();
    await expect(painLevelBtn).toBeVisible({ timeout: 60000 });
    await painLevelBtn.click();
  }

  /**
   * Step 2: 장비 선택
   */
  async selectEquipment(name: string) {
    const equipmentBtn = this.modalContent
      .getByRole("button", { name: name })
      .first();
    await expect(equipmentBtn).toBeVisible({ timeout: 60000 });
    await equipmentBtn.click();
  }

  /**
   * Step 3: 운동 경험 선택
   */
  async selectExperience(level: "거의 안 함" | "주 1-2회" | "주 3회 이상") {
    const experienceBtn = this.modalContent
      .getByRole("button", { name: level })
      .first();
    await expect(experienceBtn).toBeVisible({ timeout: 60000 });
    await experienceBtn.click();
  }

  /**
   * Step 4: 시간 선택
   */
  async selectDuration(minutes: 60 | 90 | 120) {
    const durationBtn = this.modalContent
      .getByRole("button", { name: `${minutes}분` })
      .first();
    await expect(durationBtn).toBeVisible({ timeout: 60000 });
    await durationBtn.click();
  }

  /**
   * 다음 단계로 이동
   */
  async next() {
    await this.nextButton.click();
    await this.page.waitForTimeout(500); // UI 전환 안정화 대기
  }

  /**
   * 코스 생성 (마지막 단계)
   */
  async generate() {
    await this.generateButton.click();
    // 로딩 대기 (모달이 닫히거나 URL이 변경될 때까지)
    await expect(this.modalContent).toBeHidden({ timeout: 120000 });
    await expect(this.page).toHaveURL(/\/rehab/, { timeout: 120000 });
  }

  /**
   * 전체 플로우 실행
   */
  async completeOnboarding(options: {
    bodyPart: string;
    painLevel?: number;
    equipment: string;
    experience: "거의 안 함" | "주 1-2회" | "주 3회 이상";
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
