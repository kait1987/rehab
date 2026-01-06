/**
 * @file operating-hours.schema.ts
 * @description 운영시간 데이터 검증 스키마 (Phase 2 업데이트)
 * 
 * Zod를 사용하여 운영시간 데이터의 유효성을 검증합니다.
 * 
 * 타입 변경 반영:
 * - openTime, closeTime: string | null
 */

import { z } from 'zod';
import { TIME_FORMAT_REGEX } from '@/lib/constants/operating-hours';

/**
 * 요일 검증 스키마 (0-6)
 */
export const dayOfWeekSchema = z.number().int().min(0).max(6);

/**
 * 시간 형식 검증 스키마 (HH:mm)
 */
export const timeStringSchema = z
  .string()
  .regex(TIME_FORMAT_REGEX, {
    message: '시간 형식이 올바르지 않습니다. HH:mm 형식이어야 합니다. (예: 09:00, 22:30)',
  });

/**
 * 운영시간 입력 데이터 검증 스키마
 */
export const operatingHoursInputSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  openTime: timeStringSchema.nullable().optional(),
  closeTime: timeStringSchema.nullable().optional(),
  isClosed: z.boolean().optional().default(false),
  notes: z.string().nullable().optional(),
});

/**
 * 운영시간 검증 스키마
 */
export const operatingHoursSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  openTime: timeStringSchema.nullable(),
  closeTime: timeStringSchema.nullable(),
  isClosed: z.boolean(),
  notes: z.string().nullable().optional(),
});

/**
 * 운영시간 배열 검증 스키마
 */
export const operatingHoursArraySchema = z.array(operatingHoursSchema);

/**
 * 운영시간 입력 데이터 검증
 * 
 * @param data 검증할 데이터
 * @returns 검증 결과
 */
export function validateOperatingHoursInput(data: unknown) {
  return operatingHoursInputSchema.safeParse(data);
}

/**
 * 운영시간 검증
 * 
 * @param data 검증할 데이터
 * @returns 검증 결과
 */
export function validateOperatingHours(data: unknown) {
  return operatingHoursSchema.safeParse(data);
}

/**
 * 운영시간 배열 검증
 * 
 * @param data 검증할 데이터
 * @returns 검증 결과
 */
export function validateOperatingHoursArray(data: unknown) {
  return operatingHoursArraySchema.safeParse(data);
}
