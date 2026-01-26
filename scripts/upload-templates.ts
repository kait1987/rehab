#!/usr/bin/env tsx
/**
 * 템플릿 업로드 스크립트
 *
 * JSON 템플릿 파일을 읽어 데이터베이스에 업로드합니다.
 *
 * 사용법:
 *   pnpm tsx scripts/upload-templates.ts [파일경로]
 *
 * 예시:
 *   pnpm tsx scripts/upload-templates.ts
 *   pnpm tsx scripts/upload-templates.ts templates/exercise-templates-pnf-diagonal.json
 */

import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma/client";
import type { ExerciseTemplateInput } from "@/types/exercise-template";

// CLI 인자로 파일 경로 받기, 없으면 기본값 사용
const fileArg = process.argv[2];
const TEMPLATES_FILE = fileArg
  ? (fileArg.startsWith("/") || fileArg.includes(":") ? fileArg : join(process.cwd(), fileArg))
  : join(process.cwd(), "templates", "exercise-templates-100.json");

interface UploadStats {
  created: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ template: string; error: string }>;
}

async function main() {
  console.log("📤 템플릿 업로드 시작...\n");

  // JSON 파일 읽기
  let templates: ExerciseTemplateInput[];
  try {
    const fileContent = readFileSync(TEMPLATES_FILE, "utf-8");
    templates = JSON.parse(fileContent);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      console.error(`❌ 파일을 찾을 수 없습니다: ${TEMPLATES_FILE}`);
      console.error("   먼저 scripts/generate-templates.ts를 실행하여 템플릿을 생성해주세요.");
    } else {
      console.error(`❌ JSON 파일 읽기 실패:`, error);
    }
    process.exit(1);
  }

  if (!Array.isArray(templates)) {
    console.error("❌ JSON 파일은 배열 형식이어야 합니다.");
    process.exit(1);
  }

  console.log(`📊 총 ${templates.length}개 템플릿 업로드 중...\n`);

  // body_parts와 equipment_types를 미리 읽어서 name → id 맵 생성
  const bodyParts = await prisma.bodyPart.findMany();
  const equipmentTypes = await prisma.equipmentType.findMany();

  const bodyPartMap = new Map(bodyParts.map((bp) => [bp.name, bp.id]));
  const equipmentTypeMap = new Map(equipmentTypes.map((et) => [et.name, et.id]));

  const stats: UploadStats = {
    created: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  // 각 템플릿 업로드
  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const index = i + 1;

    try {
      // body_part_id 확인
      const bodyPartId = bodyPartMap.get(template.bodyPartName);
      if (!bodyPartId) {
        stats.errors++;
        stats.errorDetails.push({
          template: `${template.name} (${template.bodyPartName})`,
          error: `부위 '${template.bodyPartName}'를 찾을 수 없습니다.`,
        });
        console.log(`[${index}/${templates.length}] ❌ ${template.name} - 부위를 찾을 수 없음`);
        continue;
      }

      // 중복 확인
      const existing = await prisma.exerciseTemplate.findFirst({
        where: {
          name: template.name,
          bodyPartId: bodyPartId,
        },
      });

      if (existing) {
        stats.skipped++;
        console.log(`[${index}/${templates.length}] ⏭️  ${template.name} - 이미 존재 (건너뜀)`);
        continue;
      }

      // 트랜잭션으로 템플릿 및 기구 매핑 생성
      await prisma.$transaction(async (tx) => {
        // exercise_templates에 INSERT
        const createdTemplate = await tx.exerciseTemplate.create({
          data: {
            name: template.name,
            description: template.description,
            bodyPartId: bodyPartId,
            intensityLevel: template.intensity_level,
            durationMinutes: template.duration_minutes,
            reps: template.reps,
            sets: template.sets,
            restSeconds: template.rest_seconds,
            difficultyScore: template.difficulty_score,
            contraindications: template.contraindications || [],
            instructions: template.instructions,
            precautions: template.precautions,
            isActive: true,
          },
        });

        // exercise_equipment_mappings에 INSERT
        if (template.equipmentTypes && template.equipmentTypes.length > 0) {
          const equipmentIds = template.equipmentTypes
            .map((name) => equipmentTypeMap.get(name))
            .filter((id): id is string => id !== undefined);

          if (equipmentIds.length > 0) {
            await Promise.all(
              equipmentIds.map((equipmentId) =>
                tx.exerciseEquipmentMapping.create({
                  data: {
                    exerciseTemplateId: createdTemplate.id,
                    equipmentTypeId: equipmentId,
                    isRequired: false,
                  },
                })
              )
            );
          }
        }
      });

      stats.created++;
      console.log(`[${index}/${templates.length}] ✅ ${template.name}`);
    } catch (error) {
      stats.errors++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      stats.errorDetails.push({
        template: `${template.name} (${template.bodyPartName})`,
        error: errorMessage,
      });
      console.log(`[${index}/${templates.length}] ❌ ${template.name} - ${errorMessage}`);
    }
  }

  // 결과 요약
  console.log("\n" + "=".repeat(60));
  console.log("📈 업로드 결과 요약");
  console.log("=".repeat(60));
  console.log(`전체: ${templates.length}개`);
  console.log(`✅ 생성: ${stats.created}개`);
  console.log(`⏭️  건너뜀: ${stats.skipped}개`);
  console.log(`❌ 에러: ${stats.errors}개`);
  console.log("=".repeat(60));

  if (stats.errorDetails.length > 0) {
    console.log("\n❌ 에러 상세:");
    stats.errorDetails.forEach(({ template, error }) => {
      console.log(`  - ${template}: ${error}`);
    });
  }

  // 종료 코드
  if (stats.errors > 0) {
    console.log("\n⚠️  일부 템플릿 업로드 실패. 위의 오류를 확인해주세요.");
    process.exit(1);
  } else {
    console.log("\n✅ 모든 템플릿 업로드 완료!");
    process.exit(0);
  }
}

main()
  .catch((error) => {
    console.error("❌ 예상치 못한 오류:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

