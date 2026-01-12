/**
 * ENG-S1-01: Templates 현황 분석 스크립트
 * 
 * exercise_templates 분포(부위/강도/기구/스트레칭)를 분석해
 * 부족 카테고리를 수치로 도출합니다.
 * 
 * 실행: npx tsx scripts/analyze-templates.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TemplateAnalysis {
  totalCount: number;
  byBodyPart: Record<string, number>;
  byIntensity: Record<string, number>;
  byEquipment: Record<string, number>;
  activeCount: number;
  inactiveCount: number;
  missingData: {
    noIntensity: number;
    noDescription: number;
    noInstructions: number;
  };
  recommendations: string[];
}

async function analyzeTemplates(): Promise<TemplateAnalysis> {
  console.log('📊 운동 템플릿 분석 시작...\n');

  // 1. 총 템플릿 수
  const templates = await prisma.exerciseTemplate.findMany({
    include: {
      bodyPart: true,
      exerciseEquipmentMappings: {
        include: { equipmentType: true }
      }
    }
  });

  const totalCount = templates.length;
  console.log(`✅ 총 템플릿 수: ${totalCount}개`);

  // 2. 부위별 분포
  const byBodyPart: Record<string, number> = {};
  templates.forEach(t => {
    const partName = t.bodyPart?.name || '미지정';
    byBodyPart[partName] = (byBodyPart[partName] || 0) + 1;
  });

  console.log('\n📍 부위별 분포:');
  Object.entries(byBodyPart)
    .sort((a, b) => b[1] - a[1])
    .forEach(([part, count]) => {
      console.log(`   ${part}: ${count}개`);
    });

  // 3. 강도별 분포
  const byIntensity: Record<string, number> = {};
  templates.forEach(t => {
    const level = t.intensityLevel?.toString() || '미지정';
    byIntensity[level] = (byIntensity[level] || 0) + 1;
  });

  console.log('\n💪 강도별 분포:');
  Object.entries(byIntensity)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([level, count]) => {
      const label = level === '미지정' ? '미지정' : `레벨 ${level}`;
      console.log(`   ${label}: ${count}개`);
    });

  // 4. 기구별 분포
  const byEquipment: Record<string, number> = {};
  templates.forEach(t => {
    if (t.exerciseEquipmentMappings.length === 0) {
      byEquipment['기구 없음'] = (byEquipment['기구 없음'] || 0) + 1;
    } else {
      t.exerciseEquipmentMappings.forEach(m => {
        const eqName = m.equipmentType?.name || '미지정';
        byEquipment[eqName] = (byEquipment[eqName] || 0) + 1;
      });
    }
  });

  console.log('\n🏋️ 기구별 분포:');
  Object.entries(byEquipment)
    .sort((a, b) => b[1] - a[1])
    .forEach(([eq, count]) => {
      console.log(`   ${eq}: ${count}개`);
    });

  // 5. 활성/비활성
  const activeCount = templates.filter(t => t.isActive).length;
  const inactiveCount = templates.filter(t => !t.isActive).length;

  console.log(`\n🔘 활성: ${activeCount}개 / 비활성: ${inactiveCount}개`);

  // 6. 데이터 누락 분석
  const noIntensity = templates.filter(t => !t.intensityLevel).length;
  const noDescription = templates.filter(t => !t.description).length;
  const noInstructions = templates.filter(t => !t.instructions).length;

  console.log('\n⚠️ 데이터 누락:');
  console.log(`   강도 미지정: ${noIntensity}개`);
  console.log(`   설명 없음: ${noDescription}개`);
  console.log(`   지침 없음: ${noInstructions}개`);

  // 7. 추천 사항 생성
  const recommendations: string[] = [];
  
  const targetPerPart = 15;
  Object.entries(byBodyPart).forEach(([part, count]) => {
    if (count < targetPerPart) {
      recommendations.push(`${part}: ${targetPerPart - count}개 추가 필요 (현재 ${count}개)`);
    }
  });

  if (totalCount < 200) {
    recommendations.push(`총 ${200 - totalCount}개 템플릿 추가 필요 (목표 200개)`);
  }

  if (noIntensity > 0) {
    recommendations.push(`${noIntensity}개 템플릿에 강도 레벨 설정 필요`);
  }

  console.log('\n📋 추천 사항:');
  recommendations.forEach(r => console.log(`   • ${r}`));

  const analysis: TemplateAnalysis = {
    totalCount,
    byBodyPart,
    byIntensity,
    byEquipment,
    activeCount,
    inactiveCount,
    missingData: { noIntensity, noDescription, noInstructions },
    recommendations
  };

  // 8. 결과 저장
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const outputPath = path.join(reportsDir, 'templates-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
  console.log(`\n💾 결과 저장: ${outputPath}`);

  return analysis;
}

async function main() {
  try {
    await analyzeTemplates();
    console.log('\n✅ 분석 완료!');
  } catch (error) {
    console.error('❌ 분석 실패:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
