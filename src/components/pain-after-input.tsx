'use client';

import { useState, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface BodyPartPain {
  bodyPartId: string;
  bodyPartName: string;
  painBefore: number;
  painAfter?: number;
}

interface PainAfterInputProps {
  /** 부위별 통증 정보 */
  bodyParts: BodyPartPain[];
  /** 통증 값 변경 콜백 */
  onChange: (painAfter: Record<string, number>) => void;
  /** 초기 통증 값 (운동 후) */
  initialValues?: Record<string, number>;
  /** 읽기 전용 모드 */
  readOnly?: boolean;
  className?: string;
}

/**
 * 통증 레벨에 따른 색상
 */
function getPainColor(level: number): string {
  if (level <= 2) return 'text-green-600 dark:text-green-400';
  if (level <= 4) return 'text-lime-600 dark:text-lime-400';
  if (level <= 6) return 'text-yellow-600 dark:text-yellow-400';
  if (level <= 8) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * 통증 레벨에 따른 설명
 */
function getPainDescription(level: number): string {
  if (level <= 2) return '거의 없음';
  if (level <= 4) return '약간 있음';
  if (level <= 6) return '보통';
  if (level <= 8) return '심함';
  return '매우 심함';
}

/**
 * 통증 변화 표시
 */
function PainChangeIndicator({
  before,
  after,
}: {
  before: number;
  after: number;
}) {
  const diff = before - after;

  if (diff > 0) {
    return (
      <span className="text-xs text-green-600 dark:text-green-400">
        ↓ {diff}점 감소
      </span>
    );
  } else if (diff < 0) {
    return (
      <span className="text-xs text-red-600 dark:text-red-400">
        ↑ {Math.abs(diff)}점 증가
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">변화 없음</span>
  );
}

/**
 * 개별 부위 통증 입력
 */
function PainSliderItem({
  bodyPart,
  value,
  onChange,
  readOnly,
}: {
  bodyPart: BodyPartPain;
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">{bodyPart.bodyPartName}</span>
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-bold tabular-nums', getPainColor(value))}>
            {value}/10
          </span>
          <span className="text-xs text-muted-foreground">
            ({getPainDescription(value)})
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-6">0</span>
        <Slider
          value={[value]}
          onValueChange={(values) => {
            if (!readOnly) {
              onChange(values[0]);
            }
          }}
          min={0}
          max={10}
          step={1}
          disabled={readOnly}
          className={cn(
            'flex-1',
            readOnly && 'opacity-70 cursor-not-allowed'
          )}
        />
        <span className="text-xs text-muted-foreground w-6">10</span>
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">
          운동 전: {bodyPart.painBefore}/10
        </span>
        <PainChangeIndicator before={bodyPart.painBefore} after={value} />
      </div>
    </div>
  );
}

/**
 * 운동 후 통증 입력 컴포넌트
 */
export function PainAfterInput({
  bodyParts,
  onChange,
  initialValues = {},
  readOnly = false,
  className,
}: PainAfterInputProps) {
  // 초기값 설정: initialValues가 없으면 운동 전 통증값 사용
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const bp of bodyParts) {
      initial[bp.bodyPartName] = initialValues[bp.bodyPartName] ?? bp.painBefore;
    }
    return initial;
  });

  const handleChange = useCallback(
    (bodyPartName: string, value: number) => {
      const newValues = { ...values, [bodyPartName]: value };
      setValues(newValues);
      onChange(newValues);
    },
    [values, onChange]
  );

  if (bodyParts.length === 0) {
    return (
      <div className={cn('text-center text-muted-foreground py-4', className)}>
        선택된 부위가 없습니다.
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-sm text-muted-foreground">
        운동 후 현재 통증 정도를 선택해주세요.
      </div>

      <div className="space-y-6">
        {bodyParts.map((bp) => (
          <PainSliderItem
            key={bp.bodyPartId}
            bodyPart={bp}
            value={values[bp.bodyPartName] ?? bp.painBefore}
            onChange={(value) => handleChange(bp.bodyPartName, value)}
            readOnly={readOnly}
          />
        ))}
      </div>

      {/* 요약 */}
      <div className="pt-4 border-t">
        <div className="text-sm font-medium mb-2">통증 변화 요약</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {bodyParts.map((bp) => {
            const after = values[bp.bodyPartName] ?? bp.painBefore;
            const diff = bp.painBefore - after;
            return (
              <div
                key={bp.bodyPartId}
                className="flex items-center justify-between p-2 bg-muted/50 rounded"
              >
                <span>{bp.bodyPartName}</span>
                <span
                  className={cn(
                    'font-medium',
                    diff > 0
                      ? 'text-green-600 dark:text-green-400'
                      : diff < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-muted-foreground'
                  )}
                >
                  {bp.painBefore} → {after}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * 간단한 통증 입력 (단일 슬라이더)
 */
export function SimplePainInput({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  previousValue,
  className,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  previousValue?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={cn('text-sm font-bold', getPainColor(value))}>
          {value}/{max}
        </span>
      </div>

      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        min={min}
        max={max}
        step={1}
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>없음</span>
        {previousValue !== undefined && (
          <PainChangeIndicator before={previousValue} after={value} />
        )}
        <span>매우 심함</span>
      </div>
    </div>
  );
}
