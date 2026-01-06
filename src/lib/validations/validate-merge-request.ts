import { mergeRequestSchema } from "./merge-request.schema";
import type { MergeRequest } from "@/types/body-part-merge";
import type { ValidationResult } from "@/types/body-part-bank";
import { prisma } from "@/lib/prisma/client";

/**
 * 병합 요청 검증 함수
 * 
 * Zod 스키마 검증과 데이터베이스 제약조건 검증을 수행합니다.
 * 
 * @param input 검증할 병합 요청
 * @returns 검증 결과
 */
export async function validateMergeRequest(
  input: MergeRequest
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Zod 스키마 검증
  const schemaResult = mergeRequestSchema.safeParse(input);

  if (!schemaResult.success) {
    schemaResult.error.issues.forEach((err) => {
      errors.push(`${err.path.join(".")}: ${err.message}`);
    });
    return {
      success: false,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  const validated = schemaResult.data;

  // 2. 데이터베이스 제약조건 검증
  // body_parts 존재 여부 확인
  const bodyPartIds = validated.bodyParts.map((bp) => bp.bodyPartId);
  const bodyParts = await prisma.bodyPart.findMany({
    where: { id: { in: bodyPartIds } },
  });

  const foundBodyPartIds = new Set(bodyParts.map((bp) => bp.id));
  const missingBodyPartIds = bodyPartIds.filter(
    (id) => !foundBodyPartIds.has(id)
  );

  if (missingBodyPartIds.length > 0) {
    errors.push(
      `다음 부위 ID가 데이터베이스에 존재하지 않습니다: ${missingBodyPartIds.join(", ")}`
    );
  }

  // bodyPartName과 bodyPartId 일치 확인
  for (const bodyPartSelection of validated.bodyParts) {
    const bodyPart = bodyParts.find((bp) => bp.id === bodyPartSelection.bodyPartId);
    if (bodyPart && bodyPart.name !== bodyPartSelection.bodyPartName) {
      warnings.push(
        `부위 ID ${bodyPartSelection.bodyPartId}의 이름이 일치하지 않습니다. (입력: ${bodyPartSelection.bodyPartName}, DB: ${bodyPart.name})`
      );
    }
  }

  // equipment_types 존재 여부 확인 (선택적)
  if (validated.equipmentAvailable.length > 0) {
    const equipmentTypes = await prisma.equipmentType.findMany({
      where: { name: { in: validated.equipmentAvailable } },
    });

    const foundEquipmentNames = new Set(equipmentTypes.map((et) => et.name));
    const missingEquipmentNames = validated.equipmentAvailable.filter(
      (name) => !foundEquipmentNames.has(name)
    );

    if (missingEquipmentNames.length > 0) {
      warnings.push(
        `다음 기구가 데이터베이스에 존재하지 않습니다: ${missingEquipmentNames.join(", ")}`
      );
    }
  }

  // 3. 비즈니스 로직 검증
  // bodyParts 중복 확인
  const uniqueBodyPartIds = new Set(bodyPartIds);
  if (bodyPartIds.length !== uniqueBodyPartIds.size) {
    errors.push("중복된 부위가 선택되었습니다.");
  }

  // painLevel 범위 확인
  if (
    validated.painLevel < Math.min(...validated.bodyParts.map((bp) => bp.painLevel)) ||
    validated.painLevel > Math.max(...validated.bodyParts.map((bp) => bp.painLevel))
  ) {
    warnings.push(
      "전체 통증 정도가 선택된 부위의 통증 정도 범위를 벗어납니다."
    );
  }

  return {
    success: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

