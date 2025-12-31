#!/usr/bin/env tsx
/**
 * 템플릿 검증 CLI 스크립트
 * 
 * templates/exercise-templates-100.json 파일을 읽어
 * 모든 템플릿을 검증하고 결과를 출력합니다.
 * 
 * 사용법:
 *   pnpm tsx scripts/validate-templates.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { validateTemplate } from "@/lib/validations/validate-template";
import type { ExerciseTemplateInput } from "@/types/exercise-template";

const TEMPLATES_FILE = join(process.cwd(), "templates", "exercise-templates-100.json");

async function main() {
  console.log("📋 템플릿 검증 시작...\n");

  // JSON 파일 읽기
  let templates: ExerciseTemplateInput[];
  try {
    const fileContent = readFileSync(TEMPLATES_FILE, "utf-8");
    templates = JSON.parse(fileContent);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      console.error(`❌ 파일을 찾을 수 없습니다: ${TEMPLATES_FILE}`);
      console.error("   templates/exercise-templates-100.json 파일을 먼저 생성해주세요.");
    } else {
      console.error(`❌ JSON 파일 읽기 실패:`, error);
    }
    process.exit(1);
  }

  if (!Array.isArray(templates)) {
    console.error("❌ JSON 파일은 배열 형식이어야 합니다.");
    process.exit(1);
  }

  console.log(`📊 총 ${templates.length}개 템플릿 검증 중...\n`);

  // 각 템플릿 검증
  const results = await Promise.all(
    templates.map(async (template, index) => {
      const result = await validateTemplate(template);
      return {
        index: index + 1,
        template,
        result,
      };
    })
  );

  // 결과 집계
  const successCount = results.filter((r) => r.result.success).length;
  const failureCount = results.filter((r) => !r.result.success).length;
  const warningCount = results.filter(
    (r) => r.result.warnings && r.result.warnings.length > 0
  ).length;

  // 결과 출력
  console.log("=".repeat(60));
  console.log("📈 검증 결과 요약");
  console.log("=".repeat(60));
  console.log(`전체: ${templates.length}개`);
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failureCount}개`);
  console.log(`⚠️  경고: ${warningCount}개`);
  console.log("=".repeat(60));
  console.log();

  // 실패한 템플릿 상세 출력
  const failures = results.filter((r) => !r.result.success);
  if (failures.length > 0) {
    console.log("❌ 실패한 템플릿:");
    console.log("-".repeat(60));
    failures.forEach(({ index, template, result }) => {
      console.log(`\n[${index}] ${template.name} (${template.bodyPartName})`);
      result.errors.forEach((error) => {
        console.log(`   ❌ ${error}`);
      });
      if (result.warnings) {
        result.warnings.forEach((warning) => {
          console.log(`   ⚠️  ${warning}`);
        });
      }
    });
    console.log();
  }

  // 경고만 있는 템플릿 출력
  const warningsOnly = results.filter(
    (r) => r.result.success && r.result.warnings && r.result.warnings.length > 0
  );
  if (warningsOnly.length > 0) {
    console.log("⚠️  경고가 있는 템플릿:");
    console.log("-".repeat(60));
    warningsOnly.forEach(({ index, template, result }) => {
      console.log(`\n[${index}] ${template.name} (${template.bodyPartName})`);
      result.warnings?.forEach((warning) => {
        console.log(`   ⚠️  ${warning}`);
      });
    });
    console.log();
  }

  // 종료 코드
  if (failureCount > 0) {
    console.log("❌ 검증 실패. 위의 오류를 수정해주세요.");
    process.exit(1);
  } else {
    console.log("✅ 모든 템플릿 검증 통과!");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("❌ 예상치 못한 오류:", error);
  process.exit(1);
});

