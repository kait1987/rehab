const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== 헬스장 데이터 진단 ===\n');

  const gymCount = await prisma.gym.count();
  console.log('📊 gyms 테이블:', gymCount, '개');

  if (gymCount === 0) {
    console.log('❌ 헬스장 데이터가 없습니다!');
    console.log('지도에 표시할 헬스장이 없어서 "검색 결과가 없습니다"가 나옵니다.');
  } else {
    const samples = await prisma.gym.findMany({
      take: 3,
      select: { name: true, address: true, latitude: true, longitude: true }
    });
    console.log('\n📍 샘플 헬스장:');
    samples.forEach(g => {
      console.log(`  - ${g.name} (${g.latitude}, ${g.longitude})`);
    });
  }

  // 환경변수 확인 (일부만)
  console.log('\n🔑 환경변수 확인:');
  console.log('  - NAVER_CLIENT_ID:', process.env.NAVER_CLIENT_ID ? '✅ 설정됨' : '❌ 없음');
  console.log('  - NEXT_PUBLIC_NAVER_CLIENT_ID:', process.env.NEXT_PUBLIC_NAVER_CLIENT_ID ? '✅ 설정됨' : '❌ 없음');
  console.log('  - NEXT_PUBLIC_KAKAO_MAP_KEY:', process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ? '✅ 설정됨' : '❌ 없음');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
