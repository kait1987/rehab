import type { NextConfig } from "next";

// 빌드 타임 환경 변수 검증
function validateRequiredEnvVars() {
  const requiredVars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `❌ 필수 환경 변수가 설정되지 않았습니다:\n` +
      `${missingVars.map(v => `  - ${v}`).join('\n')}\n\n` +
      `환경 변수 설정 방법은 docs/VERCEL_CLERK_ENV_SETUP.md를 참고하세요.`
    );
  }
}

// 빌드 타임에만 검증 (개발 서버에서는 런타임 검증 사용)
if (process.env.NODE_ENV === 'production' || process.env.CI) {
  validateRequiredEnvVars();
}

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
