import { z } from "zod";

/**
 * 공통 Zod 검증 스키마
 * 
 * 프로젝트 전반에서 재사용 가능한 검증 스키마를 정의합니다.
 */

/**
 * 전화번호 검증 스키마
 * 
 * 한국 전화번호 형식: 010-1234-5678, 01012345678 등
 */
export const phoneSchema = z
  .string()
  .min(10, "전화번호를 올바르게 입력해주세요.")
  .max(15, "전화번호는 15자 이하로 입력해주세요.")
  .regex(/^[0-9-]+$/, "전화번호는 숫자와 하이픈(-)만 입력 가능합니다.")
  .refine(
    (val) => {
      // 하이픈 제거 후 숫자만 남은 길이 확인
      const digitsOnly = val.replace(/-/g, "");
      return digitsOnly.length >= 10 && digitsOnly.length <= 11;
    },
    {
      message: "전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)",
    }
  );

/**
 * 이메일 검증 스키마
 */
export const emailSchema = z
  .string()
  .min(1, "이메일을 입력해주세요.")
  .email("올바른 이메일 형식이 아닙니다.");

/**
 * 이름 검증 스키마
 * 
 * 한글, 영문, 공백 허용
 */
export const nameSchema = z
  .string()
  .min(2, "이름은 2자 이상 입력해주세요.")
  .max(50, "이름은 50자 이하로 입력해주세요.")
  .regex(/^[가-힣a-zA-Z\s]+$/, "이름은 한글 또는 영문만 입력 가능합니다.");

/**
 * 주소 검증 스키마
 */
export const addressSchema = z
  .string()
  .min(10, "배송 주소를 상세히 입력해주세요.")
  .max(200, "배송 주소는 200자 이하로 입력해주세요.");

/**
 * 배송 정보 검증 스키마
 * 
 * 주문 시 사용하는 배송 정보 스키마
 */
export const shippingInfoSchema = z.object({
  shippingName: nameSchema,
  shippingPhone: phoneSchema,
  shippingAddress: addressSchema,
});

/**
 * 주문 메모 검증 스키마 (선택사항)
 */
export const orderNoteSchema = z
  .string()
  .max(500, "주문 메모는 500자 이하로 입력해주세요.")
  .optional();

/**
 * 수량 검증 스키마
 * 
 * 양수 정수만 허용
 */
export const quantitySchema = z
  .number()
  .int("수량은 정수여야 합니다.")
  .min(1, "수량은 1개 이상이어야 합니다.")
  .max(999, "수량은 999개 이하로 입력해주세요.");

/**
 * 가격 검증 스키마
 * 
 * 양수만 허용
 */
export const priceSchema = z
  .number()
  .positive("가격은 양수여야 합니다.")
  .max(99999999, "가격은 99,999,999원 이하로 입력해주세요.");

/**
 * UUID 검증 스키마
 */
export const uuidSchema = z.string().uuid("올바른 ID 형식이 아닙니다.");

/**
 * 날짜 검증 스키마 (ISO 8601)
 */
export const dateSchema = z.string().datetime("올바른 날짜 형식이 아닙니다.");

