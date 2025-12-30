/**
 * Clerk 한국어 로컬라이제이션 설정
 *
 * @fileoverview
 * Clerk 컴포넌트의 한국어 로컬라이제이션을 관리하는 파일입니다.
 * 
 * 기본 한국어 로컬라이제이션을 사용하거나, 커스텀 메시지를 추가할 수 있습니다.
 * 
 * @see {@link https://clerk.com/docs/guides/customizing-clerk/localization Clerk Localization Guide}
 */

import { koKR } from "@clerk/localizations";

/**
 * 기본 한국어 로컬라이제이션
 * 
 * @clerk/localizations 패키지에서 제공하는 기본 한국어 번역을 사용합니다.
 */
export const defaultKoreanLocalization = koKR;

/**
 * 커스텀 한국어 로컬라이제이션
 * 
 * 기본 한국어 로컬라이제이션을 확장하여 커스텀 메시지를 추가할 수 있습니다.
 * 
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { customKoreanLocalization } from '@/lib/clerk/localization';
 * 
 * <ClerkProvider localization={customKoreanLocalization}>
 *   {/* ... *\/}
 * </ClerkProvider>
 * ```
 */
export const customKoreanLocalization = {
  ...koKR,
  // 커스텀 에러 메시지 추가 예시
  unstable__errors: {
    ...koKR.unstable__errors,
    // 접근이 허용되지 않은 이메일 도메인에 대한 커스텀 메시지
    // not_allowed_access: '접근이 허용되지 않은 이메일 도메인입니다. 관리자에게 문의하세요.',
  },
  // 다른 커스텀 메시지를 여기에 추가할 수 있습니다
  // 예: formFieldLabel__emailAddress: '이메일 주소',
} as typeof koKR;

/**
 * 현재 사용 중인 로컬라이제이션
 * 
 * 기본 한국어 로컬라이제이션을 사용하려면 `defaultKoreanLocalization`을,
 * 커스텀 메시지를 사용하려면 `customKoreanLocalization`을 사용하세요.
 */
export const currentLocalization = defaultKoreanLocalization;

