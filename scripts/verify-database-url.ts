/**
 * @file verify-database-url.ts
 * @description DATABASE_URL 환경 변수 확인 스크립트
 * 
 * 이 스크립트는 실제로 로드된 DATABASE_URL 환경 변수 값을 확인합니다.
 * Prisma Client 생성 전에 실행하여 환경 변수가 올바르게 설정되었는지 확인할 수 있습니다.
 */

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

console.log('\n[DATABASE_URL 환경 변수 확인]\n');

if (!databaseUrl) {
  console.error('❌ DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  console.error('프로젝트 루트의 .env 파일에 DATABASE_URL을 설정해주세요.\n');
  process.exit(1);
}

console.log('✅ DATABASE_URL 환경 변수 존재');
console.log(`   길이: ${databaseUrl.length} 문자`);

// 비밀번호 마스킹
const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':***@');
console.log(`   값: ${maskedUrl}`);

// 연결 정보 확인
const checks = {
  'postgresql:// 또는 postgres://로 시작': databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://'),
  '호스트(@) 포함': databaseUrl.includes('@'),
  '포트 6543 (풀러) 포함': databaseUrl.includes(':6543'),
  '포트 5432 (직접) 포함': databaseUrl.includes(':5432'),
  'pgbouncer=true 파라미터': databaseUrl.includes('pgbouncer=true'),
  'sslmode=require 파라미터': databaseUrl.includes('sslmode=require'),
};

console.log('\n[연결 정보 확인]');
for (const [check, result] of Object.entries(checks)) {
  console.log(`   ${result ? '✅' : '❌'} ${check}`);
}

// URL 파싱 시도
try {
  const url = new URL(databaseUrl);
  console.log('\n[파싱된 연결 정보]');
  console.log(`   프로토콜: ${url.protocol.replace(':', '')}`);
  console.log(`   사용자명: ${url.username || '(없음)'}`);
  console.log(`   호스트: ${url.hostname}`);
  console.log(`   포트: ${url.port || '(기본값)'}`);
  console.log(`   데이터베이스: ${url.pathname.replace('/', '') || '(없음)'}`);
  console.log(`   쿼리 파라미터: ${url.search || '(없음)'}`);
} catch (error) {
  console.error('\n❌ URL 파싱 실패:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}

// DIRECT_URL 확인 (선택사항)
if (directUrl) {
  console.log('\n[DIRECT_URL 환경 변수]');
  console.log('   ℹ️ DIRECT_URL은 Prisma CLI용입니다 (선택사항)');
  const maskedDirectUrl = directUrl.replace(/:([^:@]+)@/, ':***@');
  console.log(`   값: ${maskedDirectUrl}`);
}

console.log('\n✅ 환경 변수 확인 완료\n');

