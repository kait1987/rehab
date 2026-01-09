/**
 * 운동 생성 로직 전체 진단 스크립트
 * 
 * "없음"(맨몸) 선택 시 기구 운동이 나오는 문제 진단
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 운동 생성 로직 전체 진단\n');
  console.log('='.repeat(70));

  // 테스트 시나리오: 허리 부위, 통증 3, 기구 "없음"만 선택
  const testScenario = {
    bodyPartName: '허리',
    painLevel: 3,
    equipmentAvailable: ['없음'] // 맨몸만 선택
  };

  console.log(`\n📋 테스트 시나리오:`);
  console.log(`   부위: ${testScenario.bodyPartName}`);
  console.log(`   통증: ${testScenario.painLevel}`);
  console.log(`   기구: [${testScenario.equipmentAvailable.join(', ')}]`);

  // 1. 해당 부위 찾기
  const bodyPart = await prisma.bodyPart.findFirst({
    where: { name: testScenario.bodyPartName }
  });

  if (!bodyPart) {
    console.log(`\n❌ 부위 "${testScenario.bodyPartName}" 없음`);
    return;
  }

  console.log(`\n✅ 부위 ID: ${bodyPart.id}`);

  // 2. 해당 부위의 모든 운동 매핑 조회
  const mappings = await prisma.bodyPartExerciseMapping.findMany({
    where: {
      bodyPartId: bodyPart.id,
      isActive: true,
    },
    include: {
      exerciseTemplate: {
        include: {
          exerciseEquipmentMappings: {
            include: { equipmentType: true }
          }
        }
      }
    }
  });

  console.log(`\n📊 전체 운동 매핑: ${mappings.length}개`);
  console.log('='.repeat(70));

  // 3. 각 운동별 기구 필터링 결과 분석
  const userEquipmentSet = new Set(testScenario.equipmentAvailable);
  
  console.log('\n🔧 기구 필터링 분석:\n');

  let passedCount = 0;
  let filteredCount = 0;

  for (const mapping of mappings) {
    const exercise = mapping.exerciseTemplate;
    
    // 비활성 운동 체크
    if (!exercise.isActive) {
      console.log(`   ⏭️ [${exercise.name}] 비활성 - 건너뜀`);
      filteredCount++;
      continue;
    }

    // 기구 정보
    const exerciseEquipment = exercise.exerciseEquipmentMappings
      .map(eem => eem.equipmentType.name);

    // 필터링 로직 시뮬레이션
    const isNoEquipmentExercise = 
      exerciseEquipment.length === 1 && exerciseEquipment[0] === '없음';

    const hasAllRequiredEquipment = exerciseEquipment.every(eq => 
      eq === '없음' || userEquipmentSet.has(eq)
    );

    const shouldPass = isNoEquipmentExercise || hasAllRequiredEquipment;

    if (shouldPass) {
      console.log(`   ✅ [${exercise.name}]`);
      console.log(`      기구: [${exerciseEquipment.join(', ')}]`);
      console.log(`      isNoEquipment=${isNoEquipmentExercise}, hasAll=${hasAllRequiredEquipment}`);
      passedCount++;
    } else {
      console.log(`   ❌ [${exercise.name}] 필터링됨`);
      console.log(`      기구: [${exerciseEquipment.join(', ')}]`);
      console.log(`      isNoEquipment=${isNoEquipmentExercise}, hasAll=${hasAllRequiredEquipment}`);
      filteredCount++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 결과 요약:`);
  console.log(`   - 통과: ${passedCount}개`);
  console.log(`   - 필터링: ${filteredCount}개`);

  // 4. 문제 진단
  console.log('\n' + '='.repeat(70));
  console.log('\n🔴 잠재적 문제 진단:\n');

  // DB에서 기구가 잘못 매핑된 운동 찾기
  const wrongMappings = [];
  for (const mapping of mappings) {
    const exercise = mapping.exerciseTemplate;
    if (!exercise.isActive) continue;

    const equipment = exercise.exerciseEquipmentMappings
      .map(eem => eem.equipmentType.name);

    // "없음"이 포함되어 있는데 다른 기구도 있는 경우
    if (equipment.includes('없음') && equipment.length > 1) {
      wrongMappings.push({
        name: exercise.name,
        equipment
      });
    }
  }

  if (wrongMappings.length > 0) {
    console.log('   ⚠️ "없음"과 다른 기구가 함께 매핑된 운동:');
    wrongMappings.forEach(w => {
      console.log(`      - ${w.name}: [${w.equipment.join(', ')}]`);
    });
  } else {
    console.log('   ✅ "없음" + 다른 기구 혼합 매핑 없음');
  }

  // 5. 모든 부위에서 "없음" 운동 개수 확인
  console.log('\n📋 부위별 "없음" (맨몸) 운동 개수:\n');

  const allBodyParts = await prisma.bodyPart.findMany();
  for (const bp of allBodyParts) {
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
  }

  console.log('\n✅ 진단 완료!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
