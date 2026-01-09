const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const seedTags = [
  { name: '조용함', category: 'positive', displayOrder: 1 },
  { name: '재활 친화', category: 'positive', displayOrder: 2 },
  { name: '장비 깨끗함', category: 'positive', displayOrder: 3 },
  { name: '분위기 좋음', category: 'positive', displayOrder: 4 },
  { name: '접근성 좋음', category: 'positive', displayOrder: 5 },
  { name: '복잡함', category: 'negative', displayOrder: 6 },
  { name: '시끄러움', category: 'negative', displayOrder: 7 },
  { name: '장비 부족', category: 'negative', displayOrder: 8 },
  { name: '주차 어려움', category: 'negative', displayOrder: 9 },
  { name: '가격 부담', category: 'negative', displayOrder: 10 },
];

async function main() {
  console.log('=== Phase 2: Seed Data Insertion ===\n');

  let insertedCount = 0;
  let skippedCount = 0;

  for (const tag of seedTags) {
    try {
      await prisma.reviewTag.upsert({
        where: { name: tag.name },
        update: {},
        create: {
          name: tag.name,
          category: tag.category,
          displayOrder: tag.displayOrder,
          isActive: true,
        },
      });
      insertedCount++;
      console.log(`✅ 삽입됨: ${tag.name} (${tag.category})`);
    } catch (e) {
      skippedCount++;
      console.log(`⏭️ 스킵됨: ${tag.name} - ${e.message}`);
    }
  }

  console.log(`\n📊 결과: ${insertedCount}개 삽입, ${skippedCount}개 스킵`);

  // Verify
  const totalCount = await prisma.reviewTag.count();
  console.log(`\n✅ 현재 review_tags 총 개수: ${totalCount}개`);

  const tags = await prisma.reviewTag.findMany({
    orderBy: { displayOrder: 'asc' },
    select: { name: true, category: true, displayOrder: true }
  });
  console.log('\n📋 전체 태그 목록:');
  tags.forEach(t => console.log(`  ${t.displayOrder}. [${t.category}] ${t.name}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
