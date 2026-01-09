/**
 * 간단한 맨몸 운동 현황 확인
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bodyParts = ['허리', '등', '골반'];
  
  for (const bpName of bodyParts) {
    const bp = await prisma.bodyPart.findFirst({ where: { name: bpName } });
    if (!bp) continue;

    const exercises = await prisma.exerciseTemplate.findMany({
      where: { bodyPartId: bp.id, isActive: true },
      include: {
        exerciseEquipmentMappings: { include: { equipmentType: true } }
      }
    });

    let bodyweight = [];
    for (const ex of exercises) {
      const eqNames = ex.exerciseEquipmentMappings.map(m => m.equipmentType.name);
      if (eqNames.includes('없음')) {
        bodyweight.push({
          name: ex.name,
          intensity: ex.intensityLevel,
          equipment: eqNames
        });
      }
    }

    const warmup = bodyweight.filter(e => e.intensity <= 2).length;
    const main = bodyweight.filter(e => e.intensity >= 3).length;

    console.log(`${bpName}: 총${exercises.length}, 맨몸${bodyweight.length} (w:${warmup}, m:${main})`);
    
    if (bodyweight.length < 3 || warmup < 1 || main < 1) {
      console.log('  문제: 맨몸 운동 부족');
      bodyweight.forEach(e => console.log(`  - [${e.intensity}] ${e.name}: [${e.equipment.join(', ')}]`));
    }
    console.log('');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
