/**
 * @file course-exercise-card.tsx
 * @description 코스 운동 카드 컴포넌트 (YouTube 영상 연동)
 *
 * 재활 코스의 개별 운동을 카드 형태로 표시합니다.
 *
 * 주요 기능:
 * - 운동 이름 및 설명 표시
 * - YouTube 영상 썸네일/자동재생 시각화
 * - 시간/세트/횟수 정보 표시
 * - 주의사항 표시 (있는 경우)
 * - 섹션별 스타일 구분 (준비/메인/마무리)
 * - 모달 fallback (자동재생 실패 시)
 *
 * @dependencies
 * - @/types/body-part-merge: MergedExercise 타입
 * - lucide-react: 아이콘
 */

"use client";

import { useState, useCallback } from "react";
import {
  Clock,
  Dumbbell,
  AlertTriangle,
  ImageOff,
  Play,
  X,
  Footprints,
  Activity,
  Sprout,
} from "lucide-react";
import type { MergedExercise } from "@/types/body-part-merge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CourseExerciseCardProps {
  exercise: MergedExercise;
  section: "warmup" | "main" | "cooldown";
  isActive?: boolean;
  onSelect?: () => void;
  onStart?: (exercise: MergedExercise) => void;
}

/**
 * 섹션별 라벨 텍스트
 */
function getSectionLabel(section: "warmup" | "main" | "cooldown"): string {
  switch (section) {
    case "warmup":
      return "준비 운동";
    case "main":
      return "메인 운동";
    case "cooldown":
      return "마무리 운동";
  }
}

/**
 * YouTube 썸네일 URL 생성
 */
