#!/usr/bin/env tsx
/**
 * 부위 Bank JSON 생성 스크립트
 * 
 * 기존 exercise_templates를 사용하여 부위별 추천 운동 및 금기 운동을 자동으로 생성합니다.
 * 
 * 사용법:
 *   pnpm tsx scripts/generate-body-part-bank.ts
 */

import { writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma/client";
import type { BodyPartBankInput } from "@/types/body-part-bank";

const OUTPUT_FILE = join(process.cwd(), "templates", "body-part-bank-30.json");

async function main() {
  console.log("📝 부위 Bank 데이터 생성 중...\n");

  // 기존 exercise_templates 읽기
  const templates = await prisma.exerciseTemplate.findMany({
    where: { isActive: true },
    include: { bodyPart: true },
  });

  if (templates.length === 0) {
    console.error("❌ exercise_templates가 없습니다. 먼저 템플릿을 업로드해주세요.");
    process.exit(1);
  }

  // 부위별로 템플릿 그룹화
  const templatesByBodyPart = new Map<string, typeof templates>();
  templates.forEach((template) => {
    const bodyPartName = template.bodyPart.name;
    if (!templatesByBodyPart.has(bodyPartName)) {
      templatesByBodyPart.set(bodyPartName, []);
    }
    templatesByBodyPart.get(bodyPartName)!.push(template);
  });

  console.log(`📊 총 ${templatesByBodyPart.size}개 부위에서 데이터 생성\n`);

  const bodyPartBanks: BodyPartBankInput[] = [];

  // 각 부위에 대해 추천 운동 및 금기 운동 생성
  for (const [bodyPartName, bodyPartTemplates] of templatesByBodyPart.entries()) {
    // 추천 운동: 해당 부위의 운동 중 3-5개 선택
    const recommendedCount = Math.min(5, Math.max(3, Math.floor(bodyPartTemplates.length * 0.4)));
    const recommendedTemplates = bodyPartTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, recommendedCount);

    const recommended = recommendedTemplates.map((template, index) => ({
      bodyPartName,
      exerciseTemplateName: template.name,
      priority: index + 1,
      intensity_level: template.intensityLevel || undefined,
      pain_level_range: index === 0 ? "1-2" : index === 1 ? "3-4" : "all",
      is_active: true,
    }));

    // 금기 운동: 다른 부위의 고강도 운동 중 2-4개 선택
    const otherTemplates = templates.filter(
      (t) => t.bodyPart.name !== bodyPartName && (t.intensityLevel || 0) >= 3
    );
    const contraindicationCount = Math.min(4, Math.max(2, Math.floor(otherTemplates.length * 0.1)));
    const contraindicationTemplates = otherTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, contraindicationCount);

    const contraindications = contraindicationTemplates.map((template) => ({
      bodyPartName,
      exerciseTemplateName: template.name,
      pain_level_min: Math.floor(Math.random() * 3) + 3, // 3-5
      severity: Math.random() > 0.5 ? ("strict" as const) : ("warning" as const),
      reason: `${bodyPartName} 통증이 있을 때는 피해야 하는 운동입니다.`,
      is_active: true,
    }));

    bodyPartBanks.push({
      bodyPartName,
      recommended,
      contraindications,
    });

    console.log(`✅ ${bodyPartName}: 추천 ${recommended.length}개, 금기 ${contraindications.length}개`);
  }

  // JSON 파일로 저장
  writeFileSync(OUTPUT_FILE, JSON.stringify(bodyPartBanks, null, 2), "utf-8");

  console.log(`\n✅ 총 ${bodyPartBanks.length}개 부위 Bank 생성 완료: ${OUTPUT_FILE}`);
  
  // 통계 출력
  const totalRecommended = bodyPartBanks.reduce((sum, bank) => sum + bank.recommended.length, 0);
  const totalContraindications = bodyPartBanks.reduce((sum, bank) => sum + bank.contraindications.length, 0);
  console.log(`📊 추천 운동 매핑: ${totalRecommended}개`);
  console.log(`📊 금기 운동: ${totalContraindications}개`);
}

main()
  .catch((error) => {
    console.error("❌ 에러 발생:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

