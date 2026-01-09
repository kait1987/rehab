/**
 * MVP 품질 검증 - 단순화 버전
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧪 MVP 품질 검증\n');
  console.log('='.repeat(60));

  let passed = 0, failed = 0, warnings = 0;
  const issues = [];

  // 1. 부위별 검증
  console.log('\n📋 1. 부위별 운동 검증:\n');
  const bodyParts = await prisma.bodyPart.findMany();
  
  for (const bp of bodyParts) {
    const exercises = await prisma.exerciseTemplate.findMany({
      where: { bodyPartId: bp.id, isActive: true },
      include: {
        exerciseEquipmentMappings: {
          include: { equipmentType: true }
        }
      }
    });

    const warmup = exercises.filter(e => e.intensityLevel && e.intensityLevel <= 2);
    const main = exercises.filter(e => e.intensityLevel && e.intensityLevel >= 3);
    const bodyweight = exercises.filter(e => 
      e.exerciseEquipmentMappings.some(m => m.equipmentType.name === '없음')
    );

    let status = '✅';
    let notes = [];

    if (warmup.length < 2) {
      status = '❌';
      notes.push(`warmup ${warmup.length}개<2`);
      issues.push(`${bp.name}: warmup ${warmup.length}개`);
      failed++;
    }
    if (main.length < 1) {
      status = '❌';
      notes.push(`main ${main.length}개<1`);
      issues.push(`${bp.name}: main ${main.length}개`);
      failed++;
    }
    if (bodyweight.length < 2) {
      status = '⚠️';
      notes.push(`맨몸 ${bodyweight.length}개<2`);
      issues.push(`${bp.name}: 맨몸 ${bodyweight.length}개`);
      warnings++;
    } else {
      passed++;
    }

    const noteStr = notes.length > 0 ? ` (${notes.join(', ')})` : '';
    console.log(`   ${status} ${bp.name}: 총${exercises.length}, w${warmup.length}, m${main.length}, 맨몸${bodyweight.length}${noteStr}`);
  }

  // 2. 기구별 검증
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 2. 기구별 운동 검증:\n');
  
  const equipment = await prisma.equipmentType.findMany();
  for (const eq of equipment) {
    const count = await prisma.exerciseEquipmentMapping.count({
      where: {
        equipmentTypeId: eq.id,
        exerciseTemplate: { isActive: true }
      }
    });
    
    if (count < 5) {
      console.log(`   ⚠️ ${eq.name}: ${count}개 (권장 5개)`);
      issues.push(`기구 "${eq.name}": ${count}개`);
      warnings++;
    } else {
      console.log(`   ✅ ${eq.name}: ${count}개`);
      passed++;
    }
  }

  // 3. 데이터 무결성
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 3. 데이터 무결성:\n');
  
  // intensity 없는 운동
  const noIntensity = await prisma.exerciseTemplate.count({
    where: { isActive: true, intensityLevel: null }
  });
  if (noIntensity > 0) {
    console.log(`   ❌ intensity 없는 운동: ${noIntensity}개`);
    issues.push(`intensity 없는 운동: ${noIntensity}개`);
    failed++;
  } else {
    console.log(`   ✅ 모든 운동에 intensity 존재`);
    passed++;
  }

  // 기구 매핑 없는 운동
  const noEquipment = await prisma.exerciseTemplate.findMany({
    where: {
      isActive: true,
      exerciseEquipmentMappings: { none: {} }
    }
  });
  if (noEquipment.length > 0) {
    console.log(`   ❌ 기구 매핑 없는 운동: ${noEquipment.length}개`);
    noEquipment.forEach(e => console.log(`      - ${e.name}`));
    issues.push(`기구 매핑 없는 운동: ${noEquipment.map(e => e.name).join(', ')}`);
    failed++;
  } else {
    console.log(`   ✅ 모든 운동에 기구 매핑 존재`);
    passed++;
  }

  // 4. 코스 생성 시뮬레이션
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 4. 핵심 시나리오 테스트:\n');
  
  const scenarios = [
    { bp: '허리', eq: ['없음'] },
    { bp: '등', eq: ['없음'] },
    { bp: '골반', eq: ['없음'] },
    { bp: '무릎', eq: ['매트'] },
  ];

  for (const s of scenarios) {
    const bp = await prisma.bodyPart.findFirst({ where: { name: s.bp } });
    if (!bp) continue;

    const exercises = await prisma.exerciseTemplate.findMany({
      where: { bodyPartId: bp.id, isActive: true },
      include: {
        exerciseEquipmentMappings: {
          include: { equipmentType: true }
        }
      }
    });

    const userEquip = new Set(s.eq);
    const available = exercises.filter(e => {
      const eqNames = e.exerciseEquipmentMappings.map(m => m.equipmentType.name);
      const isBodyweight = eqNames.length === 1 && eqNames[0] === '없음';
      const hasAll = eqNames.every(name => name === '없음' || userEquip.has(name));
      return isBodyweight || hasAll;
    });

    const w = available.filter(e => e.intensityLevel && e.intensityLevel <= 2).length;
    const m = available.filter(e => e.intensityLevel && e.intensityLevel >= 3).length;

    if (available.length >= 3 && w >= 1 && m >= 1) {
      console.log(`   ✅ ${s.bp}+[${s.eq.join(',')}]: ${available.length}개 (w:${w}, m:${m})`);
      passed++;
    } else {
      console.log(`   ❌ ${s.bp}+[${s.eq.join(',')}]: ${available.length}개 (w:${w}, m:${m})`);
      issues.push(`시나리오 ${s.bp}+${s.eq}: 운동 부족`);
      failed++;
    }
  }

  // 결과
  console.log('\n' + '='.repeat(60));
  console.log('\n🎯 결과 요약:\n');
  console.log(`   ✅ 통과: ${passed}개`);
  console.log(`   ❌ 실패: ${failed}개`);
  console.log(`   ⚠️ 경고: ${warnings}개`);

  if (issues.length > 0) {
    console.log('\n📋 이슈 목록:');
    issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
  }

  const score = Math.round((passed / (passed + failed)) * 100);
  console.log(`\n📊 품질 점수: ${score}%`);
  
  if (score >= 90) console.log('   🟢 출시 가능');
  else if (score >= 70) console.log('   🟡 수정 후 출시');
  else console.log('   🔴 수정 필요');
}

main().catch(console.error).finally(() => prisma.$disconnect());
