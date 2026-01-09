const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const exerciseCount = await prisma.exerciseTemplate.count();
  console.log('exercise_templates count:', exerciseCount);
  
  if (exerciseCount === 0) {
    console.log('❌ exercise_templates 테이블이 비어있습니다!');
    console.log('코스 생성을 위해 운동 템플릿 데이터가 필요합니다.');
  } else {
    const samples = await prisma.exerciseTemplate.findMany({ take: 3 });
    console.log('샘플 데이터:', samples.map(e => e.name));
  }
}

main()
  .finally(() => prisma.$disconnect());
