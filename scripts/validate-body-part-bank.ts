#!/usr/bin/env tsx
/**
 * 부위 Bank 검증 스크립트
 * 
 * templates/body-part-bank-30.json 파일을 읽어
 * 검증을 수행합니다.
 * 
 * 사용법:
 *   pnpm tsx scripts/validate-body-part-bank.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { validateBodyPartBank } from "@/lib/validations/validate-body-part-bank";
import type { BodyPartBankInput } from "@/types/body-part-bank";

const BANK_FILE = join(process.cwd(), "templates", "body-part-bank-30.json");

async function main() {
  console.log("🔍 부위 Bank 데이터 검증 시작...\n");

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

  console.log(`📊 총 ${banks.length}개 부위 Bank 검증 중...\n`);

  // 검증 수행
  const result = await validateBodyPartBank(banks);

  // 결과 출력
  console.log("=".repeat(50));
  console.log("📊 검증 결과");
  console.log("=".repeat(50));
  console.log(`전체: ${banks.length}개`);
  console.log(`성공: ${result.success ? banks.length : banks.length - result.errors.length}개`);
  console.log(`실패: ${result.errors.length}개`);

  if (result.warnings && result.warnings.length > 0) {
    console.log(`경고: ${result.warnings.length}개`);
  }

  if (result.errors.length > 0) {
    console.log("\n❌ 에러 목록:");
    result.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  if (result.warnings && result.warnings.length > 0) {
    console.log("\n⚠️  경고 목록:");
    result.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }

  if (result.success) {
    console.log("\n✅ 모든 검증 통과!");
    process.exit(0);
  } else {
    console.log("\n❌ 검증 실패");
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("❌ 에러 발생:", error);
    process.exit(1);
  })
  .finally(async () => {
    // Prisma 클라이언트가 사용되었다면 disconnect
    const { prisma } = await import("@/lib/prisma/client");
    await prisma.$disconnect();
  });

