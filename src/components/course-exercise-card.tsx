/**
 * @file course-exercise-card.tsx
 * @description 코스 운동 카드 컴포넌트
 *
 * 재활 코스의 개별 운동을 카드 형태로 표시합니다.
 *
 * 주요 기능:
 * - 운동 이름 및 설명 표시
 * - 시간/세트/횟수 정보 표시
 * - 주의사항 표시 (있는 경우)
 * - 섹션별 스타일 구분 (준비/메인/마무리)
 *
 * @dependencies
 * - @/types/body-part-merge: MergedExercise 타입
 * - lucide-react: 아이콘
 */

"use client";

import { Clock, Dumbbell, AlertTriangle } from "lucide-react";
import type { MergedExercise } from "@/types/body-part-merge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CourseExerciseCardProps {
  exercise: MergedExercise;
  section: "warmup" | "main" | "cooldown";
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
 * 코스 운동 카드 컴포넌트
 */
export function CourseExerciseCard({
  exercise,
  section,
}: CourseExerciseCardProps) {
  const isMain = section === "main";

  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-lg",
        isMain && "border-primary/30 bg-primary/5"
      )}
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
                section === "cooldown" && "border-green-500/30 text-green-500"
              )}
            >
              {getSectionLabel(section)}
            </Badge>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">
              {exercise.exerciseTemplateName}
            </h3>
          </div>
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
  );
}

