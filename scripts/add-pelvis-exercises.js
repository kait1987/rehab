/**
 * 골반 맨몸 운동 추가 (1개 → 3개 이상)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PELVIS_BODYWEIGHT_EXERCISES = [
  {
    name: "스탠딩 힙 서클",
    bodyPartName: "골반",
    description: "서서 다리를 들어 원을 그리는 골반 가동성 운동",
    intensityLevel: 2,
    durationMinutes: 5,
    sets: 2,
    reps: 10,
    restSeconds: 30,
    instructions: "한 발로 서서 다른 다리를 들어 큰 원을 그립니다.",
    precautions: "균형을 잃지 않도록 벽을 잡아도 됩니다.",
    equipmentTypes: ["없음"]
  },
  {
    name: "90-90 스트레칭",
    bodyPartName: "골반",
    description: "앉아서 양쪽 다리를 90도로 두고 골반을 늘리는 스트레칭",
    intensityLevel: 1,
    durationMinutes: 4,
    sets: 2,
    reps: 30, // 초 단위
    restSeconds: 20,
    instructions: "양쪽 무릎을 90도로 두고 천천히 몸을 앞으로 기울입니다.",
    precautions: "무릎에 통증이 느껴지면 중단합니다.",
    equipmentTypes: ["없음"]
  },
  {
    name: "레그 스윙",
    bodyPartName: "골반",
    description: "서서 다리를 앞뒤로 흔드는 동적 스트레칭",
    intensityLevel: 2,
    durationMinutes: 4,
    sets: 2,
    reps: 15,
    restSeconds: 30,
    instructions: "벽을 잡고 다리를 앞뒤로 편하게 흔듭니다.",
    precautions: "갑자기 강하게 차지 않습니다.",
    equipmentTypes: ["없음"]
  }
];

async function main() {
  console.log('🦴 골반 맨몸 운동 추가\n');

  const noEquipment = await prisma.equipmentType.findFirst({
    where: { name: '없음' }
  });

  let added = 0;
  for (const exercise of PELVIS_BODYWEIGHT_EXERCISES) {
    const existing = await prisma.exerciseTemplate.findFirst({
      where: { name: exercise.name }
    });

    if (existing) {
      console.log(`⏭️ [${exercise.name}] 이미 존재`);
      continue;
    }

    const bodyPart = await prisma.bodyPart.findFirst({
      where: { name: exercise.bodyPartName }
    });

    if (!bodyPart) continue;

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

    await prisma.exerciseEquipmentMapping.create({
      data: {
        exerciseTemplateId: newExercise.id,
        equipmentTypeId: noEquipment.id,
        isRequired: false
      }
    });

    await prisma.bodyPartExerciseMapping.create({
      data: {
        bodyPartId: bodyPart.id,
        exerciseTemplateId: newExercise.id,
        priority: 5,
        intensityLevel: exercise.intensityLevel,
        isActive: true,
      }
    });

    console.log(`✅ [${exercise.name}] 추가`);
    added++;
  }

  // 결과 확인
  const pelvisCount = await prisma.bodyPartExerciseMapping.count({
    where: {
      bodyPart: { name: '골반' },
      isActive: true,
      exerciseTemplate: {
        isActive: true,
        exerciseEquipmentMappings: {
          some: { equipmentType: { name: '없음' } }
        }
      }
    }
  });

  console.log(`\n📊 골반 맨몸 운동: ${pelvisCount}개`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
