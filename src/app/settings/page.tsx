"use client";

import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, ArrowLeft, Bell, Moon, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <main className="min-h-[calc(100vh-80px)] container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-80px)] container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 뒤로가기 */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={1.5} />
          뒤로가기
        </Button>

        {/* 설정 헤더 */}
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6" strokeWidth={1.5} />
          <h1 className="text-2xl font-semibold">설정</h1>
        </div>

        {/* 테마 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Moon className="w-5 h-5" strokeWidth={1.5} />
              테마
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">다크모드/라이트모드 전환</p>
              <ThemeSwitcher />
            </div>
          </CardContent>
        </Card>

        {/* 알림 설정 (추후 구현) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5" strokeWidth={1.5} />
              알림
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              알림 설정은 추후 업데이트 예정입니다.
            </p>
          </CardContent>
        </Card>

        {/* 언어 설정 (추후 구현) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5" strokeWidth={1.5} />
              언어
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              현재 한국어만 지원됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
