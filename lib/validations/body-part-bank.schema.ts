import { z } from "zod";
import type { 
  BodyPartExerciseMappingInput, 
  BodyPartContraindicationInput,
  BodyPartBankInput 
} from "@/types/body-part-bank";

/**
 * 부위별 추천 운동 매핑 Zod 스키마
 */
export const bodyPartExerciseMappingSchema = z.object({
  bodyPartName: z
    .string()
    .min(1, "부위 이름은 필수입니다.")
    .max(50, "부위 이름은 50자 이하여야 합니다."),
  
  exerciseTemplateName: z
    .string()
    .min(1, "운동 템플릿 이름은 필수입니다.")
    .max(200, "운동 템플릿 이름은 200자 이하여야 합니다."),
  
  priority: z
    .number()
    .int("우선순위는 정수여야 합니다.")
    .positive("우선순위는 0보다 큰 값이어야 합니다."),
  
  intensity_level: z
    .number()
    .int("강도 레벨은 정수여야 합니다.")
    .min(1, "강도 레벨은 1 이상이어야 합니다.")
    .max(4, "강도 레벨은 4 이하여야 합니다.")
    .optional(),
  
  pain_level_range: z
    .string()
    .regex(/^(\d-\d|\d|all)$/, "통증 정도 범위 형식이 올바르지 않습니다. (예: '1-2', '3-4', '5', 'all')")
    .optional(),
  
  is_active: z
    .boolean()
    .optional()
    .default(true),
}) satisfies z.ZodType<BodyPartExerciseMappingInput>;

/**
 * 부위별 금기 운동 Zod 스키마
 */
export const bodyPartContraindicationSchema = z.object({
  bodyPartName: z
    .string()
    .min(1, "부위 이름은 필수입니다.")
    .max(50, "부위 이름은 50자 이하여야 합니다."),
  
  exerciseTemplateName: z
    .string()
    .min(1, "운동 템플릿 이름은 필수입니다.")
    .max(200, "운동 템플릿 이름은 200자 이하여야 합니다."),
  
  pain_level_min: z
    .number()
    .int("통증 정도는 정수여야 합니다.")
    .min(1, "통증 정도는 1 이상이어야 합니다.")
    .max(5, "통증 정도는 5 이하여야 합니다.")
    .optional(),
  
  reason: z
    .string()
    .max(1000, "금기 사유는 1000자 이하여야 합니다.")
    .optional(),
  
  severity: z
    .enum(['warning', 'strict'], {
      errorMap: () => ({ message: "심각도는 'warning' 또는 'strict'만 허용됩니다." })
    })
    .optional()
    .default('warning'),
  
  is_active: z
    .boolean()
    .optional()
    .default(true),
}) satisfies z.ZodType<BodyPartContraindicationInput>;

/**
 * 부위 Bank 전체 Zod 스키마
 */
export const bodyPartBankSchema = z.object({
  bodyPartName: z
    .string()
    .min(1, "부위 이름은 필수입니다.")
    .max(50, "부위 이름은 50자 이하여야 합니다."),
  
  recommended: z
    .array(bodyPartExerciseMappingSchema)
    .min(0, "추천 운동 목록은 배열이어야 합니다."),
  
  contraindications: z
    .array(bodyPartContraindicationSchema)
    .min(0, "금기 운동 목록은 배열이어야 합니다."),
}) satisfies z.ZodType<BodyPartBankInput>;

