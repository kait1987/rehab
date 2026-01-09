/**
 * 허리/등/골반 + 없음 시나리오 상세 분석
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeScenario(bodyPartName) {
  console.log(`\n📋 ${bodyPartName} + 없음 상세 분석:\n`);
  
  const bp = await prisma.bodyPart.findFirst({ where: { name: bodyPartName } });
  if (!bp) {
    console.log(`   ❌ 부위 없음`);
    return;
  }

  const exercises = await prisma.exerciseTemplate.findMany({
    where: { bodyPartId: bp.id, isActive: true },
    include: {
      exerciseEquipmentMappings: {
        include: { equipmentType: true }
      }
    }
  });

  console.log(`   전체 활성 운동: ${exercises.length}개\n`);

  // 각 운동의 기구 정보 표시
  let bodyweightCount = 0;
  let warmupBodyweight = 0;
  let mainBodyweight = 0;

  for (const ex of exercises) {
    const equipment = ex.exerciseEquipmentMappings.map(m => m.equipmentType.name);
    const hasNoEquip = equipment.includes('없음');
    const isOnlyNoEquip = equipment.length === 1 && equipment[0] === '없음';
    
    let status = '❌';
    let reason = '';
    
    if (isOnlyNoEquip) {
      status = '✅';
      reason = '맨몸 전용';
      bodyweightCount++;
      if (ex.intensityLevel <= 2) warmupBodyweight++;
      if (ex.intensityLevel >= 3) mainBodyweight++;
    } else if (hasNoEquip) {
      status = '✅';
      reason = '맨몸 가능';
      bodyweightCount++;
      if (ex.intensityLevel <= 2) warmupBodyweight++;
      if (ex.intensityLevel >= 3) mainBodyweight++;
    } else {
      status = '⏭️';
      reason = '기구 필요';
    }

    console.log(`   ${status} [${ex.intensityLevel}] ${ex.name}`);
    console.log(`      기구: [${equipment.join(', ')}] - ${reason}`);
  }

  console.log(`\n   📊 결과:`);
  console.log(`   - 맨몸 가능: ${bodyweightCount}개`);
  console.log(`   - warmup 맨몸: ${warmupBodyweight}개`);
  console.log(`   - main 맨몸: ${mainBodyweight}개`);
  
  const valid = bodyweightCount >= 3 && warmupBodyweight >= 1 && mainBodyweight >= 1;
  console.log(`\n   ${valid ? '✅ 조건 충족' : '❌ 조건 미충족'}`);
}

async function main() {
  console.log('🔍 문제 시나리오 상세 분석\n');
  console.log('='.repeat(60));

  await analyzeScenario('허리');
  await analyzeScenario('등');
  await analyzeScenario('골반');

  console.log('\n' + '='.repeat(60));
}

main().catch(console.error).finally(() => prisma.$disconnect());
