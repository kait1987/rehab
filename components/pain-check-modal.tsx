"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HeartPulse, ChevronLeft, ChevronRight, Check, RefreshCw } from "lucide-react";
import { savePainProfile } from "@/actions/pain-check";
import { cn } from "@/lib/utils";

/**
 * 통증 체크 모달 컴포넌트
 * 
 * 플로팅 버튼을 통해 통증 상태를 체크하는 모달을 엽니다.
 * 4단계 질문 폼을 통해 사용자의 통증 프로필을 수집하고 저장합니다.
 * 
 * 질문 단계:
 * 1. 부위 선택 (BodyPart)
 * 2. 통증 정도 (1-5, 통증 신호등 시스템)
 * 3. 사용 가능한 기구 (EquipmentType, 복수 선택)
 * 4. 운동 경험 (거의 안 함/주1-2회/주3회 이상)
 */

interface BodyPart {
  id: string;
  name: string;
  displayOrder: number;
}

interface EquipmentType {
  id: string;
  name: string;
  displayOrder: number;
}

export function PainCheckModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 폼 데이터
  const [bodyPartId, setBodyPartId] = useState<string>("");
  const [painLevel, setPainLevel] = useState<number | null>(null);
  const [equipmentAvailable, setEquipmentAvailable] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>("");

  // 데이터 로딩
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  // 상태 초기화 함수
  const resetState = () => {
    setStep(1);
    setBodyPartId("");
    setPainLevel(null);
    setEquipmentAvailable([]);
    setExperienceLevel("");
    setSuccess(false);
    setError(null);
    setDataLoadError(null);
  };

  // 모달 열림/닫힘 처리
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // 모달이 닫힐 때 상태 초기화
      resetState();
    } else {
      // 모달이 열릴 때 데이터 로드
      if (bodyParts.length === 0) {
        loadData();
      }
    }
  };

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (open && bodyParts.length === 0) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setDataLoading(true);
      setDataLoadError(null);
      const response = await fetch("/api/pain-check-data");
      
      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }
      
      const result = await response.json();

      if (result.success) {
        setBodyParts(result.data.bodyParts);
        setEquipmentTypes(result.data.equipmentTypes);
      } else {
        throw new Error(result.error || "데이터를 불러오는 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("Load data error:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "데이터를 불러오는 중 오류가 발생했습니다.";
      setDataLoadError(errorMessage);
    } finally {
      setDataLoading(false);
    }
  };

  // "없음" 기구 ID 찾기
  const noneEquipmentId = equipmentTypes.find(eq => eq.name === "없음")?.id;

  // 기구 선택 토글 (개선: "없음" 처리 로직 추가)
  const toggleEquipment = (equipmentId: string) => {
    setEquipmentAvailable((prev) => {
      const isNone = equipmentId === noneEquipmentId;
      const isCurrentlySelected = prev.includes(equipmentId);

      if (isNone) {
        // "없음" 선택 시: 다른 모든 기구 해제하고 "없음"만 선택
        return isCurrentlySelected ? [] : [equipmentId];
      } else {
        // 다른 기구 선택 시: "없음"이 있으면 제거하고 선택한 기구 추가/제거
        const withoutNone = prev.filter(id => id !== noneEquipmentId);
        if (isCurrentlySelected) {
          return withoutNone.filter(id => id !== equipmentId);
        } else {
          return [...withoutNone, equipmentId];
        }
      }
    });
  };

  // 다음 단계로 이동
  const handleNext = () => {
    // 단계별 유효성 검사 및 구체적인 에러 메시지
    if (step === 1) {
      if (!bodyPartId) {
        setError("운동 부위를 선택해주세요. 가장 불편한 부위를 선택하시면 더 정확한 코스를 추천받을 수 있습니다.");
        return;
      }
    }
    if (step === 2) {
      if (painLevel === null) {
        setError("통증 정도를 선택해주세요. 현재 느끼는 통증의 강도를 선택하시면 안전한 운동 범위를 설정할 수 있습니다.");
        return;
      }
    }
    if (step === 3) {
      if (equipmentAvailable.length === 0) {
        setError("사용 가능한 기구를 최소 하나 이상 선택해주세요. 사용할 수 있는 기구가 없다면 '없음'을 선택해주세요.");
        return;
      }
    }
    if (step === 4) {
      if (!experienceLevel) {
        setError("운동 경험을 선택해주세요. 평소 운동 빈도를 알려주시면 적절한 난이도의 코스를 추천해드립니다.");
        return;
      }
    }

    setError(null);
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  // 이전 단계로 이동
  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  // 폼 제출
  const handleSubmit = async () => {
    // 최종 유효성 검사
    if (!bodyPartId || painLevel === null || !experienceLevel || equipmentAvailable.length === 0) {
      setError("모든 항목을 입력해주세요. 빠진 항목이 있는지 확인해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await savePainProfile({
        bodyPartId,
        painLevel,
        experienceLevel,
        equipmentAvailable,
      });

      if (result.success) {
        setSuccess(true);
        // 2초 후 모달 닫기 (상태 초기화는 handleOpenChange에서 처리)
        setTimeout(() => {
          setOpen(false);
        }, 2000);
      } else {
        // 구체적인 에러 메시지 표시
        const errorMessage = result.error || "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Submit error:", err);
      const errorMessage = err instanceof Error
        ? `저장 중 오류가 발생했습니다: ${err.message}`
        : "저장 중 예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 통증 레벨에 따른 색상 및 메시지 (CSS 변수 사용)
  const getPainLevelInfo = (level: number) => {
    if (level <= 2) {
      return {
        colorClass: "bg-[var(--pain-safe)]",
        bgClass: "bg-[var(--pain-safe-light)]",
        text: "안전하게 운동 가능",
        label: "안전",
      };
    } else if (level === 3) {
      return {
        colorClass: "bg-[var(--pain-caution)]",
        bgClass: "bg-[var(--pain-caution-light)]",
        text: "가벼운 운동만 가능, 주의 필요",
        label: "주의",
      };
    } else {
      return {
        colorClass: "bg-[var(--pain-danger)]",
        bgClass: "bg-[var(--pain-danger-light)]",
        text: "운동 중단 권장, 전문가 상담 필요",
        label: "위험",
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-2xl w-[95vw] md:w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">오늘의 통증 체크</DialogTitle>
        </DialogHeader>

        {dataLoading ? (
          <div className="py-8 text-center">
            <div className="text-muted-foreground mb-2">데이터를 불러오는 중...</div>
            <div className="text-sm text-muted-foreground">잠시만 기다려주세요</div>
          </div>
        ) : dataLoadError ? (
          <div className="py-8 text-center">
            <div className="text-destructive mb-4">{dataLoadError}</div>
            <Button
              type="button"
              variant="outline"
              onClick={loadData}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </Button>
          </div>
        ) : success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">
              통증 정보가 저장되었습니다
            </p>
            <p className="text-sm text-muted-foreground">
              안전한 회복을 위해 노력하세요
            </p>
          </div>
        ) : (
          <div className="py-4">
            {/* 진행 표시 */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  {step} / 4
                </span>
                <span className="text-sm font-medium text-foreground">
                  {step === 1 && "부위 선택"}
                  {step === 2 && "통증 정도"}
                  {step === 3 && "사용 가능한 기구"}
                  {step === 4 && "운동 경험"}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Step 1: 부위 선택 */}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-muted-foreground mb-4">
                  어느 부위가 가장 불편한가요?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {bodyParts.map((part) => (
                    <button
                      key={part.id}
                      type="button"
                      onClick={() => setBodyPartId(part.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                        bodyPartId === part.id
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      )}
                    >
                      <span className="font-medium text-foreground">
                        {part.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: 통증 정도 */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-muted-foreground mb-4">
                  통증 정도는 어느 정도인가요?
                </p>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((level) => {
                    const info = getPainLevelInfo(level);
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setPainLevel(level)}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 transition-all duration-200 text-left",
                          painLevel === level
                            ? "border-primary shadow-md"
                            : "border-border hover:border-primary/50",
                          painLevel === level && info.bgClass
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full",
                                info.colorClass
                              )}
                            />
                            <span className="font-medium text-foreground">
                              {level}단계 - {info.label}
                            </span>
                          </div>
                          {painLevel === level && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {info.text}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: 사용 가능한 기구 */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-muted-foreground mb-4">
                  현재 사용 가능한 기구를 선택해주세요 (복수 선택 가능)
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  💡 사용할 수 있는 기구가 없다면 '없음'을 선택해주세요
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {equipmentTypes.map((equipment) => (
                    <button
                      key={equipment.id}
                      type="button"
                      onClick={() => toggleEquipment(equipment.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-200 text-left relative",
                        equipmentAvailable.includes(equipment.id)
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      )}
                    >
                      <span className="font-medium text-foreground">
                        {equipment.name}
                      </span>
                      {equipmentAvailable.includes(equipment.id) && (
                        <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: 운동 경험 */}
            {step === 4 && (
              <div className="space-y-4">
                <p className="text-muted-foreground mb-4">
                  평소 운동 빈도는 어느 정도인가요?
                </p>
                <div className="space-y-3">
                  {[
                    { value: "rarely", label: "거의 안 함" },
                    { value: "weekly_1_2", label: "주 1-2회" },
                    { value: "weekly_3_plus", label: "주 3회 이상" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setExperienceLevel(option.value)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 transition-all duration-200 text-left",
                        experienceLevel === option.value
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {option.label}
                        </span>
                        {experienceLevel === option.value && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 버튼 영역 */}
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={loading}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  이전
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className={cn(
                  "flex-1",
                  step === 1 && "ml-auto"
                )}
              >
                {step === 4 ? (
                  loading ? (
                    "저장 중..."
                  ) : (
                    "저장"
                  )
                ) : (
                  <>
                    다음
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
