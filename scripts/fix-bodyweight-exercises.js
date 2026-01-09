/**
 * Phase 1 + 2: 기구 매핑 수정 및 맨몸 운동 추가
 * 
 * 1. 매트 운동에 "없음" 매핑 추가 (맨바닥에서도 가능한 운동)
 * 2. 부족한 부위에 맨몸 운동 추가 (골반 2개, 등 2개, 허리 1개)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 맨바닥에서도 가능한 매트 운동 목록
const MAT_EXERCISES_ALSO_BODYWEIGHT = [
  '브릿지',
  '힙 브릿지',
  '브릿지 (힙 레이즈)',
  '버드독',
  '캣카우 스트레칭',
  '캣 스트레칭',
  '플랭크',
  '데드버그',
  '글루트 브릿지',
  '수퍼맨 운동',
  '수퍼맨',
];

// 추가할 맨몸 운동
const NEW_BODYWEIGHT_EXERCISES = [
  // 허리 (+1개)
  {
    name: "코어 브레이싱",
    bodyPartName: "허리",
    description: "복부 근육을 긴장시켜 척추를 안정화하는 운동",
    intensityLevel: 1,
    durationMinutes: 3,
    sets: 3,
    reps: 10,
    restSeconds: 30,
    instructions: "배에 힘을 주고 척추를 중립 위치로 유지합니다.",
    precautions: "과도하게 힘을 주지 않습니다.",
    equipmentTypes: ["없음"]
  },
  // 골반 (+2개)
  {
    name: "골반 틸트",
    bodyPartName: "골반",
    description: "골반을 앞뒤로 기울여 유연성과 인식을 높이는 운동",
    intensityLevel: 1,
    durationMinutes: 3,
    sets: 2,
    reps: 15,
    restSeconds: 30,
    instructions: "누운 자세에서 골반을 천천히 앞뒤로 굴립니다.",
    precautions: "급격한 움직임을 피합니다.",
    equipmentTypes: ["없음"]
  },
  {
    name: "서서 골반 회전",
    bodyPartName: "골반",
    description: "서서 골반을 원을 그리며 돌리는 운동",
    intensityLevel: 2,
    durationMinutes: 4,
    sets: 2,
    reps: 10,
    restSeconds: 30,
    instructions: "양발을 어깨 너비로 벌리고 골반으로 원을 그립니다.",
    precautions: "무릎을 고정하고 골반만 움직입니다.",
    equipmentTypes: ["없음"]
  },
  // 등 (+2개)
  {
    name: "프론 수퍼맨",
    bodyPartName: "등",
    description: "엎드려서 팔과 다리를 들어올리는 등 강화 운동",
    intensityLevel: 3,
    durationMinutes: 5,
    sets: 3,
    reps: 10,
    restSeconds: 45,
    instructions: "엎드린 자세에서 양팔과 양다리를 동시에 들어올립니다.",
    precautions: "목이 과도하게 젖혀지지 않도록 합니다.",
    equipmentTypes: ["없음"]
  },
  {
    name: "바닥 백 익스텐션",
    bodyPartName: "등",
    description: "엎드려서 상체를 천천히 들어올리는 운동",
    intensityLevel: 2,
    durationMinutes: 4,
    sets: 3,
    reps: 12,
    restSeconds: 30,
    instructions: "손은 머리 뒤에 두고 상체를 천천히 들어올립니다.",
    precautions: "허리에 무리가 가지 않도록 천천히 합니다.",
    equipmentTypes: ["없음"]
  }
];

async function main() {
  console.log('🔧 Phase 1 + 2: 기구 매핑 수정 및 맨몸 운동 추가\n');
  console.log('='.repeat(60));

  // Phase 1: 매트 운동에 "없음" 매핑 추가
  console.log('\n📋 Phase 1: 매트 운동에 "없음" 매핑 추가\n');

  const noEquipment = await prisma.equipmentType.findFirst({
    where: { name: '없음' }
  });

  if (!noEquipment) {
    console.log('❌ "없음" 기구 타입을 찾을 수 없습니다.');
    return;
  }

  let mappingAdded = 0;
  for (const exerciseName of MAT_EXERCISES_ALSO_BODYWEIGHT) {
    const exercise = await prisma.exerciseTemplate.findFirst({
      where: { name: { contains: exerciseName } },
      include: {
        exerciseEquipmentMappings: {
          include: { equipmentType: true }
        }
      }
    });

    if (!exercise) {
      console.log(`   ⏭️ [${exerciseName}] 없음 - 건너뜀`);
      continue;
    }

    // 이미 "없음" 매핑이 있는지 확인
    const hasNoEquipment = exercise.exerciseEquipmentMappings
      .some(m => m.equipmentType.name === '없음');

    if (hasNoEquipment) {
      console.log(`   ✅ [${exercise.name}] 이미 "없음" 매핑됨`);
      continue;
    }

    // "없음" 매핑 추가
    await prisma.exerciseEquipmentMapping.create({
      data: {
        exerciseTemplateId: exercise.id,
        equipmentTypeId: noEquipment.id,
        isRequired: false
      }
    });

    console.log(`   ➕ [${exercise.name}] "없음" 매핑 추가`);
    mappingAdded++;
  }

  console.log(`\n   📊 Phase 1 결과: ${mappingAdded}개 매핑 추가`);

  // Phase 2: 맨몸 운동 추가
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Phase 2: 맨몸 운동 추가\n');

  let exercisesAdded = 0;
  for (const exercise of NEW_BODYWEIGHT_EXERCISES) {
    // 중복 확인
    const existing = await prisma.exerciseTemplate.findFirst({
      where: { name: exercise.name }
    });

    if (existing) {
      console.log(`   ⏭️ [${exercise.name}] 이미 존재`);
      continue;
    }

    // 부위 찾기
    const bodyPart = await prisma.bodyPart.findFirst({
      where: { name: exercise.bodyPartName }
    });

    if (!bodyPart) {
      console.log(`   ❌ [${exercise.name}] 부위 "${exercise.bodyPartName}" 없음`);
      continue;
    }

    // 운동 생성
    const newExercise = await prisma.exerciseTemplate.create({
      data: {
        name: exercise.name,
        description: exercise.description,
        bodyPartId: bodyPart.id,
        intensityLevel: exercise.intensityLevel,
        durationMinutes: exercise.durationMinutes,
        sets: exercise.sets,
        reps: exercise.reps,
        restSeconds: exercise.restSeconds,
        instructions: exercise.instructions,
        precautions: exercise.precautions,
        isActive: true,
      }
    });

    // 기구 매핑 ("없음")
    await prisma.exerciseEquipmentMapping.create({
      data: {
        exerciseTemplateId: newExercise.id,
        equipmentTypeId: noEquipment.id,
        isRequired: false
      }
    });

    // 부위 매핑
    await prisma.bodyPartExerciseMapping.create({
      data: {
        bodyPartId: bodyPart.id,
        exerciseTemplateId: newExercise.id,
        priority: 5,
        intensityLevel: exercise.intensityLevel,
        isActive: true,
      }
    });

    console.log(`   ✅ [${exercise.name}] 추가 완료 (${exercise.bodyPartName})`);
    exercisesAdded++;
  }

  console.log(`\n   📊 Phase 2 결과: ${exercisesAdded}개 운동 추가`);

  // 결과 확인
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 수정 후 부위별 맨몸 운동 개수:\n');

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

  console.log('\n✅ 완료!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
