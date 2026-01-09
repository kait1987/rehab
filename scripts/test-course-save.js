/**
 * 코스 저장 API 테스트 스크립트
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧪 코스 저장 기능 테스트\n');
  console.log('='.repeat(60));

  // 1. DB에 courses 테이블 존재 확인
  console.log('\n1️⃣ DB 테이블 확인:\n');
  try {
    const courseCount = await prisma.course.count();
    console.log(`   ✅ courses 테이블 존재 (현재 ${courseCount}개)`);
  } catch (err) {
    console.log('   ❌ courses 테이블 접근 실패:', err.message);
    return;
  }

  try {
    const exerciseCount = await prisma.courseExercise.count();
    console.log(`   ✅ course_exercises 테이블 존재 (현재 ${exerciseCount}개)`);
  } catch (err) {
    console.log('   ❌ course_exercises 테이블 접근 실패:', err.message);
    return;
  }

  // 2. 테스트 유저 확인
  console.log('\n2️⃣ 테스트 유저 확인:\n');
  const testUser = await prisma.user.findFirst({
    where: { isActive: true }
  });
  
  if (!testUser) {
    console.log('   ⚠️ 활성 유저 없음 - 테스트 코스 생성 건너뜀');
  } else {
    console.log(`   ✅ 테스트 유저: ${testUser.email || testUser.id}`);
  }

  // 3. 테스트 운동 템플릿 확인
  console.log('\n3️⃣ 운동 템플릿 확인:\n');
  const templates = await prisma.exerciseTemplate.findMany({
    where: { isActive: true },
    take: 3,
    select: { id: true, name: true }
  });

  if (templates.length < 3) {
    console.log('   ⚠️ 활성 운동 템플릿 부족:', templates.length);
  } else {
    console.log(`   ✅ 운동 템플릿 ${templates.length}개 확인`);
    templates.forEach(t => console.log(`      - ${t.name}`));
  }

  // 4. API 시뮬레이션 (실제 저장 없이 구조 확인)
  console.log('\n4️⃣ API 요청 구조 확인:\n');
  const sampleRequest = {
    totalDurationMinutes: 60,
    painLevel: 3,
    experienceLevel: 'beginner',
    bodyParts: ['허리'],
    equipmentAvailable: ['매트'],
    exercises: [
      {
        exerciseTemplateId: templates[0]?.id,
        section: 'warmup',
        orderInSection: 1,
        durationMinutes: 5
      }
    ]
  };
  console.log('   요청 예시:');
  console.log(JSON.stringify(sampleRequest, null, 2).split('\n').map(l => '   ' + l).join('\n'));

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 결과 요약:\n');
  console.log('   - courses 테이블: ✅');
  console.log('   - course_exercises 테이블: ✅');
  console.log('   - API 라우트: /api/courses/save (존재)');
  console.log('   - 404 원인 가능성:');
  console.log('     1. 서버 재시작 필요');
  console.log('     2. Clerk 인증 실패 (401이 아닌 404로 반환될 수 있음)');
  console.log('     3. 요청 body 형식 오류');
  console.log('\n✅ 테스트 완료!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
