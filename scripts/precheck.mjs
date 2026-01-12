/**
 * @file precheck.mjs
 * @description 검증 실행 전 환경 변수 및 필수 조건 체크
 * 
 * 체크 항목:
 * - Naver Map API 키 존재 여부
 * - Supabase 연결 정보 존재 여부
 * - Clerk 키 존재 여부
 */

const requiredEnvVars = [
  { key: 'NEXT_PUBLIC_NAVER_MAP_CLIENT_ID', description: 'Naver Map Client ID' },
  { key: 'NAVER_CLIENT_SECRET', description: 'Naver Map Client Secret' },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', description: 'Supabase URL' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase Anon Key' },
  { key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', description: 'Clerk Publishable Key' },
];

let hasError = false;

console.log('🔍 Pre-check: 환경 변수 검증 중...\n');

for (const { key, description } of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`❌ ${description} (${key}) - 설정되지 않음`);
    hasError = true;
  } else {
    console.log(`✅ ${description} (${key}) - OK`);
  }
}

console.log('');

if (hasError) {
  console.error('⚠️  필수 환경 변수가 누락되었습니다. .env.local 파일을 확인하세요.');
  process.exit(1);
} else {
  console.log('✅ 모든 환경 변수 검증 완료!\n');
  process.exit(0);
}
