/**
 * 모든 부위에 메인 운동이 있는지 확인하고 없으면 추가/수정
 * 
 * 메인 운동 기준: intensityLevel >= 3
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 메인 운동 intensity 수정 시작...\n');

  // 1. 각 부위별 메인 운동 확인
  const bodyParts = await prisma.bodyPart.findMany();
  
  for (const bp of bodyParts) {
    const mainExercises = await prisma.exerciseTemplate.findMany({
      where: {
        bodyPartId: bp.id,
        isActive: true,
        intensityLevel: { gte: 3 }
      }
    });

    if (mainExercises.length === 0) {
      console.log(`⚠️  ${bp.name}: 메인 운동 없음`);
      
      // intensity 2인 운동 찾아서 3으로 업그레이드
      const midIntensity = await prisma.exerciseTemplate.findFirst({
        where: {
          bodyPartId: bp.id,
          isActive: true,
          intensityLevel: 2
        }
      });

      if (midIntensity) {
        await prisma.exerciseTemplate.update({
          where: { id: midIntensity.id },
          data: { intensityLevel: 3 }
        });
        console.log(`   ✅ "${midIntensity.name}" intensity: 2 → 3`);
      } else {
        console.log(`   ❌ 업그레이드할 운동 없음`);
      }
    } else {
      console.log(`✅ ${bp.name}: 메인 운동 ${mainExercises.length}개`);
    }
  }

  console.log('\n📋 수정 후 결과:');
  
  for (const bp of bodyParts) {
    const counts = {
      warmup: await prisma.exerciseTemplate.count({
        where: { bodyPartId: bp.id, isActive: true, intensityLevel: 1 }
      }),
      mid: await prisma.exerciseTemplate.count({
        where: { bodyPartId: bp.id, isActive: true, intensityLevel: 2 }
      }),
      main: await prisma.exerciseTemplate.count({
        where: { bodyPartId: bp.id, isActive: true, intensityLevel: { gte: 3 } }
      })
    };
    console.log(`${bp.name}: warmup=${counts.warmup}, mid=${counts.mid}, main=${counts.main}`);
  }

  console.log('\n✅ 완료!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
