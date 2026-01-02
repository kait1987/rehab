import { bodyPartBankSchema } from "./body-part-bank.schema";
import type { BodyPartBankInput, ValidationResult } from "@/types/body-part-bank";
import { prisma } from "@/lib/prisma/client";

/**
 * 부위 Bank 데이터 검증 함수
 * 
 * Zod 스키마 검증과 데이터베이스 제약조건 검증을 수행합니다.
 * 
 * @param input 검증할 부위 Bank 입력 데이터 배열
 * @returns 검증 결과
 */
export async function validateBodyPartBank(
  input: BodyPartBankInput[]
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Zod 스키마 검증
  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    const schemaResult = bodyPartBankSchema.safeParse(item);
    
    if (!schemaResult.success) {
      schemaResult.error.issues.forEach((err) => {
        errors.push(
          `[${i}] ${item.bodyPartName}: ${err.path.join(".")} - ${err.message}`,
        );
      });
      continue;
    }

    // 2. 데이터베이스 제약조건 검증
    // body_part 존재 여부 확인
    const bodyPart = await prisma.bodyPart.findUnique({
      where: { name: item.bodyPartName },
    });

    if (!bodyPart) {
      errors.push(`[${i}] 부위 '${item.bodyPartName}'가 데이터베이스에 존재하지 않습니다.`);
    }

    // exercise_templates 존재 여부 확인 (recommended)
    for (const rec of item.recommended) {
      const template = await prisma.exerciseTemplate.findFirst({
        where: { name: rec.exerciseTemplateName },
      });

      if (!template) {
        errors.push(`[${i}] 추천 운동 '${rec.exerciseTemplateName}'가 데이터베이스에 존재하지 않습니다.`);
      }
    }

    // exercise_templates 존재 여부 확인 (contraindications)
    for (const contra of item.contraindications) {
      const template = await prisma.exerciseTemplate.findFirst({
        where: { name: contra.exerciseTemplateName },
      });

      if (!template) {
        errors.push(`[${i}] 금기 운동 '${contra.exerciseTemplateName}'가 데이터베이스에 존재하지 않습니다.`);
      }
    }

    // 3. 비즈니스 로직 검증
    // priority 중복 체크 (같은 부위 내에서)
    const priorities = item.recommended.map(r => r.priority);
    const uniquePriorities = new Set(priorities);
    if (priorities.length !== uniquePriorities.size) {
      warnings.push(`[${i}] 부위 '${item.bodyPartName}'의 추천 운동에서 priority 중복이 있습니다.`);
    }

    // pain_level_range 형식 검증 (Zod에서 이미 검증되지만 명시적으로)
    for (const rec of item.recommended) {
      if (rec.pain_level_range && !/^(\d-\d|\d|all)$/.test(rec.pain_level_range)) {
        errors.push(`[${i}] 추천 운동 '${rec.exerciseTemplateName}'의 pain_level_range 형식이 올바르지 않습니다.`);
      }
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

