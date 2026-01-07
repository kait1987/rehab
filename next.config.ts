import type { NextConfig } from "next";

// 빌드 타임 환경 변수 검증 (경고만 출력, 에러는 던지지 않음)
function validateEnvVars() {
  if (process.env.NODE_ENV === 'production') {
    // Production 빌드 시에만 경고 출력
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      console.warn('⚠️  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set');
      console.warn('   환경 변수 설정 방법은 docs/VERCEL_CLERK_ENV_SETUP.md를 참고하세요.');
    }
  }
}

validateEnvVars();

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 빌드 시 ESLint 에러를 무시 (프로덕션 배포를 위해)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 빌드 시 TypeScript 에러를 무시하지 않음 (타입 안정성 유지)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
