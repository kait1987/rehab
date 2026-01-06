import { z } from "zod";
import type { ExerciseTemplateInput } from "@/types/exercise-template";

/**
 * 운동 템플릿 Zod 스키마
 * 
 * ExerciseTemplateInput 타입을 기반으로 한 검증 스키마입니다.
 */

/**
 * 강도 레벨 검증 (1-4)
 */
const intensityLevelSchema = z
  .number()
  .int("강도 레벨은 정수여야 합니다.")
  .min(1, "강도 레벨은 1 이상이어야 합니다.")
  .max(4, "강도 레벨은 4 이하여야 합니다.")
  .optional();

/**
 * 난이도 점수 검증 (1-10)
 */
const difficultyScoreSchema = z
  .number()
  .int("난이도 점수는 정수여야 합니다.")
  .min(1, "난이도 점수는 1 이상이어야 합니다.")
  .max(10, "난이도 점수는 10 이하여야 합니다.")
  .optional();

/**
 * 양수 정수 검증 (duration_minutes, reps, sets, rest_seconds용)
 */
const positiveIntSchema = z
  .number()
  .int("정수여야 합니다.")
  .positive("0보다 큰 값이어야 합니다.")
  .optional();

/**
 * 운동 템플릿 입력 스키마
 */
export const exerciseTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "운동 이름은 필수입니다.")
    .max(200, "운동 이름은 200자 이하여야 합니다."),
  
  bodyPartName: z
    .string()
    .min(1, "부위 이름은 필수입니다.")
    .max(50, "부위 이름은 50자 이하여야 합니다."),
  
  description: z
    .string()
    .max(1000, "설명은 1000자 이하여야 합니다.")
    .optional(),
  
  intensity_level: intensityLevelSchema,
  
  duration_minutes: positiveIntSchema,
  
  reps: positiveIntSchema,
  
  sets: positiveIntSchema,
  
  rest_seconds: positiveIntSchema,
  
  difficulty_score: difficultyScoreSchema,
  
  contraindications: z
    .array(z.string().min(1).max(200))
    .optional()
    .default([]),
  
  instructions: z
    .string()
    .max(2000, "지시사항은 2000자 이하여야 합니다.")
    .optional(),
  
  precautions: z
    .string()
    .max(2000, "주의사항은 2000자 이하여야 합니다.")
    .optional(),
  
  equipmentTypes: z
    .array(z.string().min(1).max(50))
    .optional()
    .default([]),
}) satisfies z.ZodType<ExerciseTemplateInput>;

/**
 * 스키마에서 TypeScript 타입 추출
 */
export type ExerciseTemplateInputSchema = z.infer<typeof exerciseTemplateSchema>;

