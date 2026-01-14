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

  // 플레이스홀더 (미디어 없음)
  return (
    <div className="w-full aspect-video bg-muted/50 rounded-lg flex items-center justify-center border border-border">
      <div className="text-center text-muted-foreground">
        <ImageOff
          className="h-10 w-10 mx-auto mb-2 opacity-50"
          strokeWidth={1.5}
        />
        <p className="text-xs">동작 영상 준비 중</p>
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
