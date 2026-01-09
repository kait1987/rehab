const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding master data...');

  // 1. body_parts 삽입 (운동 템플릿에서 사용하는 모든 부위)
  const bodyParts = [
    { name: '허리', displayOrder: 1, isActive: true },
    { name: '어깨', displayOrder: 2, isActive: true },
    { name: '무릎', displayOrder: 3, isActive: true },
    { name: '목', displayOrder: 4, isActive: true },
    { name: '손목', displayOrder: 5, isActive: true },
    { name: '발목', displayOrder: 6, isActive: true },
    { name: '팔꿈치', displayOrder: 7, isActive: true },
    { name: '골반', displayOrder: 8, isActive: true },
    { name: '등', displayOrder: 9, isActive: true },
    { name: '가슴', displayOrder: 10, isActive: true },
    { name: '팔', displayOrder: 11, isActive: true },
    { name: '다리', displayOrder: 12, isActive: true },
  ];

  for (const part of bodyParts) {
    await prisma.bodyPart.upsert({
      where: { name: part.name },
      update: { displayOrder: part.displayOrder, isActive: part.isActive },
      create: part,
    });
  }
  console.log('✅ body_parts: 8개 삽입 완료');

  // 2. equipment_types 삽입
  const equipmentTypes = [
    { name: '없음', displayOrder: 1, isActive: true },
    { name: '매트', displayOrder: 2, isActive: true },
    { name: '덤벨', displayOrder: 3, isActive: true },
    { name: '밴드', displayOrder: 4, isActive: true },
    { name: '짐볼', displayOrder: 5, isActive: true },
    { name: '폼롤러', displayOrder: 6, isActive: true },
  ];

  for (const equip of equipmentTypes) {
    await prisma.equipmentType.upsert({
      where: { name: equip.name },
      update: { displayOrder: equip.displayOrder, isActive: equip.isActive },
      create: equip,
    });
  }
  console.log('✅ equipment_types: 6개 삽입 완료');

  console.log('🎉 Seed 완료!');
}

main()
  .catch((e) => {
    console.error('❌ Seed 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
