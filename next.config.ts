import type { NextConfig } from "next";

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
