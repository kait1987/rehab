import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { MainLayout } from "@/components/layout/main-layout";
import { ClientProviders } from "@/components/providers/client-providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "REHAB",
  description: "동네 기반 재활 헬스장 추천 & 맞춤형 재활 코스 생성 서비스",
  // 📱 Phase 4: PWA 메타데이터
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "REHAB",
  },
  formatDetection: {
    telephone: false,
  },
};

// 📱 Phase 3: viewport-fit=cover 추가 (노치 대응)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#ef5b5b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark" suppressHydrationWarning>
      <head>
        {/* 📱 Phase 4: Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>
          <MainLayout>{children}</MainLayout>
        </ClientProviders>
        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}