function getYouTubeThumbnail(
  videoId: string,
  quality: "hq" | "maxres" = "hq",
): string {
  // hqdefault.jpg는 거의 모든 영상에서 사용 가능
  // maxresdefault.jpg는 고화질이지만 일부 영상에서 404 발생 가능
  const qualityMap = {
    hq: "hqdefault",
    maxres: "maxresdefault",
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * YouTube 임베드 URL 생성 (자동재생 + 무음 + 루프)
 */
function getYouTubeEmbedUrl(videoId: string, autoplay: boolean = true): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: "1",
    loop: "1",
    playlist: videoId, // 단일 영상 루프를 위해 필요
    controls: "0",
    modestbranding: "1",
    rel: "0",
    showinfo: "0",
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * YouTube 영상 모달 컴포넌트
 */
function VideoModal({
  videoId,
  exerciseName,
  onClose,
}: {
  videoId: string;
  exerciseName: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          src={getYouTubeEmbedUrl(videoId, true)}
          title={`${exerciseName} 운동 영상`}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

/**
 * 운동 미디어 컴포넌트 (YouTube 연동)
 */
function ExerciseMedia({
  videoUrl,
  gifUrl,
  imageUrl,
  exerciseName,
  isActive,
  onPlayClick,
}: {
  videoUrl?: string;
  gifUrl?: string;
  imageUrl?: string;
  exerciseName: string;
  isActive?: boolean;
  onPlayClick?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [thumbnailQuality, setThumbnailQuality] = useState<"maxres" | "hq">(
    "hq",
  );

  // YouTube 영상이 있는 경우
  if (videoUrl) {
    const thumbnailUrl = getYouTubeThumbnail(videoUrl, thumbnailQuality);

    // 선택된 카드: 인라인 자동재생
    if (isActive) {
      return (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={getYouTubeEmbedUrl(videoUrl, true)}
            title={`${exerciseName} 운동 영상`}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
          <div className="absolute bottom-2 right-2">
            <Badge
              variant="secondary"
              className="text-xs bg-red-600 text-white border-0"
            >
              ▶ 재생 중
            </Badge>
          </div>
        </div>
      );
    }

    // 기본 상태: 썸네일 + 재생 버튼
    return (
      <div
        className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted/30 cursor-pointer group"
        onClick={onPlayClick}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-muted-foreground/20" />
              <div className="h-2 w-16 mt-2 rounded bg-muted-foreground/20" />
            </div>
          </div>
        )}
        <img
          src={thumbnailUrl}
          alt={`${exerciseName} 썸네일`}
          className={cn(
            "w-full h-full object-cover transition-all duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            "group-hover:scale-105 group-hover:brightness-75",
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            // maxres 실패 시 hq로 fallback
            if (thumbnailQuality === "maxres") {
              setThumbnailQuality("hq");
            } else {
              setIsLoading(false);
              setHasError(true);
            }
          }}
        />
        {!isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="h-8 w-8 text-white ml-1" fill="white" />
            </div>
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <Badge
            variant="secondary"
            className="text-xs bg-black/60 text-white border-0"
          >
            영상 보기
          </Badge>
        </div>
      </div>
    );
  }

  // GIF가 있는 경우 (기존 로직)
  if (gifUrl) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted/30">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-muted-foreground/20" />
              <div className="h-2 w-16 mt-2 rounded bg-muted-foreground/20" />
            </div>
          </div>
        )}
        <img
          src={gifUrl}
          alt={`${exerciseName} 동작`}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
        {!isLoading && !hasError && (
          <div className="absolute bottom-2 right-2">
            <Badge
              variant="secondary"
              className="text-xs bg-black/50 text-white border-0"
            >
              GIF
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // 이미지가 있는 경우
  if (imageUrl && !hasError) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted/30">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-muted-foreground/20" />
              <div className="h-2 w-16 mt-2 rounded bg-muted-foreground/20" />
            </div>
          </div>
        )}
        <img
          src={imageUrl}
          alt={`${exerciseName} 동작`}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      </div>
    );
  }

  // 플레이스홀더: 이미지가 없을 때 "프리미엄 추상화 디자인" 적용
  // 부위/키워드별 그라디언트 및 패턴 결정
  const getDesignPattern = (name: string) => {
    const n = name.toLowerCase();

    // 1. 하체/다리/무릎/발목 (안정감 있는 블루/틸)
    if (
      n.includes("다리") ||
      n.includes("무릎") ||
      n.includes("발목") ||
      n.includes("하체") ||
      n.includes("스쿼트") ||
      n.includes("런지")
    ) {
      return {
        bg: "bg-gradient-to-br from-cyan-500 to-blue-600",
        icon: "lower",
        accent: "text-cyan-100",
      };
    }
    // 2. 상체/어깨/가슴/팔 (에너지 있는 오렌지/레드)
    if (
      n.includes("어깨") ||
      n.includes("가슴") ||
      n.includes("팔") ||
      n.includes("프레스") ||
      n.includes("푸시업") ||
      n.includes("컬")
    ) {
      return {
        bg: "bg-gradient-to-br from-orange-400 to-rose-500",
        icon: "upper",
        accent: "text-orange-100",
      };
    }
    // 3. 허리/등/코어 (신뢰감 있는 인디고/바이올렛)
    if (
      n.includes("허리") ||
      n.includes("등") ||
      n.includes("코어") ||
      n.includes("플랭크") ||
      n.includes("슈퍼맨")
    ) {
      return {
        bg: "bg-gradient-to-br from-indigo-500 to-purple-600",
        icon: "core",
        accent: "text-indigo-100",
      };
    }
    // 4. 스트레칭/요가/목 (차분한 그린/에메랄드/핑크)
    if (
      n.includes("스트레칭") ||
      n.includes("요가") ||
      n.includes("목") ||
      n.includes("이완") ||
      n.includes("롤링")
    ) {
      return {
        bg: "bg-gradient-to-br from-emerald-400 to-teal-600",
        icon: "stretch",
        accent: "text-emerald-100",
      };
    }

    // 기본 (모던한 그레이/슬레이트)
    return {
      bg: "bg-gradient-to-br from-slate-500 to-slate-700",
      icon: "default",
      accent: "text-slate-200",
    };
  };

  const pattern = getDesignPattern(exerciseName);

  return (
    <div
      className={cn(
        "relative w-full aspect-video rounded-lg overflow-hidden group shadow-inner",
        pattern.bg,
      )}
    >
      {/* 배경 패턴 (추상적 도형 & 은은한 질감) */}
      <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-white/10 rounded-full blur-3xl transform rotate-12 group-hover:rotate-45 transition-transform duration-1000 ease-in-out opacity-60" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[100%] bg-black/10 rounded-full blur-2xl opacity-40" />

      {/* 노이즈 텍스처 오버레이 (고급스러운 느낌) */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* 중앙 아이콘/그래픽 */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="relative z-10 text-center transform group-hover:scale-105 transition-transform duration-500 ease-out">
          {/* Lucide 아이콘 매핑 */}
          {pattern.icon === "stretch" ? (
            <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-lg">
              <Sprout
                className="w-10 h-10 text-white drop-shadow-md"
                strokeWidth={1.5}
              />
            </div>
          ) : pattern.icon === "upper" ? (
            <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-lg">
              <Dumbbell
                className="w-10 h-10 text-white drop-shadow-md"
                strokeWidth={1.5}
              />
            </div>
          ) : pattern.icon === "lower" ? (
            <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-lg">
              <Footprints
                className="w-10 h-10 text-white drop-shadow-md"
                strokeWidth={1.5}
              />
            </div>
          ) : pattern.icon === "core" ? (
            <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-lg">
              <Activity
                className="w-10 h-10 text-white drop-shadow-md"
                strokeWidth={1.5}
              />
            </div>
          ) : (
            <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-lg">
              <Dumbbell
                className="w-10 h-10 text-white drop-shadow-md"
                strokeWidth={1.5}
              />
            </div>
          )}

          <p
            className={cn(
              "mt-4 text-lg font-bold text-white tracking-wide opacity-95",
              "drop-shadow-md px-4 leading-tight",
            )}
          >
            {exerciseName}
          </p>
        </div>
      </div>

      {/* 브랜드 뱃지 */}
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-80 transition-opacity duration-300">
        <Badge
          variant="outline"
          className="border-white/30 text-white text-[10px] uppercase font-semibold tracking-wider bg-black/20 backdrop-blur-sm h-5"
        >
          Rehap Studio
        </Badge>
      </div>
    </div>
  );
}

/**
 * 코스 운동 카드 컴포넌트
 */
export function CourseExerciseCard({
  exercise,
  section,
  isActive = false,
  onSelect,
  onStart,
}: CourseExerciseCardProps) {
  const isMain = section === "main";
  const [showModal, setShowModal] = useState(false);

  const handlePlayClick = useCallback(() => {
    if (onSelect) {
      onSelect();
    } else if (onStart) {
      // onStart가 있으면 타이머 모달 트리거 (상위에서 처리)
      onStart(exercise);
    } else {
      // 둘 다 없으면 단순 비디오 모달 fallback
      setShowModal(true);
    }
  }, [onSelect, onStart, exercise]);

  return (
    <>
      <Card
        className={cn(
          "transition-all duration-300 hover:shadow-lg cursor-pointer",
          isMain && "border-primary/30 bg-primary/5",
          isActive && "ring-2 ring-primary shadow-lg",
        )}
        onClick={onSelect}
      >
        <CardContent className="p-4 sm:p-6">
          {/* 헤더: 섹션 라벨 + 운동 이름 */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1">
              <Badge
                variant="outline"
                className={cn(
                  "mb-2 text-xs",
                  section === "warmup" && "border-blue-500/30 text-blue-500",
                  section === "main" &&
                    "border-primary text-primary bg-primary/10",
                  section === "cooldown" &&
                    "border-green-500/30 text-green-500",
                )}
              >
                {getSectionLabel(section)}
              </Badge>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                {exercise.exerciseTemplateName}
              </h3>
            </div>
          </div>

          {/* 운동 동작 영상/이미지 */}
          <div className="mb-4">
            <ExerciseMedia
              videoUrl={exercise.videoUrl}
              gifUrl={exercise.gifUrl}
              imageUrl={exercise.imageUrl}
              exerciseName={exercise.exerciseTemplateName}
              isActive={isActive}
              onPlayClick={handlePlayClick}
            />
          </div>

          {/* 운동 설명 */}
          {exercise.description && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {exercise.description}
            </p>
          )}

          {/* 운동 정보: 시간, 세트, 횟수 */}
          <div className="flex flex-wrap gap-4 mb-4">
            {exercise.durationMinutes && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" strokeWidth={1.5} />
                <span>{exercise.durationMinutes}분</span>
              </div>
            )}

            {(exercise.sets || exercise.reps) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Dumbbell className="h-4 w-4" strokeWidth={1.5} />
                <span>
                  {exercise.sets && exercise.reps
                    ? `${exercise.sets}세트 × ${exercise.reps}회`
                    : exercise.sets
                      ? `${exercise.sets}세트`
                      : exercise.reps
                        ? `${exercise.reps}회`
                        : ""}
                </span>
              </div>
            )}

            {exercise.restSeconds && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" strokeWidth={1.5} />
                <span>휴식 {exercise.restSeconds}초</span>
              </div>
            )}
          </div>

          {/* 지시사항 */}
          {exercise.instructions && (
            <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                운동 방법
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {exercise.instructions}
              </p>
            </div>
          )}

          {/* 주의사항 */}
          {exercise.precautions && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0"
                  strokeWidth={1.5}
                />
                <div className="flex-1">
                  <p className="text-xs font-medium text-yellow-500 mb-1">
                    주의사항
                  </p>
                  <p className="text-sm text-yellow-500/90 leading-relaxed">
                    {exercise.precautions}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 모달 (fallback) */}
      {showModal && exercise.videoUrl && (
        <VideoModal
          videoId={exercise.videoUrl}
          exerciseName={exercise.exerciseTemplateName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
