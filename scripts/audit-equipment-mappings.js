/**
 * 운동-기구 매핑 전수 조사 및 정리
 * 
 * UI에 표시된 기구: 없음, 매트, 덤벨, 밴드, 짐볼, 폼롤러
 * 이 기구에 속하지 않는 운동을 찾아서 정리합니다.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// UI에 표시된 유효 기구 목록
const VALID_EQUIPMENT = ['없음', '매트', '덤벨', '밴드', '짐볼', '폼롤러'];

async function main() {
  console.log('🔍 기구 매핑 전수 조사 시작...\n');
  console.log('='.repeat(60));

  // 1. DB에 존재하는 모든 기구 타입 확인
  console.log('\n📋 DB 기구 타입 목록:\n');
  const equipmentTypes = await prisma.equipmentType.findMany({
    select: { id: true, name: true }
  });
  equipmentTypes.forEach(eq => {
    const isValid = VALID_EQUIPMENT.includes(eq.name) ? '✅' : '❌';
    console.log(`  ${isValid} ${eq.name}`);
  });

  // 2. 유효하지 않은 기구 타입 찾기
  const invalidEquipment = equipmentTypes.filter(eq => !VALID_EQUIPMENT.includes(eq.name));
  if (invalidEquipment.length > 0) {
    console.log('\n⚠️  UI에 없는 기구 타입:');
    invalidEquipment.forEach(eq => console.log(`   - ${eq.name}`));
  }

  // 3. 각 기구별 운동 개수 확인
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 기구별 활성 운동 매핑 개수:\n');

  for (const eq of equipmentTypes) {
    const count = await prisma.exerciseEquipmentMapping.count({
      where: {
        equipmentTypeId: eq.id,
        exerciseTemplate: { isActive: true }
      }
    });
    const isValid = VALID_EQUIPMENT.includes(eq.name) ? '✅' : '❌';
    console.log(`  ${isValid} ${eq.name}: ${count}개`);
  }

  // 4. 기구 매핑이 없는 활성 운동 찾기
  console.log('\n' + '='.repeat(60));
  console.log('\n⚠️  기구 매핑이 없는 활성 운동:\n');

  const exercisesWithoutEquipment = await prisma.exerciseTemplate.findMany({
    where: {
      isActive: true,
      exerciseEquipmentMappings: { none: {} }
    },
    select: { name: true, bodyPart: { select: { name: true } } }
  });

  if (exercisesWithoutEquipment.length === 0) {
    console.log('   없음 (모든 운동이 기구 매핑됨)');
  } else {
    exercisesWithoutEquipment.forEach(ex => {
      console.log(`   - ${ex.name} (${ex.bodyPart?.name || 'unknown'})`);
    });
  }

  // 5. 유효하지 않은 기구에만 매핑된 운동 찾기
  console.log('\n' + '='.repeat(60));
  console.log('\n⚠️  유효하지 않은 기구에 매핑된 운동:\n');

  if (invalidEquipment.length > 0) {
    const invalidEquipmentIds = invalidEquipment.map(eq => eq.id);
    
    const exercisesWithInvalidEquipment = await prisma.exerciseTemplate.findMany({
      where: {
        isActive: true,
        exerciseEquipmentMappings: {
          some: { equipmentTypeId: { in: invalidEquipmentIds } }
        }
      },
      include: {
        exerciseEquipmentMappings: {
          include: { equipmentType: true }
        },
        bodyPart: true
      }
    });

    if (exercisesWithInvalidEquipment.length === 0) {
      console.log('   없음');
    } else {
      exercisesWithInvalidEquipment.forEach(ex => {
        const equipment = ex.exerciseEquipmentMappings.map(m => m.equipmentType.name).join(', ');
        console.log(`   - ${ex.name}: [${equipment}]`);
      });
    }
  } else {
    console.log('   (유효하지 않은 기구 타입 없음)');
  }

  // 6. 요약
  console.log('\n' + '='.repeat(60));
  console.log('\n📈 요약:\n');
  console.log(`   - 유효 기구: ${VALID_EQUIPMENT.join(', ')}`);
  console.log(`   - DB 기구 타입: ${equipmentTypes.length}개`);
  console.log(`   - 유효하지 않은 기구: ${invalidEquipment.length}개`);
  console.log(`   - 기구 없는 운동: ${exercisesWithoutEquipment.length}개`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
