#!/usr/bin/env tsx
/**
 * 부위 Bank 업로드 스크립트
 * 
 * templates/body-part-bank-30.json 파일을 읽어
 * 데이터베이스에 업로드합니다.
 * 
 * 사용법:
 *   pnpm tsx scripts/upload-body-part-bank.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma/client";
import { validateBodyPartBank } from "@/lib/validations/validate-body-part-bank";
import type { BodyPartBankInput } from "@/types/body-part-bank";

const BANK_FILE = join(process.cwd(), "templates", "body-part-bank-30.json");

interface UploadStats {
  createdMappings: number;
  skippedMappings: number;
  createdContraindications: number;
  skippedContraindications: number;
  errors: number;
  errorDetails: Array<{ item: string; error: string }>;
}

async function main() {
  console.log("📤 부위 Bank 업로드 시작...\n");

  // JSON 파일 읽기
  let banks: BodyPartBankInput[];
  try {
    const fileContent = readFileSync(BANK_FILE, "utf-8");
    banks = JSON.parse(fileContent);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      console.error(`❌ 파일을 찾을 수 없습니다: ${BANK_FILE}`);
      console.error("   먼저 scripts/generate-body-part-bank.ts를 실행하여 데이터를 생성해주세요.");
    } else {
      console.error(`❌ JSON 파일 읽기 실패:`, error);
    }
    process.exit(1);
  }

  if (!Array.isArray(banks)) {
    console.error("❌ JSON 파일은 배열 형식이어야 합니다.");
    process.exit(1);
  }

  console.log(`📊 총 ${banks.length}개 부위 Bank 업로드 중...\n`);

  // 검증 먼저 수행
  console.log("🔍 데이터 검증 중...");
  const validationResult = await validateBodyPartBank(banks);
  
  if (!validationResult.success) {
    console.error("❌ 검증 실패:");
    validationResult.errors.forEach((err) => console.error(`   - ${err}`));
    if (validationResult.warnings) {
      console.warn("\n⚠️  경고:");
      validationResult.warnings.forEach((warn) => console.warn(`   - ${warn}`));
    }
    process.exit(1);
  }

  if (validationResult.warnings && validationResult.warnings.length > 0) {
    console.warn("⚠️  경고:");
    validationResult.warnings.forEach((warn) => console.warn(`   - ${warn}`));
    console.log();
  }

  console.log("✅ 검증 통과\n");

  // body_parts와 exercise_templates를 미리 읽어서 name → id 맵 생성
  const bodyParts = await prisma.bodyPart.findMany();
  const exerciseTemplates = await prisma.exerciseTemplate.findMany();

  const bodyPartMap = new Map(bodyParts.map((bp) => [bp.name, bp.id]));
  const exerciseTemplateMap = new Map(exerciseTemplates.map((et) => [et.name, et.id]));

  const stats: UploadStats = {
    createdMappings: 0,
    skippedMappings: 0,
    createdContraindications: 0,
    skippedContraindications: 0,
    errors: 0,
    errorDetails: [],
  };

  // 각 부위 Bank 업로드
  for (let i = 0; i < banks.length; i++) {
    const bank = banks[i];
    const index = i + 1;

    try {
      const bodyPartId = bodyPartMap.get(bank.bodyPartName);
      if (!bodyPartId) {
        stats.errors++;
        stats.errorDetails.push({
          item: bank.bodyPartName,
          error: `부위 '${bank.bodyPartName}'를 찾을 수 없습니다.`,
        });
        console.log(`[${index}/${banks.length}] ❌ ${bank.bodyPartName} - 부위를 찾을 수 없음`);
        continue;
      }

      // 추천 운동 매핑 업로드
      for (const rec of bank.recommended) {
        const exerciseTemplateId = exerciseTemplateMap.get(rec.exerciseTemplateName);
        if (!exerciseTemplateId) {
          stats.errors++;
          stats.errorDetails.push({
            item: `${bank.bodyPartName} - ${rec.exerciseTemplateName}`,
            error: `운동 템플릿 '${rec.exerciseTemplateName}'를 찾을 수 없습니다.`,
          });
          continue;
        }

        try {
          await prisma.bodyPartExerciseMapping.create({
            data: {
              bodyPartId,
              exerciseTemplateId,
              priority: rec.priority,
              intensityLevel: rec.intensity_level,
              painLevelRange: rec.pain_level_range || null,
              isActive: rec.is_active ?? true,
            },
          });
          stats.createdMappings++;
        } catch (error: any) {
          // UNIQUE 제약조건 위반 시 건너뛰기
          if (error.code === "P2002") {
            stats.skippedMappings++;
          } else {
            stats.errors++;
            stats.errorDetails.push({
              item: `${bank.bodyPartName} - ${rec.exerciseTemplateName}`,
              error: error.message || String(error),
            });
          }
        }
      }

      // 금기 운동 업로드
      for (const contra of bank.contraindications) {
        const exerciseTemplateId = exerciseTemplateMap.get(contra.exerciseTemplateName);
        if (!exerciseTemplateId) {
          stats.errors++;
          stats.errorDetails.push({
            item: `${bank.bodyPartName} - ${contra.exerciseTemplateName}`,
            error: `운동 템플릿 '${contra.exerciseTemplateName}'를 찾을 수 없습니다.`,
          });
          continue;
        }

        try {
          await prisma.bodyPartContraindication.create({
            data: {
              bodyPartId,
              exerciseTemplateId,
              painLevelMin: contra.pain_level_min || null,
              reason: contra.reason || null,
              severity: contra.severity || "warning",
              isActive: contra.is_active ?? true,
            },
          });
          stats.createdContraindications++;
        } catch (error: any) {
          // UNIQUE 제약조건 위반 시 건너뛰기
          if (error.code === "P2002") {
            stats.skippedContraindications++;
          } else {
            stats.errors++;
            stats.errorDetails.push({
              item: `${bank.bodyPartName} - ${contra.exerciseTemplateName}`,
              error: error.message || String(error),
            });
          }
        }
      }

      console.log(`[${index}/${banks.length}] ✅ ${bank.bodyPartName} - 완료`);
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push({
        item: bank.bodyPartName,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`[${index}/${banks.length}] ❌ ${bank.bodyPartName} - 에러 발생`);
    }
  }

  // 요약 출력
  console.log("\n" + "=".repeat(50));
  console.log("📊 업로드 요약");
  console.log("=".repeat(50));
  console.log(`✅ 추천 운동 매핑 생성: ${stats.createdMappings}개`);
  console.log(`⏭️  추천 운동 매핑 건너뜀: ${stats.skippedMappings}개`);
  console.log(`✅ 금기 운동 생성: ${stats.createdContraindications}개`);
  console.log(`⏭️  금기 운동 건너뜀: ${stats.skippedContraindications}개`);
  console.log(`❌ 에러: ${stats.errors}개`);

  if (stats.errorDetails.length > 0) {
    console.log("\n❌ 에러 상세:");
    stats.errorDetails.forEach((detail) => {
      console.log(`   - ${detail.item}: ${detail.error}`);
    });
  }
}

main()
  .catch((error) => {
    console.error("❌ 에러 발생:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

