import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// 빌드 타임 환경 변수 검증 (경고만 출력, 에러는 던지지 않음)
function validateEnvVars() {
  if (process.env.NODE_ENV === "production") {
    // Production 빌드 시에만 경고 출력
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      console.warn("⚠️  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set");
      console.warn(
        "   환경 변수 설정 방법은 docs/VERCEL_CLERK_ENV_SETUP.md를 참고하세요.",
      );
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

  // 🔥 여기에 환경 변수 명시적 추가
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "",
  },
};

// Sentry 설정 옵션
const sentryBuildOptions = {
  // 소스맵 업로드 설정 (SENTRY_AUTH_TOKEN 필요)
  silent: !process.env.SENTRY_AUTH_TOKEN,
  
  // 소스맵 삭제 (배포 후 보안)
  hideSourceMaps: true,
  
  // 빌드 시간 단축을 위해 소스맵 업로드 비활성화 (선택)
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  
  // 자동 계측
  automaticVercelMonitors: true,
};

export default withSentryConfig(nextConfig, sentryBuildOptions);

