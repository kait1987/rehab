/**
 * @file page.tsx
 * @description 헬스장 상세 페이지 (임시)
 * 
 * 향후 구현 예정:
 * - 헬스장 기본 정보 상세 표시
 * - 시설 정보
 * - 운영시간 전체 표시
 * - 리뷰 목록
 * - 즐겨찾기 기능
 */

import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface GymDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function GymDetailPage({ params }: GymDetailPageProps) {
  const { id } = await params;

  // 임시: ID가 없으면 404
  if (!id) {
    notFound();
  }

  return (
    <main className="min-h-[calc(100vh-80px)] container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        {/* 뒤로가기 버튼 */}
        <Link href="/gyms">
          <Button
            variant="ghost"
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" strokeWidth={1.5} />
            목록으로 돌아가기
          </Button>
        </Link>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-foreground mb-2">
            헬스장 상세 정보
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            ID: {id}
          </p>
        </div>

        {/* 임시 콘텐츠 */}
        <Card className="p-8 text-center">
          <p className="text-muted-foreground text-lg mb-4">
            헬스장 상세 페이지는 준비 중입니다.
          </p>
          <p className="text-sm text-muted-foreground/80">
            곧 상세 정보, 시설 정보, 리뷰 등을 확인할 수 있습니다.
          </p>
        </Card>
      </div>
    </main>
  );
}

