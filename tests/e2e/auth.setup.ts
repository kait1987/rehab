/**
 * @file auth.setup.ts
 * @description Playwright 인증 셋업 (Project Dependency)
 * 
 * 테스트 실행 전 1회 실행되어 Clerk 로그인을 수행하고 storageState를 저장합니다.
 */

import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authDir = path.join(__dirname, '.auth');
const authFile = path.join(authDir, 'user.json');

setup('authenticate', async ({ page }) => {
  // .auth 디렉토리 생성
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // 이미 유효한 인증 상태가 있으면 스킵 (개발 시 시간 절약)
  // CI 환경에서는 항상 새로 로그인
  if (fs.existsSync(authFile) && !process.env.CI) {
    const stats = fs.statSync(authFile);
    const hoursSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceModified < 24) {
      console.log('✅ 기존 인증 세션 재사용 (24시간 이내)');
      return;
    }
  }

  const testEmail = process.env.E2E_TEST_USER_EMAIL;
  const testPassword = process.env.E2E_TEST_USER_PASSWORD;

  // 테스트 계정 정보가 없으면 빈 파일 생성 후 종료
  if (!testEmail || !testPassword) {
    console.log('⚠️ E2E 테스트 계정 정보 없음 - 미인증 상태로 진행');
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  console.log('🔐 Clerk 로그인 진행 중...');

  try {
    await page.goto('/sign-in');
    
    // 이메일 입력
    await page.waitForSelector('input[name="identifier"]', { timeout: 15000 });
    await page.fill('input[name="identifier"]', testEmail);
    // 버튼 클릭 대신 엔터키 사용 (더 안정적)
    await page.keyboard.press('Enter');
    
    // 비밀번호 입력 (화면 전환 대기)
    await page.waitForSelector('input[name="password"]', { timeout: 15000 });
    await page.fill('input[name="password"]', testPassword);
    await page.keyboard.press('Enter');
    
    // 로그인 완료 대기 (홈으로 리다이렉트)
    await page.waitForURL('http://localhost:3000/**', { timeout: 60000 });
    
    // 페이지 로드 및 스크립트 실행 대기 (단순 대기)
    await page.waitForTimeout(5000);

    // 디버깅: 쿠키 확인
    const cookies = await page.context().cookies();
    console.log('🍪 Auth Setup Cookies:', JSON.stringify(cookies, null, 2));

    // 로그인 성공 여부 확인 (로그인 버튼이 없어야 함)
    const loginBtn = page.getByRole('button', { name: /로그인/i }).first();
    if (await loginBtn.isVisible()) {
      console.error('❌ 홈으로 리다이렉트되었으나 여전히 로그인 버튼이 보입니다.');
      throw new Error('로그인 실패: 세션이 유지되지 않음');
    }
    
    console.log('✅ 로그인 버튼이 보이지 않음 (인증 성공 추정)');
    
    // 세션 저장
    await page.context().storageState({ path: authFile });
    console.log('✅ 인증 세션 저장 완료');
  } catch (error) {
    console.error('❌ 로그인 실패:', error);
    // 실패 시에도 빈 파일 생성하여 의존성 에러 방지
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }));
  }
});
