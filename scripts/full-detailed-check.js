/**
 * 전체 시스템 상세 검사 v2
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const results = { pass: [], fail: [], warn: [] };
const log = (type, msg) => {
  results[type].push(msg);
  const icon = type === 'pass' ? '✅' : type === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${msg}`);
};

async function main() {
  console.log('🔍 전체 시스템 상세 검사\n');
  console.log('='.repeat(70));

  // ===== 1. 데이터베이스 테이블 =====
  console.log('\n📋 1. 데이터베이스 테이블 존재 확인\n');
  
  const tables = [
    ['exerciseTemplate', 'exercise_templates'],
    ['bodyPart', 'body_parts'],
    ['equipmentType', 'equipment_types'],
    ['bodyPartExerciseMapping', 'body_part_exercise_mappings'],
    ['exerciseEquipmentMapping', 'exercise_equipment_mappings'],
    ['course', 'courses'],
    ['courseExercise', 'course_exercises'],
    ['gym', 'gyms'],
    ['review', 'reviews'],
    ['reviewTag', 'review_tags'],
    ['user', 'users'],
  ];

  for (const [model, table] of tables) {
    try {
      const count = await prisma[model].count();
      log('pass', `${table}: ${count}개`);
    } catch (e) {
      log('fail', `${table}: 접근 실패`);
    }
  }

  // ===== 2. 부위별 운동 데이터 =====
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 2. 부위별 운동 데이터 상세\n');

  const bodyParts = await prisma.bodyPart.findMany({ orderBy: { displayOrder: 'asc' } });
  
  for (const bp of bodyParts) {
    const exercises = await prisma.exerciseTemplate.findMany({
      where: { bodyPartId: bp.id, isActive: true },
      include: {
        exerciseEquipmentMappings: { include: { equipmentType: true } }
      }
    });

    const warmup = exercises.filter(e => e.intensityLevel && e.intensityLevel <= 2);
    const main = exercises.filter(e => e.intensityLevel && e.intensityLevel >= 3);
    const noIntensity = exercises.filter(e => !e.intensityLevel);
    const bodyweight = exercises.filter(e => 
      e.exerciseEquipmentMappings.some(m => m.equipmentType.name === '없음')
    );
    const noEquipMap = exercises.filter(e => e.exerciseEquipmentMappings.length === 0);

    let issues = [];
    if (warmup.length < 2) issues.push(`warmup ${warmup.length}<2`);
    if (main.length < 1) issues.push(`main ${main.length}<1`);
    if (bodyweight.length < 2) issues.push(`맨몸 ${bodyweight.length}<2`);
    if (noIntensity.length > 0) issues.push(`intensity없음 ${noIntensity.length}개`);
    if (noEquipMap.length > 0) issues.push(`기구없음 ${noEquipMap.length}개`);

    const status = issues.length === 0 ? 'pass' : 
                   issues.some(i => i.includes('<')) ? 'fail' : 'warn';
    
    const msg = `${bp.name}: 총${exercises.length} w${warmup.length} m${main.length} 맨몸${bodyweight.length}` +
                (issues.length > 0 ? ` [${issues.join(', ')}]` : '');
    log(status, msg);

    // 기구 매핑 없는 운동 상세
    if (noEquipMap.length > 0) {
      noEquipMap.forEach(e => console.log(`   → 기구없음: ${e.name}`));
    }
  }

  // ===== 3. 기구별 운동 =====
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 3. 기구별 운동 현황\n');

  const equipment = await prisma.equipmentType.findMany();
  for (const eq of equipment) {
    const count = await prisma.exerciseEquipmentMapping.count({
      where: { equipmentTypeId: eq.id, exerciseTemplate: { isActive: true } }
    });
    log(count >= 5 ? 'pass' : 'warn', `${eq.name}: ${count}개`);
  }

  // ===== 4. 코스 생성 시뮬레이션 =====
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 4. 코스 생성 시뮬레이션\n');

  const scenarios = [
    { bp: '허리', eq: ['없음'], name: '허리+맨몸' },
    { bp: '등', eq: ['없음'], name: '등+맨몸' },
    { bp: '골반', eq: ['없음'], name: '골반+맨몸' },
    { bp: '무릎', eq: ['없음'], name: '무릎+맨몸' },
    { bp: '어깨', eq: ['없음'], name: '어깨+맨몸' },
    { bp: '허리', eq: ['매트'], name: '허리+매트' },
    { bp: '등', eq: ['밴드'], name: '등+밴드' },
  ];

  for (const s of scenarios) {
    const bp = await prisma.bodyPart.findFirst({ where: { name: s.bp } });
    if (!bp) { log('fail', `${s.name}: 부위 없음`); continue; }

    const exercises = await prisma.exerciseTemplate.findMany({
      where: { bodyPartId: bp.id, isActive: true },
      include: { exerciseEquipmentMappings: { include: { equipmentType: true } } }
    });

    const userEquip = new Set(s.eq);
    const available = exercises.filter(e => {
      const eqNames = e.exerciseEquipmentMappings.map(m => m.equipmentType.name);
      return eqNames.includes('없음') || eqNames.every(n => n === '없음' || userEquip.has(n));
    });

    const w = available.filter(e => e.intensityLevel <= 2).length;
    const m = available.filter(e => e.intensityLevel >= 3).length;

    const ok = available.length >= 3 && w >= 1 && m >= 1;
    log(ok ? 'pass' : 'fail', `${s.name}: ${available.length}개 (w:${w}, m:${m})`);
  }

  // ===== 5. API 필수 데이터 =====
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 5. API 필수 데이터\n');

  const reviewTags = await prisma.reviewTag.count();
  log(reviewTags >= 5 ? 'pass' : 'warn', `리뷰 태그: ${reviewTags}개`);

  const gyms = await prisma.gym.count({ where: { isActive: true } });
  log(gyms >= 5 ? 'pass' : 'warn', `활성 헬스장: ${gyms}개`);

  const users = await prisma.user.count();
  log('pass', `사용자: ${users}개`);

  // ===== 결과 요약 =====
  console.log('\n' + '='.repeat(70));
  console.log('\n🎯 검사 결과 요약\n');
  console.log(`   ✅ 통과: ${results.pass.length}개`);
  console.log(`   ❌ 실패: ${results.fail.length}개`);
  console.log(`   ⚠️ 경고: ${results.warn.length}개`);

  if (results.fail.length > 0) {
    console.log('\n📋 실패 항목:');
    results.fail.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
  }

  if (results.warn.length > 0) {
    console.log('\n📋 경고 항목:');
    results.warn.forEach((w, i) => console.log(`   ${i + 1}. ${w}`));
  }

  const total = results.pass.length + results.fail.length;
  const score = Math.round((results.pass.length / total) * 100);
  console.log(`\n📊 품질 점수: ${score}%`);
  
  if (results.fail.length === 0) console.log('   🟢 출시 가능');
  else if (results.fail.length <= 3) console.log('   🟡 수정 후 출시');
  else console.log('   🔴 수정 필요');
}

main().catch(console.error).finally(() => prisma.$disconnect());
