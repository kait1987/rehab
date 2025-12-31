import { MetadataRoute } from "next";

/**
 * manifest.ts
 * 
 * PWA 매니페스트를 생성합니다.
 * Next.js 15 App Router에서 자동으로 /manifest.json 경로로 제공됩니다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "REHAB",
    short_name: "REHAB",
    description: "동네 기반 재활 헬스장 추천 & 맞춤형 재활 코스 생성 서비스",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-256x256.png",
        sizes: "256x256",
        type: "image/png",
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["health", "fitness"],
  };
}

