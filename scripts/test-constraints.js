const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== Phase 4: Constraint Verification ===\n');

  // Get a tag for testing
  const tag = await prisma.reviewTag.findFirst();
  if (!tag) {
    console.log('❌ 테스트할 태그가 없습니다. Phase 2를 먼저 실행하세요.');
    return;
  }
  console.log(`📌 테스트 태그: ${tag.name} (${tag.id})\n`);

  // Get or create a test gym
  let gym = await prisma.gym.findFirst();
  if (!gym) {
    console.log('⚠️ 헬스장이 없어서 테스트용 생성');
    gym = await prisma.gym.create({
      data: {
        name: '테스트 헬스장',
        address: '서울시 테스트구 테스트동',
        latitude: 37.5665,
        longitude: 126.9780,
      },
    });
  }
  console.log(`📌 테스트 헬스장: ${gym.name} (${gym.id})\n`);

  // Test 1: Create a test review
  console.log('--- Test 1: 리뷰 생성 테스트 ---');
  const review = await prisma.review.create({
    data: {
      gymId: gym.id,
      comment: 'Phase 4 테스트 리뷰',
      isAdminReview: true,
    },
  });
  console.log(`✅ 리뷰 생성됨: ${review.id}`);

  // Test 2: Create tag mapping
  console.log('\n--- Test 2: 태그 매핑 테스트 ---');
  const mapping = await prisma.reviewTagMapping.create({
    data: {
      reviewId: review.id,
      reviewTagId: tag.id,
    },
  });
  console.log(`✅ 태그 매핑 생성됨: ${mapping.id}`);

  // Test 3: UNIQUE constraint (should fail)
  console.log('\n--- Test 3: UNIQUE 제약조건 테스트 ---');
  try {
    await prisma.reviewTagMapping.create({
      data: {
        reviewId: review.id,
        reviewTagId: tag.id, // Same combination - should fail
      },
    });
    console.log('❌ UNIQUE 제약조건 실패 (중복 허용됨)');
  } catch (e) {
    if (e.code === 'P2002') {
      console.log('✅ UNIQUE 제약조건 작동 - 중복 매핑 차단됨');
    } else {
      console.log(`⚠️ 예상치 못한 에러: ${e.message}`);
    }
  }

  // Test 4: CASCADE delete
  console.log('\n--- Test 4: CASCADE 삭제 테스트 ---');
  const mappingCountBefore = await prisma.reviewTagMapping.count({
    where: { reviewId: review.id },
  });
  console.log(`삭제 전 매핑 수: ${mappingCountBefore}`);

  await prisma.review.delete({
    where: { id: review.id },
  });
  console.log(`✅ 리뷰 삭제됨: ${review.id}`);

  const mappingCountAfter = await prisma.reviewTagMapping.count({
    where: { reviewId: review.id },
  });
  console.log(`삭제 후 매핑 수: ${mappingCountAfter}`);

  if (mappingCountAfter === 0) {
    console.log('✅ CASCADE 작동 - 매핑도 자동 삭제됨');
  } else {
    console.log('❌ CASCADE 실패 - 매핑이 남아있음');
  }

  console.log('\n=== Phase 4 완료 ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
