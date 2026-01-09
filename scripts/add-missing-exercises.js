/**
 * 부족한 부위 운동 추가 스크립트
 * 
 * 추가 대상:
 * - 등: 2개 (폼롤러 등 이완, 밴드 로우)
 * - 가슴: 1개 (인클라인 푸쉬업)
 * - 팔꿈치: 1개 (팔꿈치 스트레칭 추가)
 * - 팔: 1개 (밴드 팔 신전)
 * - 다리: 1개 (런지 워킹)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEW_EXERCISES = [
  // 등 (2개)
  {
    name: "폼롤러 등 이완",
    bodyPartName: "등",
    description: "폼롤러 위에 등을 대고 위아래로 굴려 근막을 이완하는 운동",
    intensityLevel: 1,
    durationMinutes: 5,
    sets: 2,
    reps: 10,
    restSeconds: 30,
    difficultyScore: 1,
    instructions: "폼롤러를 등 아래에 두고 천천히 위아래로 굴립니다.",
    precautions: "목이 꺾이지 않도록 손으로 받칩니다.",
    equipmentTypes: ["폼롤러"]
  },
  {
    name: "밴드 로우",
    bodyPartName: "등",
    description: "저항 밴드를 당겨 등 근육을 강화하는 운동",
    intensityLevel: 3,
    durationMinutes: 8,
    sets: 3,
    reps: 12,
    restSeconds: 45,
    difficultyScore: 3,
    instructions: "밴드를 발에 걸고 팔꿈치를 뒤로 당기며 견갑골을 모읍니다.",
    precautions: "허리가 과도하게 젖혀지지 않도록 합니다.",
    equipmentTypes: ["밴드"]
  },
  // 가슴 (1개)
  {
    name: "인클라인 푸쉬업",
    bodyPartName: "가슴",
    description: "벤치나 의자에 손을 대고 하는 변형 푸쉬업",
    intensityLevel: 2,
    durationMinutes: 6,
    sets: 3,
    reps: 12,
    restSeconds: 45,
    difficultyScore: 2,
    instructions: "벤치에 손을 짚고 일반 푸쉬업과 같이 진행합니다.",
    precautions: "손목에 무리가 가지 않도록 합니다.",
    equipmentTypes: ["없음"]
  },
  // 팔 (1개)
  {
    name: "밴드 팔 신전",
    bodyPartName: "팔",
    description: "밴드를 이용한 삼두근 강화 운동",
    intensityLevel: 2,
    durationMinutes: 5,
    sets: 3,
    reps: 12,
    restSeconds: 30,
    difficultyScore: 2,
    instructions: "밴드를 머리 뒤에서 잡고 팔을 펴면서 삼두를 수축합니다.",
    precautions: "팔꿈치가 벌어지지 않도록 고정합니다.",
    equipmentTypes: ["밴드"]
  },
  // 다리 (1개)
  {
    name: "워킹 런지",
    bodyPartName: "다리",
    description: "걸으면서 하는 런지로 하체 전체를 강화하는 운동",
    intensityLevel: 3,
    durationMinutes: 8,
    sets: 3,
    reps: 10,
    restSeconds: 60,
    difficultyScore: 3,
    instructions: "한 발씩 앞으로 내딛으며 런지 자세를 취합니다.",
    precautions: "무릎이 발끝을 넘지 않도록 합니다.",
    equipmentTypes: ["없음"]
  }
];

async function main() {
  console.log('🏋️ 부족한 부위 운동 추가 시작...\n');

  let added = 0;
  let skipped = 0;

  for (const exercise of NEW_EXERCISES) {
    // 중복 확인
    const existing = await prisma.exerciseTemplate.findFirst({
      where: { name: exercise.name }
    });

    if (existing) {
      console.log(`⏭️ [${exercise.name}] 이미 존재 - 건너뜀`);
      skipped++;
      continue;
    }

    // 부위 찾기
    const bodyPart = await prisma.bodyPart.findFirst({
      where: { name: exercise.bodyPartName }
    });

    if (!bodyPart) {
      console.log(`❌ [${exercise.name}] 부위 "${exercise.bodyPartName}" 없음 - 건너뜀`);
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
        difficultyScore: exercise.difficultyScore,
        instructions: exercise.instructions,
        precautions: exercise.precautions,
        isActive: true,
      }
    });

    // 기구 매핑
    for (const eqName of exercise.equipmentTypes) {
      const equipment = await prisma.equipmentType.findFirst({
        where: { name: eqName }
      });

      if (equipment) {
        await prisma.exerciseEquipmentMapping.create({
          data: {
            exerciseTemplateId: newExercise.id,
            equipmentTypeId: equipment.id,
            isRequired: eqName !== '없음'
          }
        });
      }
    }

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

    console.log(`✅ [${exercise.name}] 추가 완료 (${exercise.bodyPartName}, intensity ${exercise.intensityLevel})`);
    added++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 결과: 추가 ${added}개, 건너뜀 ${skipped}개`);
  console.log('\n✅ 완료!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
