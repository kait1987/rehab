"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  Check,
  RefreshCw,
  Clock,
} from "lucide-react";
import { savePainProfile } from "@/actions/pain-check";
import { cn } from "@/lib/utils";
import StepLoader from "@/components/ui/step-loader";
import { BodyPartSelector } from "@/components/body-part-selector";
import type { BodyPartSelection, MergeRequest } from "@/types/body-part-merge";

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

interface PainCheckModalProps {
  children: React.ReactNode;
  initialValues?: {
    bodyPartNames?: string[];
    painLevel?: number;
  };
  defaultOpen?: boolean;
}

export function PainCheckModal({
  children,
  initialValues,
  defaultOpen = false,
}: PainCheckModalProps) {
  const router = useRouter();
  const { user } = useUser();
  const [open, setOpen] = useState(defaultOpen);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 폼 데이터
  const [selectedBodyParts, setSelectedBodyParts] = useState<
    BodyPartSelection[]
  >([]);
  const [equipmentAvailable, setEquipmentAvailable] = useState<string[]>([]);
  // 🆕 Step 4: 운동 시간 선택
  const [totalDurationMinutes, setTotalDurationMinutes] = useState<
    60 | 90 | 120
  >(60);
  const [experienceLevel, setExperienceLevel] = useState<string>("");

  // 데이터 로딩
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  // 상태 초기화 함수
  const resetState = () => {
    setStep(1);
    setSelectedBodyParts([]);
    setEquipmentAvailable([]);
    setExperienceLevel("");
    setTotalDurationMinutes(60);
    setSuccess(false);
    setError(null);
    setDataLoadError(null);
    setIsSaving(false);
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
  }, [open, bodyParts.length]);

  // 🆕 초기 데이터 적용 (데이터 로드 완료 후)
  useEffect(() => {
    if (open && bodyParts.length > 0 && initialValues?.bodyPartNames) {
      const matchedParts = bodyParts.filter((bp) =>
        initialValues.bodyPartNames?.includes(bp.name),
      );

      if (matchedParts.length > 0) {
        const selection: BodyPartSelection[] = matchedParts.map((bp) => ({
          bodyPartId: bp.id,
          bodyPartName: bp.name,
          painLevel: initialValues.painLevel || 1,
        }));
        setSelectedBodyParts(selection);
      }
    }
  }, [open, bodyParts, initialValues]);

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
        throw new Error(
          result.error || "데이터를 불러오는 중 오류가 발생했습니다.",
        );
      }
    } catch (err) {
      console.error("Load data error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "데이터를 불러오는 중 오류가 발생했습니다.";
      setDataLoadError(errorMessage);
    } finally {
      setDataLoading(false);
    }
  };

  // "맨몸" 또는 "없음" 기구 ID 찾기
  const noneEquipmentId = equipmentTypes.find(
    (eq) => eq.name === "맨몸" || eq.name === "없음",
  )?.id;

  // 기구 선택 토글 (개선: "맨몸" 처리 로직 추가)
  const toggleEquipment = (equipmentId: string) => {
    setEquipmentAvailable((prev) => {
      const isNone = equipmentId === noneEquipmentId;
      const isCurrentlySelected = prev.includes(equipmentId);

      if (isNone) {
        // "맨몸" 선택 시: 다른 모든 기구 해제하고 "맨몸"만 선택
        return isCurrentlySelected ? [] : [equipmentId];
      } else {
        // 다른 기구 선택 시: "없음"이 있으면 제거하고 선택한 기구 추가/제거
        const withoutNone = prev.filter((id) => id !== noneEquipmentId);
        if (isCurrentlySelected) {
          return withoutNone.filter((id) => id !== equipmentId);
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
      if (selectedBodyParts.length === 0) {
        setError(
          "최소 1개 이상의 부위를 선택해주세요. 가장 불편한 부위를 선택하시면 더 정확한 코스를 추천받을 수 있습니다.",
        );
        return;
      }
      // 모든 선택된 부위에 통증 정도가 설정되어 있는지 확인
      const hasInvalidPainLevel = selectedBodyParts.some(
        (bp) => !bp.painLevel || bp.painLevel < 1 || bp.painLevel > 5,
      );
      if (hasInvalidPainLevel) {
        setError("모든 선택된 부위에 통증 정도를 설정해주세요.");
        return;
      }
    }
    if (step === 2) {
      if (equipmentAvailable.length === 0) {
        setError(
          "사용 가능한 기구를 최소 하나 이상 선택해주세요. 사용할 수 있는 기구가 없다면 '없음'을 선택해주세요.",
        );
        return;
      }
    }
    if (step === 3) {
      if (!experienceLevel) {
        setError(
          "운동 경험을 선택해주세요. 평소 운동 빈도를 알려주시면 적절한 난이도의 코스를 추천해드립니다.",
        );
        return;
      }
    }
    // Step 4는 기본값이 있으므로 별도 검증 불필요

    setError(null);
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleNavigateToRehab();
    }
  };

  // 이전 단계로 이동
  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  // 🆕 코스 생성 페이지로 이동 (localStorage 저장 후 /rehab 리다이렉트)
  const handleNavigateToRehab = () => {
    // 유효성 검사
    if (
      selectedBodyParts.length === 0 ||
      !experienceLevel ||
      equipmentAvailable.length === 0
    ) {
      setError("모든 항목을 입력해주세요.");
      return;
    }

    try {
      // MergeRequest 형식으로 변환
      const mergeRequest: MergeRequest = {
        bodyParts: selectedBodyParts,
        painLevel: Math.max(...selectedBodyParts.map((bp) => bp.painLevel)),
        equipmentAvailable,
        experienceLevel,
        totalDurationMinutes,
      };

      // localStorage에 저장
      localStorage.setItem("rehabCourseRequest", JSON.stringify(mergeRequest));

      // 모달 닫고 /rehab로 이동
      setOpen(false);
      router.push("/rehab");
    } catch (err) {
      console.error("localStorage save error:", err);
      setError("데이터 저장에 실패했습니다. 브라우저 설정을 확인해주세요.");
    }
  };

  // 폼 제출 (기존 함수 - 필요 시 수동 통증 체크용으로 유지)
  const handleSubmit = async () => {
    // 최종 유효성 검사
    if (
      selectedBodyParts.length === 0 ||
      !experienceLevel ||
      equipmentAvailable.length === 0
    ) {
      setError("모든 항목을 입력해주세요. 빠진 항목이 있는지 확인해주세요.");
      return;
    }

    // 인증 확인
    if (!user?.id) {
      setError("로그인이 필요합니다. 로그인 후 다시 시도해주세요.");
      return;
    }

    setIsSaving(true);
    setLoading(true);
    setError(null);

    try {
      // 각 부위별로 별도의 프로필 저장 (스키마 변경 없이 기존 구조 활용)
      const savePromises = selectedBodyParts.map((bodyPart) =>
        savePainProfile(user.id, {
          bodyPartId: bodyPart.bodyPartId,
          painLevel: bodyPart.painLevel,
          experienceLevel,
          equipmentAvailable,
        }),
      );

      // 최소 로딩 시간을 보장하여 사용자 경험 향상
      const delayPromise = new Promise((resolve) => setTimeout(resolve, 1500)); // 최소 1.5초 로딩

      const results = await Promise.all(savePromises);
      await delayPromise; // 저장이 빨리 끝나도 최소 1.5초는 로딩 표시

      // 모든 저장이 성공했는지 확인
      const allSuccess = results.every((result) => result.success);
      const firstError = results.find((result) => !result.success);

      if (allSuccess) {
        setSuccess(true);
        // 2초 후 모달 닫기 (상태 초기화는 handleOpenChange에서 처리)
        setTimeout(() => {
          setOpen(false);
        }, 2000);
      } else {
        // 구체적인 에러 메시지 표시
        const errorMessage =
          firstError?.error ||
          "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Submit error:", err);
      const errorMessage =
        err instanceof Error
          ? `저장 중 오류가 발생했습니다: ${err.message}`
          : "저장 중 예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-2xl w-[95vw] md:w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">오늘의 통증 체크</DialogTitle>
        </DialogHeader>

        {isSaving ? (
          <div className="h-[400px] flex items-center justify-center">
            <StepLoader />
          </div>
        ) : dataLoading ? (
          <div className="py-8 text-center">
            <div className="text-muted-foreground mb-2">
              데이터를 불러오는 중...
            </div>
            <div className="text-sm text-muted-foreground">
              잠시만 기다려주세요
            </div>
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
              <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
              다시 시도
            </Button>
          </div>
        ) : success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-primary" strokeWidth={1.5} />
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
                  {step === 2 && "사용 가능한 기구"}
                  {step === 3 && "운동 경험"}
                  {step === 4 && "운동 시간"}
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

            {/* Step 1: 부위 선택 (다중 선택 + 통증 정도) */}
            {step === 1 && (
              <div className="space-y-3">
                <BodyPartSelector
                  bodyParts={bodyParts}
                  selectedBodyParts={selectedBodyParts}
                  onSelectionChange={setSelectedBodyParts}
                  maxSelections={5}
                  disabled={loading || isSaving}
                />
              </div>
            )}

            {/* Step 2: 사용 가능한 기구 */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-muted-foreground mb-4">
                  현재 사용 가능한 기구를 선택해주세요 (복수 선택 가능)
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  💡 사용할 수 있는 기구가 없다면 &apos;없음&apos;을
                  선택해주세요
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
                          : "border-border hover:border-primary/50 hover:bg-accent",
                      )}
                    >
                      <span className="font-medium text-foreground">
                        {equipment.name}
                      </span>
                      {equipmentAvailable.includes(equipment.id) && (
                        <Check
                          className="absolute top-2 right-2 w-5 h-5 text-primary"
                          strokeWidth={1.5}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: 운동 경험 */}
            {step === 3 && (
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
                          : "border-border hover:border-primary/50 hover:bg-accent",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {option.label}
                        </span>
                        {experienceLevel === option.value && (
                          <Check
                            className="w-5 h-5 text-primary"
                            strokeWidth={1.5}
                          />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 🆕 Step 4: 운동 시간 선택 */}
            {step === 4 && (
              <div className="space-y-4">
                <p className="text-muted-foreground mb-4">
                  원하시는 운동 시간을 선택해주세요
                </p>
                <div className="space-y-3">
                  {[
                    {
                      value: 60 as const,
                      label: "60분",
                      description: "짧은 시간 집중",
                    },
                    {
                      value: 90 as const,
                      label: "90분",
                      description: "표준 운동 시간",
                    },
                    {
                      value: 120 as const,
                      label: "120분",
                      description: "충분한 재활 시간",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTotalDurationMinutes(option.value)}
                      data-testid={`duration-${option.value}`}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 transition-all duration-200 text-left",
                        totalDurationMinutes === option.value
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border hover:border-primary/50 hover:bg-accent",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Clock
                              className="w-5 h-5 text-primary"
                              strokeWidth={1.5}
                            />
                            <span className="text-xl font-bold text-foreground">
                              {option.label}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {option.description}
                          </span>
                        </div>
                        {totalDurationMinutes === option.value && (
                          <Check
                            className="w-5 h-5 text-primary"
                            strokeWidth={1.5}
                          />
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
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                  이전
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                disabled={loading}
                data-testid={step === 4 ? "generate-course" : undefined}
                className={cn("flex-1", step === 1 && "ml-auto")}
              >
                {step === 4 ? (
                  loading ? (
                    "코스 생성 중..."
                  ) : (
                    "코스 생성하기"
                  )
                ) : (
                  <>
                    다음
                    <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
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
