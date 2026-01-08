/**
 * @file page.tsx
 * @description 로그인 페이지
 *
 * Clerk의 SignIn 컴포넌트를 사용하여 로그인 페이지를 제공합니다.
 *
 * 주요 기능:
 * - Clerk 인증을 통한 로그인
 * - 로그인 성공 시 /rehab으로 리다이렉트
 * - 회원가입 페이지로 이동 링크 제공
 *
 * @dependencies
 * - @clerk/nextjs: SignIn 컴포넌트
 */

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: 'oklch(0.62 0.10 35)', // 테라코타 색상
            colorText: 'oklch(0.98 0 0)', // 흰색 텍스트
            colorBackground: 'oklch(0.18 0.015 60)', // 어두운 크림 베이지 배경
          },
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg',
          },
        }}
        routing="path"
        path="/sign-in"
        redirectUrl="/rehab"
        signUpUrl="/sign-up"
      />
    </div>
  );
}

