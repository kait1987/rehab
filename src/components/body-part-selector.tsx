"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BodyPartSelection } from "@/types/body-part-merge";

/**
 * 부위 선택 인터페이스
 */
interface BodyPart {
  id: string;
  name: string;
  displayOrder: number;
}

/**
 * BodyPartSelector Props
 */
interface BodyPartSelectorProps {
  /** 부위 목록 */
  bodyParts: BodyPart[];
  /** 선택된 부위 목록 */
  selectedBodyParts: BodyPartSelection[];
  /** 선택 변경 콜백 */
  onSelectionChange: (selections: BodyPartSelection[]) => void;
  /** 최대 선택 개수 (기본값: 5) */
  maxSelections?: number;
  /** 비활성화 여부 */
  disabled?: boolean;
}

/**
 * 부위 선택 컴포넌트
 *
 * 다중 부위 선택을 지원하며, 각 부위별로 통증 정도를 입력할 수 있습니다.
 * 최대 5개까지 선택 가능하며, 모바일 친화적인 UI를 제공합니다.
 */
export function BodyPartSelector({
  bodyParts,
  selectedBodyParts,
  onSelectionChange,
  maxSelections = 5,
  disabled = false,
}: BodyPartSelectorProps) {
  // 부위 선택/해제 처리
  const handleBodyPartToggle = (bodyPart: BodyPart) => {
    if (disabled) return;

    const isSelected = selectedBodyParts.some(
      (bp) => bp.bodyPartId === bodyPart.id,
    );

    if (isSelected) {
      // 해제: 해당 부위 제거
      const updated = selectedBodyParts.filter(
        (bp) => bp.bodyPartId !== bodyPart.id,
      );
      onSelectionChange(updated);
    } else {
      // 선택: 최대 개수 확인
      if (selectedBodyParts.length >= maxSelections) {
        // 최대 개수 초과 시 경고 (UI에서 표시)
        return;
      }

      // 새 부위 추가 (기본 통증 정도: 3)
      const newSelection: BodyPartSelection = {
        bodyPartId: bodyPart.id,
        bodyPartName: bodyPart.name,
        painLevel: 3, // 기본값
        selectionOrder: selectedBodyParts.length + 1,
      };

      onSelectionChange([...selectedBodyParts, newSelection]);
    }
  };

  // 통증 정도 변경 처리
  const handlePainLevelChange = (bodyPartId: string, painLevel: number) => {
    if (disabled) return;

    const updated = selectedBodyParts.map((bp) =>
      bp.bodyPartId === bodyPartId ? { ...bp, painLevel } : bp,
    );

    onSelectionChange(updated);
  };

  // 선택된 부위인지 확인
  const isSelected = (bodyPartId: string) => {
    return selectedBodyParts.some((bp) => bp.bodyPartId === bodyPartId);
  };

  // 선택된 부위의 통증 정도 가져오기
  const getPainLevel = (bodyPartId: string): number => {
    const selection = selectedBodyParts.find(
      (bp) => bp.bodyPartId === bodyPartId,
    );
    return selection?.painLevel ?? 3;
  };

  // 선택 개수 표시
  const selectionCount = selectedBodyParts.length;
  const isMaxReached = selectionCount >= maxSelections;

  return (
    <div className="space-y-4">
      {/* 선택 개수 표시 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">어느 부위가 불편한가요?</span>
        <span
          className={cn(
            "font-medium",
            isMaxReached ? "text-primary" : "text-muted-foreground",
          )}
        >
          {selectionCount}/{maxSelections} 선택됨
        </span>
      </div>

      {/* 부위 선택 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {bodyParts.map((part) => {
          const selected = isSelected(part.id);
          const painLevel = getPainLevel(part.id);

          return (
            <div
              key={part.id}
              className={cn(
                "space-y-2 transition-all duration-200",
                selected && "col-span-2",
              )}
            >
              {/* 부위 선택 버튼 */}
              <button
                type="button"
                onClick={() => handleBodyPartToggle(part)}
                disabled={disabled || (!selected && isMaxReached)}
                className={cn(
                  "relative w-full p-4 rounded-xl border-2 transition-all duration-200 text-left",
                  "hover:border-primary/50 hover:bg-accent",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  selected
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border",
                  !selected && isMaxReached && "opacity-60",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    {part.name}
                  </span>
                  {selected && (
                    <div className="flex-shrink-0 ml-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                        <Check className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </div>
              </button>

              {/* 통증 정도 입력 (선택된 경우에만 표시) */}
              {selected && (
                <div className="px-1 space-y-2">
                  <label className="text-xs text-muted-foreground block">
                    통증 정도
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => handlePainLevelChange(part.id, level)}
                        disabled={disabled}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg border-2 transition-all duration-200",
                          "font-medium text-sm",
                          "hover:border-primary/50 hover:bg-accent",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          painLevel === level
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-background text-foreground",
                        )}
                        aria-label={`통증 정도 ${level}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  {/* 통증 정도 설명 */}
                  <div className="text-xs text-muted-foreground text-center">
                    {painLevel === 1 && "거의 없음"}
                    {painLevel === 2 && "약함"}
                    {painLevel === 3 && "보통"}
                    {painLevel === 4 && "심함"}
                    {painLevel === 5 && "매우 심함"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 최대 개수 경고 */}
      {isMaxReached && (
        <div className="text-xs text-muted-foreground text-center">
          최대 {maxSelections}개까지 선택할 수 있습니다.
        </div>
      )}

      {/* 최소 선택 안내 */}
      {selectionCount === 0 && (
        <div className="text-xs text-muted-foreground text-center">
          최소 1개 이상의 부위를 선택해주세요.
        </div>
      )}
    </div>
  );
}
