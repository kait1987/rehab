/**
 * 전체 시스템 종합 검증 스크립트
 * 
 * 오늘 개발한 모든 항목 검증:
 * 1. 부위별 운동 개수
 * 2. 섹션별 운동 분포 (warmup/main/cooldown)
 * 3. 기구별 운동 개수
 * 4. 맨몸 운동 개수
 * 5. isActive 상태
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 전체 시스템 종합 검증\n');
  console.log('='.repeat(70));

  let issues = [];
  let passed = 0;
  let failed = 0;

  // 1. 부위별 운동 개수 검증
  console.log('\n📋 1. 부위별 활성 운동 개수:\n');
  const bodyParts = await prisma.bodyPart.findMany({ orderBy: { displayOrder: 'asc' } });
  
  for (const bp of bodyParts) {
    const count = await prisma.exerciseTemplate.count({
      where: { bodyPartId: bp.id, isActive: true }
    });
    const status = count >= 5 ? '✅' : '⚠️';
    console.log(`   ${status} ${bp.name}: ${count}개`);
    
    if (count < 5) {
      issues.push(`${bp.name}: 운동 ${count}개 (권장 5개 이상)`);
      failed++;
    } else {
      passed++;
    }
  }

  // 2. 섹션별 운동 분포 검증
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 2. 섹션별 운동 분포 (intensity 기준):\n');
  
  for (const bp of bodyParts) {
    const warmup = await prisma.exerciseTemplate.count({
      where: { bodyPartId: bp.id, isActive: true, intensityLevel: { in: [1, 2] } }
    });
    const main = await prisma.exerciseTemplate.count({
      where: { bodyPartId: bp.id, isActive: true, intensityLevel: { gte: 3 } }
    });
    
    const statusWarmup = warmup >= 2 ? '✅' : '⚠️';
    const statusMain = main >= 1 ? '✅' : '⚠️';
    
    console.log(`   ${bp.name}: warmup=${warmup} ${statusWarmup}, main=${main} ${statusMain}`);
    
    if (warmup < 2) {
      issues.push(`${bp.name}: warmup 운동 부족 (${warmup}개)`);
      failed++;
    } else {
      passed++;
    }
    
    if (main < 1) {
      issues.push(`${bp.name}: main 운동 없음`);
      failed++;
    } else {
      passed++;
    }
  }

  // 3. 기구별 운동 개수
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 3. 기구별 활성 운동 개수:\n');
  
  const equipmentTypes = await prisma.equipmentType.findMany();
  for (const eq of equipmentTypes) {
    const count = await prisma.exerciseEquipmentMapping.count({
      where: {
        equipmentTypeId: eq.id,
        exerciseTemplate: { isActive: true }
      }
    });
    const status = count >= 5 ? '✅' : '⚠️';
    console.log(`   ${status} ${eq.name}: ${count}개`);
    
    if (count < 5) {
      issues.push(`기구 "${eq.name}": 운동 ${count}개 (권장 5개 이상)`);
    }
  }

  // 4. 부위별 맨몸 운동 개수
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 4. 부위별 맨몸("없음") 운동 개수:\n');
  
  for (const bp of bodyParts) {
    const noEquipCount = await prisma.bodyPartExerciseMapping.count({
      where: {
        bodyPartId: bp.id,
        isActive: true,
        exerciseTemplate: {
          isActive: true,
          exerciseEquipmentMappings: {
            some: { equipmentType: { name: '없음' } }
          }
        }
      }
    });
    
    const status = noEquipCount >= 2 ? '✅' : '⚠️';
    console.log(`   ${status} ${bp.name}: ${noEquipCount}개`);
    
    if (noEquipCount < 2) {
      issues.push(`${bp.name}: 맨몸 운동 부족 (${noEquipCount}개)`);
      failed++;
    } else {
      passed++;
    }
  }

  // 5. 비활성 상태 운동 확인
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 5. 비활성화된 운동:\n');
  
  const inactiveExercises = await prisma.exerciseTemplate.findMany({
    where: { isActive: false },
    include: { bodyPart: true }
  });
  
  if (inactiveExercises.length === 0) {
    console.log('   (비활성화된 운동 없음)');
  } else {
    console.log(`   총 ${inactiveExercises.length}개 비활성화됨:`);
    inactiveExercises.forEach(ex => {
      console.log(`   - ${ex.name} (${ex.bodyPart?.name || 'unknown'})`);
    });
  }

  // 6. API 엔드포인트 존재 확인 (파일 확인은 불가능하므로 DB 확인만)
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 6. 데이터베이스 연결 상태:\n');
  
  const courseCount = await prisma.course.count();
  const courseExerciseCount = await prisma.courseExercise.count();
  console.log(`   ✅ courses 테이블: ${courseCount}개`);
  console.log(`   ✅ course_exercises 테이블: ${courseExerciseCount}개`);

  // 7. 전체 통계
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 전체 통계:\n');
  
  const totalExercises = await prisma.exerciseTemplate.count({ where: { isActive: true } });
  const totalMappings = await prisma.exerciseEquipmentMapping.count();
  const totalBodyPartMappings = await prisma.bodyPartExerciseMapping.count({ where: { isActive: true } });
  
  console.log(`   - 활성 운동 템플릿: ${totalExercises}개`);
  console.log(`   - 운동-기구 매핑: ${totalMappings}개`);
  console.log(`   - 운동-부위 매핑: ${totalBodyPartMappings}개`);
  console.log(`   - 부위 수: ${bodyParts.length}개`);
  console.log(`   - 기구 종류: ${equipmentTypes.length}개`);

  // 결과 요약
  console.log('\n' + '='.repeat(70));
  console.log('\n🎯 검증 결과:\n');
  
  if (issues.length === 0) {
    console.log('   ✅ 모든 검증 통과!');
  } else {
    console.log(`   ⚠️ 발견된 이슈 (${issues.length}개):`);
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  }
  
  console.log(`\n   통과: ${passed}개`);
  console.log(`   경고: ${failed}개`);
  console.log('\n✅ 검증 완료!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
