import { z } from "zod";
import { exerciseTemplateSchema } from "./exercise-template.schema";
import type { ExerciseTemplateInput, ValidationResult } from "@/types/exercise-template";
import { prisma } from "@/lib/prisma/client";

/**
 * 템플릿 검증 함수
 * 
 * Zod 스키마 검증과 데이터베이스 제약조건 검증을 수행합니다.
 * 
 * @param input 검증할 템플릿 입력 데이터
 * @returns 검증 결과
 */
export async function validateTemplate(
  input: ExerciseTemplateInput
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Zod 스키마 검증
  const schemaResult = exerciseTemplateSchema.safeParse(input);
  
  if (!schemaResult.success) {
    schemaResult.error.issues.forEach((err) => {
      errors.push(`${err.path.join(".")}: ${err.message}`);
    });
    return { success: false, errors, warnings };
  }

  const validated = schemaResult.data;

  // 2. 데이터베이스 제약조건 검증
  // body_part 존재 여부 확인
  const bodyPart = await prisma.bodyPart.findUnique({
    where: { name: validated.bodyPartName },
  });

  if (!bodyPart) {
    errors.push(`부위 '${validated.bodyPartName}'가 데이터베이스에 존재하지 않습니다.`);
  }

  // equipment_types 존재 여부 확인
  if (validated.equipmentTypes && validated.equipmentTypes.length > 0) {
    const equipmentTypes = await prisma.equipmentType.findMany({
      where: {
        name: { in: validated.equipmentTypes },
      },
    });

    const foundNames = new Set(equipmentTypes.map((et) => et.name));
    const missingNames = validated.equipmentTypes.filter(
      (name) => !foundNames.has(name)
    );

    if (missingNames.length > 0) {
      errors.push(
        `다음 기구가 데이터베이스에 존재하지 않습니다: ${missingNames.join(", ")}`
      );
    }
  }

  // 3. 비즈니스 로직 검증
  // intensity_level 범위 확인 (Zod에서 이미 검증되지만 명시적으로)
  if (
    validated.intensity_level !== undefined &&
    (validated.intensity_level < 1 || validated.intensity_level > 4)
  ) {
    errors.push("강도 레벨은 1-4 범위여야 합니다.");
  }

  // difficulty_score 범위 확인
  if (
    validated.difficulty_score !== undefined &&
    (validated.difficulty_score < 1 || validated.difficulty_score > 10)
  ) {
    errors.push("난이도 점수는 1-10 범위여야 합니다.");
  }

  // 양수 검증 (Zod에서 이미 검증되지만 명시적으로)
  if (
    validated.duration_minutes !== undefined &&
    validated.duration_minutes <= 0
  ) {
    errors.push("운동 시간은 0보다 큰 값이어야 합니다.");
  }

  if (validated.reps !== undefined && validated.reps <= 0) {
    errors.push("반복 횟수는 0보다 큰 값이어야 합니다.");
  }

  if (validated.sets !== undefined && validated.sets <= 0) {
    errors.push("세트 수는 0보다 큰 값이어야 합니다.");
  }

  if (validated.rest_seconds !== undefined && validated.rest_seconds <= 0) {
    errors.push("휴식 시간은 0보다 큰 값이어야 합니다.");
  }

  // 4. 중복 검증 (동일한 name + bodyPartName 조합)
  if (bodyPart) {
    const existing = await prisma.exerciseTemplate.findFirst({
      where: {
        name: validated.name,
        bodyPartId: bodyPart.id,
      },
    });

    if (existing) {
      warnings.push(
        `동일한 이름과 부위 조합이 이미 존재합니다: ${validated.name} (${validated.bodyPartName})`
      );
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

