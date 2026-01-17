"use client";

import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { PainCheckModal } from "@/components/pain-check-modal";
import { Suspense } from "react";

function HomePageContent() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터에서 초기값 파싱
  const restartMode = searchParams.get("restart") === "true";
  const bodyPartsParam = searchParams.get("bodyParts");
  const painLevelParam = searchParams.get("painLevel");

  const initialValues = restartMode
    ? {
        bodyPartNames: bodyPartsParam ? bodyPartsParam.split(",") : undefined,
        painLevel: painLevelParam ? parseInt(painLevelParam) : undefined,
      }
    : undefined;

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                REHAB
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                개인 맞춤형 재활 운동 추천 시스템
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              {isLoaded &&
                !isSignedIn &&
                process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH !== "true" && (
                  <>
                    <Button
                      size="lg"
                      className="rounded-xl"
                      onClick={() => router.push("/sign-up")}
                    >
                      시작하기
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="rounded-xl"
                      onClick={() => router.push("/sign-in")}
                    >
                      로그인
                    </Button>
                  </>
                )}
              {isLoaded &&
                (isSignedIn ||
                  process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === "true") && (
                  <PainCheckModal
                    initialValues={initialValues}
                    defaultOpen={restartMode}
                  >
                    <Button
                      type="button"
                      size="lg"
                      className="rounded-xl"
                      data-testid="home-start-rehab"
                    >
                      내 몸 상태로 재활 코스 만들기
                    </Button>
                  </PainCheckModal>
                )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="p-4 bg-primary/10 rounded-lg">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold">개인 맞춤 추천</h3>
              <p className="text-gray-500 dark:text-gray-400">
                당신의 상태에 맞는 재활 운동을 추천합니다
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="p-4 bg-primary/10 rounded-lg">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold">쉽고 빠른 시작</h3>
              <p className="text-gray-500 dark:text-gray-400">
                간단한 설정으로 바로 시작할 수 있습니다
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="p-4 bg-primary/10 rounded-lg">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold">진행도 추적</h3>
              <p className="text-gray-500 dark:text-gray-400">
                운동 기록을 통해 회복 과정을 확인하세요
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center">
          Loading...
        </main>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
