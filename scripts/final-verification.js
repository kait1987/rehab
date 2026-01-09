/**
 * 최종 종합 검증 스크립트
 * 
 * 검증 항목:
 * 1. 데이터 무결성 (intensity, 기구매핑, 부위매핑)
 * 2. 부위별 운동 충분성
 * 3. 코스 생성 시나리오
 * 4. API 필수 데이터
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const results = { pass: [], fail: [], warn: [], fix: [] };

async function main() {
  console.log('🔍 최종 종합 검증 시작\n');
  console.log('='.repeat(70));

  // ===== 1. 데이터 무결성 =====
  console.log('\n📋 1. 데이터 무결성 검증\n');

  // 1.1 intensity 없는 활성 운동
  const noIntensity = await prisma.exerciseTemplate.findMany({
    where: { isActive: true, intensityLevel: null }
  });
  if (noIntensity.length > 0) {
    console.log(`❌ intensity 없는 활성 운동: ${noIntensity.length}개`);
    noIntensity.forEach(e => console.log(`   - ${e.name}`));
    results.fail.push({ item: 'intensity 없는 운동', count: noIntensity.length });
    
    // 자동 수정: intensity 2로 설정
    for (const ex of noIntensity) {
      await prisma.exerciseTemplate.update({
        where: { id: ex.id },
        data: { intensityLevel: 2 }
      });
      console.log(`   → [${ex.name}] intensity 2로 설정`);
      results.fix.push(`${ex.name}: intensity 2로 설정`);
    }
  } else {
    console.log('✅ 모든 활성 운동에 intensity 존재');
    results.pass.push('intensity 완전성');
  }

  // 1.2 기구 매핑 없는 활성 운동
  const noEquipment = await prisma.exerciseTemplate.findMany({
    where: { isActive: true, exerciseEquipmentMappings: { none: {} } }
  });
  if (noEquipment.length > 0) {
    console.log(`❌ 기구 매핑 없는 활성 운동: ${noEquipment.length}개`);
    noEquipment.forEach(e => console.log(`   - ${e.name}`));
    results.fail.push({ item: '기구 매핑 없는 운동', count: noEquipment.length });
    
    // 자동 수정: "없음" 기구 매핑 추가
    const noEquipType = await prisma.equipmentType.findFirst({ where: { name: '없음' } });
    if (noEquipType) {
      for (const ex of noEquipment) {
        await prisma.exerciseEquipmentMapping.create({
          data: { exerciseTemplateId: ex.id, equipmentTypeId: noEquipType.id, isRequired: false }
        });
        console.log(`   → [${ex.name}] "없음" 기구 매핑 추가`);
        results.fix.push(`${ex.name}: 기구 매핑 추가`);
      }
    }
  } else {
    console.log('✅ 모든 활성 운동에 기구 매핑 존재');
    results.pass.push('기구 매핑 완전성');
  }

  // 1.3 부위 매핑 없는 활성 운동
  const noBodyPartMapping = await prisma.exerciseTemplate.findMany({
    where: { 
      isActive: true,
      bodyPartExerciseMappings: { none: {} }
    },
    include: { bodyPart: true }
  });
  if (noBodyPartMapping.length > 0) {
    console.log(`⚠️ bodyPartExerciseMapping 없는 활성 운동: ${noBodyPartMapping.length}개`);
    noBodyPartMapping.forEach(e => console.log(`   - ${e.name} (bodyPart: ${e.bodyPart?.name || 'none'})`));
    results.warn.push({ item: '부위 매핑 없는 운동', count: noBodyPartMapping.length });
    
    // 자동 수정
    for (const ex of noBodyPartMapping) {
      if (ex.bodyPartId) {
        await prisma.bodyPartExerciseMapping.create({
          data: {
            bodyPartId: ex.bodyPartId,
            exerciseTemplateId: ex.id,
            priority: 5,
            intensityLevel: ex.intensityLevel || 2,
            isActive: true
          }
        });
        console.log(`   → [${ex.name}] bodyPartExerciseMapping 추가`);
        results.fix.push(`${ex.name}: 부위 매핑 추가`);
      }
    }
  } else {
    console.log('✅ 모든 활성 운동에 부위 매핑 존재');
    results.pass.push('부위 매핑 완전성');
  }

  // ===== 2. 부위별 운동 충분성 =====
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 2. 부위별 운동 충분성\n');

  const bodyParts = await prisma.bodyPart.findMany({ orderBy: { displayOrder: 'asc' } });
  
  for (const bp of bodyParts) {
    const exercises = await prisma.exerciseTemplate.findMany({
      where: { bodyPartId: bp.id, isActive: true },
      include: { exerciseEquipmentMappings: { include: { equipmentType: true } } }
    });

    const warmup = exercises.filter(e => e.intensityLevel && e.intensityLevel <= 2);
    const main = exercises.filter(e => e.intensityLevel && e.intensityLevel >= 3);
    const bodyweight = exercises.filter(e => 
      e.exerciseEquipmentMappings.some(m => m.equipmentType.name === '없음')
    );

    let issues = [];
    if (warmup.length < 2) issues.push(`w${warmup.length}<2`);
    if (main.length < 1) issues.push(`m${main.length}<1`);
    if (bodyweight.length < 2) issues.push(`맨몸${bodyweight.length}<2`);

    if (issues.length > 0) {
      console.log(`⚠️ ${bp.name}: 총${exercises.length} w${warmup.length} m${main.length} 맨몸${bodyweight.length} [${issues.join(', ')}]`);
      results.warn.push({ item: bp.name, issues });
    } else {
      console.log(`✅ ${bp.name}: 총${exercises.length} w${warmup.length} m${main.length} 맨몸${bodyweight.length}`);
      results.pass.push(bp.name);
    }
  }

  // ===== 3. 기구별 운동 =====
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 3. 기구별 운동\n');

  const equipment = await prisma.equipmentType.findMany();
  for (const eq of equipment) {
    const count = await prisma.exerciseEquipmentMapping.count({
      where: { equipmentTypeId: eq.id, exerciseTemplate: { isActive: true } }
    });
    if (count < 5) {
      console.log(`⚠️ ${eq.name}: ${count}개 (권장 5개)`);
      results.warn.push({ item: `기구 ${eq.name}`, count });
    } else {
      console.log(`✅ ${eq.name}: ${count}개`);
      results.pass.push(`기구 ${eq.name}`);
    }
  }

  // ===== 4. API 필수 데이터 =====
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 4. API 필수 데이터\n');

  const reviewTags = await prisma.reviewTag.count();
  console.log(`${reviewTags >= 5 ? '✅' : '⚠️'} 리뷰 태그: ${reviewTags}개`);
  results[reviewTags >= 5 ? 'pass' : 'warn'].push('리뷰 태그');

  const gyms = await prisma.gym.count({ where: { isActive: true } });
  console.log(`${gyms >= 5 ? '✅' : '⚠️'} 활성 헬스장: ${gyms}개`);
  results[gyms >= 5 ? 'pass' : 'warn'].push('활성 헬스장');

  // ===== 결과 요약 =====
  console.log('\n' + '='.repeat(70));
  console.log('\n🎯 검증 결과\n');
  console.log(`   ✅ 통과: ${results.pass.length}개`);
  console.log(`   ❌ 실패: ${results.fail.length}개`);
  console.log(`   ⚠️ 경고: ${results.warn.length}개`);
  console.log(`   🔧 자동수정: ${results.fix.length}개`);

  if (results.fail.length > 0) {
    console.log('\n❌ 실패 항목:');
    results.fail.forEach((f, i) => console.log(`   ${i + 1}. ${f.item}: ${f.count}개`));
  }

  if (results.fix.length > 0) {
    console.log('\n🔧 자동 수정된 항목:');
    results.fix.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
  }

  if (results.warn.length > 0) {
    console.log('\n⚠️ 경고 항목:');
    results.warn.forEach((w, i) => {
      if (typeof w === 'string') console.log(`   ${i + 1}. ${w}`);
      else console.log(`   ${i + 1}. ${w.item}: ${w.count || w.issues}`);
    });
  }

  const total = results.pass.length + results.fail.length;
  const score = Math.round((results.pass.length / total) * 100);
  console.log(`\n📊 품질 점수: ${score}%`);
  console.log(results.fail.length === 0 ? '   🟢 출시 가능' : '   🔴 수정 필요');
}

main().catch(console.error).finally(() => prisma.$disconnect());
