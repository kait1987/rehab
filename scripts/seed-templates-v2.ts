/**
 * ENG-S1-03: 템플릿 시드 v2
 * 
 * 추가 템플릿을 시딩해 exercise_templates를 200개 이상으로 만듭니다.
 * UPSERT 방식으로 재실행 안전합니다.
 * 
 * 실행: npx tsx scripts/seed-templates-v2.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TemplateInput {
  name: string;
  bodyPartName: string;
  intensityLevel: number;
  durationMinutes: number;
  reps?: number;
  sets?: number;
  restSeconds?: number;
  equipmentNames: string[];
  description?: string;
  instructions?: string;
  precautions?: string;
}

async function seedTemplatesV2() {
  console.log('🌱 템플릿 시드 v2 시작...\n');

  // 1. JSON 파일 로드
  const dataPath = path.join(process.cwd(), 'data', 'exercise-templates-expansion.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${dataPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const templates: TemplateInput[] = JSON.parse(rawData);
  
  console.log(`📄 ${templates.length}개 템플릿 로드됨`);

  // 2. 마스터 데이터 조회
  const bodyParts = await prisma.bodyPart.findMany();
  const equipmentTypes = await prisma.equipmentType.findMany();

  const bodyPartMap = new Map(bodyParts.map(bp => [bp.name, bp.id]));
  const equipmentMap = new Map(equipmentTypes.map(eq => [eq.name, eq.id]));

  console.log(`📍 부위 ${bodyParts.length}개, 기구 ${equipmentTypes.length}개 로드됨\n`);

  // 3. 템플릿 시딩
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const template of templates) {
    try {
      // 부위 매칭
      const bodyPartId = bodyPartMap.get(template.bodyPartName);
      if (!bodyPartId) {
        console.error(`❌ 부위 '${template.bodyPartName}' 없음: ${template.name}`);
        errors++;
        continue;
      }

      // 기존 템플릿 확인 (중복 방지)
      const existing = await prisma.exerciseTemplate.findFirst({
        where: { name: template.name }
      });

      if (existing) {
        skipped++;
        continue;
      }

      // 템플릿 생성
      const newTemplate = await prisma.exerciseTemplate.create({
        data: {
          name: template.name,
          description: template.description || `${template.bodyPartName} 운동`,
          bodyPartId,
          intensityLevel: template.intensityLevel,
          durationMinutes: template.durationMinutes,
          reps: template.reps || 10,
          sets: template.sets || 3,
          restSeconds: template.restSeconds || 30,
          instructions: template.instructions || `${template.name}을(를) 올바른 자세로 수행하세요.`,
          precautions: template.precautions || '통증이 있으면 즉시 중단하세요.',
          isActive: true
        }
      });

      // 기구 매핑
      for (const eqName of template.equipmentNames) {
        const equipmentId = equipmentMap.get(eqName);
        if (equipmentId) {
          await prisma.exerciseEquipmentMapping.create({
            data: {
              exerciseTemplateId: newTemplate.id,
              equipmentTypeId: equipmentId
            }
          });
        }
      }

      created++;
    } catch (err) {
      console.error(`❌ 오류 (${template.name}):`, err);
      errors++;
    }
  }

  console.log('\n📊 결과:');
  console.log(`   ✅ 생성: ${created}개`);
  console.log(`   ⏭️ 스킵 (중복): ${skipped}개`);
  console.log(`   ❌ 오류: ${errors}개`);

  // 4. 최종 카운트
  const totalCount = await prisma.exerciseTemplate.count();
  console.log(`\n📈 총 템플릿 수: ${totalCount}개`);

  if (totalCount >= 200) {
    console.log('✅ 목표 달성! (200개 이상)');
  } else {
    console.log(`⚠️ 목표 미달: ${200 - totalCount}개 추가 필요`);
  }

  if (errors > 0) {
    process.exit(1);
  }
}

async function main() {
  try {
    await seedTemplatesV2();
    console.log('\n✅ 시드 완료!');
  } catch (error) {
    console.error('❌ 시드 실패:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
