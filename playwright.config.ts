import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// .env.local 파일 로드
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

/**
 * Playwright E2E 테스트 설정
 *
 * 주요 설정:
 * 1. webServer: Next.js 개발 서버 자동 시작
 * 2. storageState: 로그인 세션 재사용
 * 3. trace/screenshot/video: 실패 시 디버깅 지원
 */

export default defineConfig({
  // 테스트 디렉토리
  testDir: "./tests/e2e",

  // 테스트 파일 패턴
  testMatch: "**/*.spec.ts",

  // 전체 테스트 타임아웃 (각 테스트당 120초)
  timeout: 120_000,

  // expect 타임아웃
  expect: {
    timeout: 30_000,
  },

  // 병렬 실행 (CI에서는 1개 워커)
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,

  // 실패 시 재시도 (로컬에서도 1회 재시도)
  retries: process.env.CI ? 2 : 1,

  // 리포터 설정
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  // 전역 설정
  use: {
    // 베이스 URL
    baseURL: "http://localhost:3000",

    // 트레이스: 첫 재시도 시에만
    trace: "on-first-retry",

    // 스크린샷: 실패 시에만
    screenshot: "only-on-failure",

    // 비디오: 첫 재시도 시에만
    video: "on-first-retry",

    // 뷰포트
    viewport: { width: 1280, height: 720 },

    // 액션 타임아웃
    actionTimeout: 15_000,

    // 네비게이션 타임아웃
    navigationTimeout: 60_000,
  },

  // 프로젝트 설정 (브라우저별)
  projects: [
    // Global Setup: 인증 세션 생성
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    // Desktop Chrome (기본 테스트)
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // 인증된 세션 사용 (절대 경로로 변경)
        storageState: path.resolve(__dirname, "tests/e2e/.auth/user.json"),
      },
      dependencies: ["setup"],
    },

    // 인증 없이 실행하는 테스트용
    {
      name: "chromium-unauthenticated",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: "**/unauthenticated/**/*.spec.ts",
    },

    // Mobile iPhone 13 (반응형 테스트)
    {
      name: "mobile-iphone",
      use: {
        ...devices["iPhone 13"],
        storageState: path.resolve(__dirname, "tests/e2e/.auth/user.json"),
      },
      dependencies: ["setup"],
      testMatch: "**/flows/**/*.spec.ts", // 핵심 플로우만
    },

    // Mobile Pixel 5 (Android 반응형 테스트)
    {
      name: "mobile-pixel",
      use: {
        ...devices["Pixel 5"],
        storageState: path.resolve(__dirname, "tests/e2e/.auth/user.json"),
      },
      dependencies: ["setup"],
      testMatch: "**/flows/**/*.spec.ts", // 핵심 플로우만
    },
  ],

  // 웹서버 설정 (Next.js)
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // 서버 시작 대기 2분
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      NEXT_PUBLIC_E2E_BYPASS_AUTH: "true",
    },
  },

  // 출력 디렉토리
  outputDir: "./tests/e2e/results",
});
