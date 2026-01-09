const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== Phase 1: Database Verification ===\n');

  // 1. Check review_tags count
  try {
    const tagCount = await prisma.reviewTag.count();
    console.log(`✅ review_tags 테이블 존재 - ${tagCount}개 레코드`);
    
    const tags = await prisma.reviewTag.findMany({
      orderBy: { displayOrder: 'asc' },
      select: { id: true, name: true, category: true, displayOrder: true }
    });
    console.log('\n📋 review_tags 데이터:');
    tags.forEach(tag => {
      console.log(`  - [${tag.category}] ${tag.name} (order: ${tag.displayOrder})`);
    });
  } catch (e) {
    console.log('❌ review_tags 테이블 접근 실패:', e.message);
  }

  // 2. Check reviews table
  try {
    const reviewCount = await prisma.review.count();
    console.log(`\n✅ reviews 테이블 존재 - ${reviewCount}개 레코드`);
  } catch (e) {
    console.log('\n❌ reviews 테이블 접근 실패:', e.message);
  }

  // 3. Check review_tag_mappings table
  try {
    const mappingCount = await prisma.reviewTagMapping.count();
    console.log(`✅ review_tag_mappings 테이블 존재 - ${mappingCount}개 레코드`);
  } catch (e) {
    console.log('❌ review_tag_mappings 테이블 접근 실패:', e.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
