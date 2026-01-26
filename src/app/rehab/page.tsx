/**
 * @file page.tsx
 * @description 재활 코스 결과 페이지
 *
 * 생성된 재활 코스를 섹션별로 표시하고, 코스 저장 및 헬스장 찾기 기능을 제공합니다.
 *
 * 주요 기능:
 * - 준비/메인/마무리 섹션별 운동 표시
 * - 코스 저장 기능
 * - 근처 헬스장 찾기 버튼
 * - 세션 플레이어 모드 (전체 운동 연속 실행)
 * - 의료행위 아님 안내 문구
 *
 * @dependencies
 * - @/components/course-exercise-card: 운동 카드 컴포넌트
 * - @/components/session-player: 세션 플레이어 컴포넌트
 * - @/types/body-part-merge: MergedExercise 타입
 */

"use client";

import { CourseExerciseCard } from "@/components/course-exercise-card";
import { ExerciseTimerModal } from "@/components/exercise-timer-modal";
import { SessionPlayer } from "@/components/session-player";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRecentCourses } from "@/hooks/use-recent-courses";
import type { SessionResult, UserFeedback } from "@/hooks/use-session-state";
import { useSwipe } from "@/hooks/use-swipe";
import type { MergedExercise, MergeRequest } from "@/types/body-part-merge";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Play,
  Save,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

interface CourseGenerationResponse {
  success: boolean;
  data?: {
    course: {
      exercises: MergedExercise[];
      totalDuration: number;
      stats?: {
        warmup: number;
        main: number;
        cooldown: number;
      };
    };
    warnings?: string[];
  };
  error?: string;
}

/**
 * RehabPageContent 컴포넌트
 * useSearchParams를 사용하는 내부 컴포넌트
 */
function RehabPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [courseData, setCourseData] = useState<{
    exercises: MergedExercise[];
    totalDuration: number;
    stats?: {
      warmup: number;
      main: number;
      cooldown: number;
    };
    warnings?: string[];
  } | null>(null);
  const [sections, setSections] = useState<{
    warmup: MergedExercise[];
    main: MergedExercise[];
    cooldown: MergedExercise[];
  } | null>(null);

  // 운동 타이머 모달 상태
  const [activeExercise, setActiveExercise] = useState<MergedExercise | null>(
    null,
  );
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // 🆕 세션 플레이어 모드 상태
  const [isSessionMode, setIsSessionMode] = useState(false);
  const [savedCourseId, setSavedCourseId] = useState<string | null>(null);

  // 전체 운동 목록 (순서대로 평탄화)
  const allExercises = sections
    ? [...sections.warmup, ...sections.main, ...sections.cooldown]
    : [];

  const handleStartExercise = (exercise: MergedExercise) => {
    setActiveExercise(exercise);
    // 전체 목록에서 인덱스 찾기
    const index = allExercises.findIndex(
      (ex) =>
        ex.exerciseTemplateId === exercise.exerciseTemplateId &&
        ex.section === exercise.section,
    );
    setActiveIndex(index);
  };

  const handleNextExercise = () => {
    if (activeIndex < allExercises.length - 1) {
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      setActiveExercise(allExercises[nextIndex]);
    }
  };

  const handleCloseModal = () => {
    setActiveExercise(null);
    setActiveIndex(-1);
  };

  // 탭 상태 관리 및 스와이프 로직
  const [activeTab, setActiveTab] = useState<string>("warmup");

  const handleSwipeLeft = () => {
    if (activeTab === "warmup") setActiveTab("main");
    else if (activeTab === "main") setActiveTab("cooldown");
  };

  const handleSwipeRight = () => {
    if (activeTab === "cooldown") setActiveTab("main");
    else if (activeTab === "main") setActiveTab("warmup");
  };

  const swipeHandlers = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 50,
  });

  // 코스 생성 요청 데이터 (URL 파라미터 또는 로컬 스토리지에서 가져오기)
  const [requestData, setRequestData] = useState<MergeRequest | null>(null);

  // 🆕 최근 코스 저장 훅
  const { addCourse } = useRecentCourses();

  useEffect(() => {
    // URL 파라미터 또는 로컬 스토리지에서 코스 생성 요청 데이터 확인
    const urlData = searchParams.get("data");
    let mergeRequest: MergeRequest | null = null;

    if (urlData) {
      try {
        mergeRequest = JSON.parse(decodeURIComponent(urlData));
      } catch (e) {
        console.error("Failed to parse URL data:", e);
      }
    } else {
      // 로컬 스토리지에서 가져오기
      const stored = localStorage.getItem("rehabCourseRequest");
      if (stored) {
        try {
          mergeRequest = JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse stored data:", e);
        }
      }
    }

    if (!mergeRequest) {
      setError("코스 생성 데이터를 찾을 수 없습니다.");
      setLoading(false);
      return;
    }

    setRequestData(mergeRequest);
    generateCourse(mergeRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /**
   * 코스 생성 API 호출
   */
  const generateCourse = async (request: MergeRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rehab/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      let data: CourseGenerationResponse;
      try {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`Invalid JSON response: ${text.slice(0, 100)}...`);
        }
      } catch (e) {
        throw new Error(
          `Server connection failed: ${response.status} ${response.statusText}`,
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "코스 생성에 실패했습니다.");
      }

      if (!data.data) {
        throw new Error("코스 데이터를 받아오지 못했습니다.");
      }

      setCourseData(data.data.course);

      // 섹션별로 그룹화 (서버에서 이미 분류+배분된 결과 사용)
      // ⚠️ 중요: classifyBySection()을 다시 호출하면 서버의 시간 배분이 무시됨
      const exercises = data.data.course.exercises;
      const grouped = {
        warmup: exercises.filter((ex) => ex.section === "warmup"),
        main: exercises.filter((ex) => ex.section === "main"),
        cooldown: exercises.filter((ex) => ex.section === "cooldown"),
      };
      setSections(grouped);

      // 🆕 최근 코스에 자동 저장
      addCourse({
        bodyParts: request.bodyParts.map((bp) => bp.bodyPartName),
        painLevel: request.painLevel,
        totalDuration: data.data.course.totalDuration,
        exerciseCount: data.data.course.exercises.length,
        requestData: request, // 🆕 재실행을 위해 원본 요청 저장
      });
      console.log("[RehabPage] Course saved to recent courses");
    } catch (err) {
      let errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";

      // 네트워크 에러 메시지 번역
      if (
        errorMessage === "Failed to fetch" ||
        errorMessage === "Load failed"
      ) {
        errorMessage = "네트워크 연결 상태를 확인해주세요. (서버 연결 실패)";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 코스 저장 핸들러
   */
  const handleSaveCourse = async () => {
    if (!courseData || !requestData) {
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const response = await fetch("/api/courses/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          totalDurationMinutes: requestData.totalDurationMinutes || 60,
          painLevel: requestData.painLevel,
          experienceLevel: requestData.experienceLevel,
          bodyParts: requestData.bodyParts.map((bp) => bp.bodyPartName),
          equipmentAvailable: requestData.equipmentAvailable,
          exercises: courseData.exercises,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "코스 저장에 실패했습니다.");
      }

      // 🆕 저장된 코스 ID 저장
      if (data.data?.courseId) {
        setSavedCourseId(data.data.courseId);
      }

      setSaveSuccess(true);
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  /**
   * 🆕 세션 시작 핸들러
   * 코스를 먼저 저장한 후 세션 모드로 전환
   */
  const handleStartSession = async () => {
    if (!courseData || !requestData) return;

    // 코스가 아직 저장되지 않았으면 먼저 저장
    if (!savedCourseId) {
      setSaving(true);
      try {
        const response = await fetch("/api/courses/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalDurationMinutes: requestData.totalDurationMinutes || 60,
            painLevel: requestData.painLevel,
            experienceLevel: requestData.experienceLevel,
            bodyParts: requestData.bodyParts.map((bp) => bp.bodyPartName),
            equipmentAvailable: requestData.equipmentAvailable,
            exercises: courseData.exercises,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "코스 저장에 실패했습니다.");
        }

        setSavedCourseId(data.data.courseId);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.";
        setError(errorMessage);
        setSaving(false);
        return;
      }
      setSaving(false);
    }

    // 세션 모드로 전환
    setIsSessionMode(true);
  };

  /**
   * 🆕 세션 완료 핸들러
   */
  const handleSessionComplete = useCallback(
    async (result: SessionResult, feedback: UserFeedback) => {
      if (!savedCourseId) {
        console.error("Course ID not found for completion logging");
        return;
      }

      try {
        // 완료 로그 저장
        const response = await fetch("/api/courses/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: savedCourseId,
            exercises: result.exerciseLogs.map((log) => ({
              exerciseTemplateId: log.exerciseTemplateId,
              status: log.status,
              actualDuration: Math.floor(log.actualDuration / 60), // 초 -> 분
            })),
            painAfter: feedback.painAfter
              ? Math.round(
                  Object.values(feedback.painAfter).reduce((a, b) => a + b, 0) /
                    Object.values(feedback.painAfter).length,
                )
              : undefined,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          console.error("Failed to save completion logs:", data.error);
        }
      } catch (err) {
        console.error("Session completion error:", err);
      }
    },
    [savedCourseId],
  );

  /**
   * 🆕 세션 종료 핸들러
   */
  const handleSessionExit = useCallback(() => {
    setIsSessionMode(false);
  }, []);

  /**
   * 🆕 부위별 통증 정보 변환 (세션 플레이어용)
   */
  const getBodyPartInfoForSession = useCallback(() => {
    if (!requestData) return [];
    return requestData.bodyParts.map((bp) => ({
      bodyPartId: bp.bodyPartId,
      bodyPartName: bp.bodyPartName,
      painBefore: bp.painLevel,
    }));
  }, [requestData]);

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-80px)] container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2
              className="h-8 w-8 animate-spin text-primary mb-4"
              strokeWidth={1.5}
            />
            <p className="text-muted-foreground">코스를 생성하고 있습니다...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !courseData) {
    return (
      <main className="min-h-[calc(100vh-80px)] container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button onClick={() => router.push("/")} variant="outline">
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (!sections || !courseData) {
    return null;
  }

  // 🆕 세션 플레이어 모드
  if (isSessionMode) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <SessionPlayer
          exercises={allExercises}
          courseId={savedCourseId ?? undefined}
          courseName={`${requestData?.bodyParts.map((bp) => bp.bodyPartName).join(", ")} 재활 코스`}
          bodyParts={getBodyPartInfoForSession()}
          streak={0} // TODO: 실제 연속 운동 일수 조회
          onComplete={handleSessionComplete}
          onExit={handleSessionExit}
        />
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-foreground mb-2">
            내 몸에 맞는 재활 코스
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-lg">총 {courseData.totalDuration}분</span>
          </div>
        </div>

        {/* 경고 메시지 */}
        {courseData.warnings && courseData.warnings.length > 0 && (
          <Alert
            variant="default"
            className="mb-6 border-yellow-500/30 bg-yellow-500/10"
          >
            <AlertCircle
              className="h-4 w-4 text-yellow-500"
              strokeWidth={1.5}
            />
            <AlertDescription className="text-yellow-500/90">
              {courseData.warnings.map((warning, idx) => (
                <p key={idx}>{warning}</p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* 에러 메시지 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 성공 메시지 */}
        {saveSuccess && (
          <Alert
            variant="default"
            className="mb-6 border-green-500/30 bg-green-500/10"
          >
            <CheckCircle2
              className="h-4 w-4 text-green-500"
              strokeWidth={1.5}
            />
            <AlertDescription className="text-green-500/90">
              코스가 성공적으로 저장되었습니다.
            </AlertDescription>
          </Alert>
        )}

        {/* 섹션별 운동 탭 */}
        <div
          {...swipeHandlers.onTouchStart}
          {...swipeHandlers.onTouchMove}
          {...swipeHandlers.onTouchEnd}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="warmup">
                준비 운동 ({sections.warmup.length}) ·{" "}
                {sections.warmup.reduce(
                  (sum, ex) => sum + (ex.durationMinutes || 0),
                  0,
                )}
                분
              </TabsTrigger>
              <TabsTrigger value="main">
                메인 운동 ({sections.main.length}) ·{" "}
                {sections.main.reduce(
                  (sum, ex) => sum + (ex.durationMinutes || 0),
                  0,
                )}
                분
              </TabsTrigger>
              <TabsTrigger value="cooldown">
                마무리 운동 ({sections.cooldown.length}) ·{" "}
                {sections.cooldown.reduce(
                  (sum, ex) => sum + (ex.durationMinutes || 0),
                  0,
                )}
                분
              </TabsTrigger>
            </TabsList>

            <TabsContent value="warmup" className="mt-6">
              <div className="space-y-4">
                {sections.warmup.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">
                        준비 운동이 없습니다.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  sections.warmup.map((exercise, index) => (
                    <CourseExerciseCard
                      key={`warmup-${index}-${exercise.exerciseTemplateId}`}
                      exercise={exercise}
                      section="warmup"
                      onStart={handleStartExercise}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="main" className="mt-6">
              <div className="space-y-4">
                {sections.main.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">
                        메인 운동이 없습니다.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  sections.main.map((exercise, index) => (
                    <CourseExerciseCard
                      key={`main-${index}-${exercise.exerciseTemplateId}`}
                      exercise={exercise}
                      section="main"
                      onStart={handleStartExercise}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="cooldown" className="mt-6">
              <div className="space-y-4">
                {sections.cooldown.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">
                        마무리 운동이 없습니다.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  sections.cooldown.map((exercise, index) => (
                    <CourseExerciseCard
                      key={`cooldown-${index}-${exercise.exerciseTemplateId}`}
                      exercise={exercise}
                      section="cooldown"
                      onStart={handleStartExercise}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 🆕 세션 시작 버튼 (메인 CTA) */}
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-1">준비되셨나요?</h3>
              <p className="text-sm text-muted-foreground">
                전체 운동을 연속으로 진행하고 코칭 피드백을 받아보세요
              </p>
            </div>
            <Button
              onClick={handleStartSession}
              disabled={saving}
              size="lg"
              className="w-full bg-primary hover:bg-primary-hover text-white"
            >
              {saving ? (
                <>
                  <Loader2
                    className="h-5 w-5 mr-2 animate-spin"
                    strokeWidth={1.5}
                  />
                  준비 중...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" strokeWidth={1.5} />
                  세션 시작하기
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 하단 액션 버튼 영역 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleSaveCourse}
                disabled={saving || !!savedCourseId}
                variant="outline"
                className="flex-1 border-2 border-primary/30 bg-background/50 hover:bg-primary/10 hover:border-primary transition-all h-14 text-base"
              >
                {saving ? (
                  <>
                    <Loader2
                      className="h-4 w-4 mr-2 animate-spin"
                      strokeWidth={1.5}
                    />
                    저장 중...
                  </>
                ) : savedCourseId ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
                    저장됨
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" strokeWidth={1.5} />
                    코스 저장하기
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-2 border-border/60 bg-background/50 hover:bg-accent hover:border-foreground/50 transition-all h-14 text-base"
                onClick={() => router.push("/")}
              >
                새 코스 만들기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 의료행위 아님 안내 문구 */}
        <Alert variant="default" className="border-border/50 bg-muted/20">
          <AlertCircle
            className="h-4 w-4 text-muted-foreground flex-shrink-0"
            strokeWidth={1.5}
          />
          <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">의료행위 아님 안내:</strong>
            <br className="sm:hidden" />본 서비스는 의료행위가 아닙니다. 통증이
            심하거나 지속되면 전문의와 상담하세요.
          </AlertDescription>
        </Alert>
      </div>

      {/* 운동 타이머 모달 */}
      <ExerciseTimerModal
        isOpen={!!activeExercise}
        exercise={activeExercise}
        hasNext={activeIndex < allExercises.length - 1}
        onClose={handleCloseModal}
        onNext={handleNextExercise}
      />
    </main>
  );
}

/**
 * RehabPage 메인 컴포넌트
 * Suspense로 감싸서 useSearchParams 사용
 */
export default function RehabPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-80px)] container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2
                className="h-8 w-8 animate-spin text-primary mb-4"
                strokeWidth={1.5}
              />
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          </div>
        </main>
      }
    >
      <RehabPageContent />
    </Suspense>
  );
}
