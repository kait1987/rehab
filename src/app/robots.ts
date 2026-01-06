import { MetadataRoute } from "next";

/**
 * robots.ts
 * 
 * 검색 엔진 크롤러 규칙을 정의합니다.
 * Next.js 15 App Router에서 자동으로 /robots.txt 경로로 제공됩니다.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth-test/",
          "/instruments/",
          "/storage-test/",
          "/checkout/",
          "/payment/",
          "/my/",
          "/cart/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

