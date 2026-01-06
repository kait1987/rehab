import { z } from "zod";
import type { MergeRequest, BodyPartSelection } from "@/types/body-part-merge";

/**
 * 부위 선택 Zod 스키마
 */
const bodyPartSelectionSchema = z.object({
  bodyPartId: z.string().uuid("부위 ID는 유효한 UUID여야 합니다."),
  bodyPartName: z
    .string()
    .min(1, "부위 이름은 필수입니다.")
    .max(50, "부위 이름은 50자 이하여야 합니다."),
  painLevel: z
    .number()
    .int("통증 정도는 정수여야 합니다.")
    .min(1, "통증 정도는 1 이상이어야 합니다.")
    .max(5, "통증 정도는 5 이하여야 합니다."),
  selectionOrder: z
    .number()
    .int("선택 순서는 정수여야 합니다.")
    .positive("선택 순서는 0보다 큰 값이어야 합니다.")
    .optional(),
}) satisfies z.ZodType<BodyPartSelection>;

/**
 * 병합 요청 Zod 스키마
 */
export const mergeRequestSchema = z.object({
  bodyParts: z
    .array(bodyPartSelectionSchema)
    .min(1, "최소 1개 이상의 부위를 선택해야 합니다.")
    .max(5, "최대 5개까지 부위를 선택할 수 있습니다."),
  painLevel: z
    .number()
    .int("통증 정도는 정수여야 합니다.")
    .min(1, "통증 정도는 1 이상이어야 합니다.")
    .max(5, "통증 정도는 5 이하여야 합니다."),
  equipmentAvailable: z
    .array(z.string().min(1).max(50))
    .min(0, "기구 목록은 배열이어야 합니다."),
  experienceLevel: z
    .string()
    .max(20, "경험 수준은 20자 이하여야 합니다.")
    .optional(),
  totalDurationMinutes: z
    .union([z.literal(60), z.literal(90), z.literal(120)])
    .optional()
    .refine((val) => val === undefined || [60, 90, 120].includes(val), {
      message: "총 운동 시간은 60, 90, 120분 중 하나여야 합니다.",
    }),
}) satisfies z.ZodType<MergeRequest>;
