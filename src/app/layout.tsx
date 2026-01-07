import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";

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
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="ko" className="dark" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ClientProviders>
            <MainLayout>{children}</MainLayout>
          </ClientProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}
