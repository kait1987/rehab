/**
 * @file page.tsx
 * @description 회원가입 페이지
 *
 * Clerk의 SignUp 컴포넌트를 사용하여 회원가입 페이지를 제공합니다.
 *
 * 주요 기능:
 * - Clerk 인증을 통한 회원가입
 * - 회원가입 성공 시 /rehab으로 리다이렉트
 * - 로그인 페이지로 이동 링크 제공
 *
 * @dependencies
 * - @clerk/nextjs: SignUp 컴포넌트
 */

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
      <SignUp
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
        path="/sign-up"
        redirectUrl="/rehab"
        signInUrl="/sign-in"
      />
    </div>
  );
}

