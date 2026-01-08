/**
 * @file use-swipe.ts
 * @description 안전한 스와이프 제스처 훅
 *
 * 터치 이벤트를 분석하여 좌우 스와이프를 감지합니다.
 * 스크롤 및 브라우저 제스처와의 충돌을 방지하기 위한 안전장치가 포함되어 있습니다.
 *
 * @features
 * - 각도 감지: 수평 움직임이 우세할 때만 스와이프로 인식
 * - 임계값(Threshold): 일정 거리 이상 이동 시에만 발동
 * - 터치 영역 제한: 훅을 사용하는 컴포넌트 내부에서만 동작
 */

'use client';

import { TouchEvent, useState, useRef } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // 스와이프 인식 최소 거리 (px)
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }: SwipeOptions) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  
  // 스와이프 중인지 여부 (시각적 피드백용)
  const [swiping, setSwiping] = useState(false);
  const [offset, setOffset] = useState(0);

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    setSwiping(true);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return;

    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    
    const diffX = touchStartX.current - currentX;
    const diffY = touchStartY.current - currentY;

    // 1. 각도 검사: 수직 이동이 수평 이동보다 크면 스와이프 무시 (스크롤 허용)
    if (Math.abs(diffY) > Math.abs(diffX)) {
      return;
    }

    // 수평 이동 중이면 브라우저 기본 동작(뒤로가기 등) 방지 가능
    // e.preventDefault(); // 필요 시 주석 해제 (주의: 스크롤도 막힐 수 있음)

    setOffset(diffX);
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchStartY.current) {
      reset();
      return;
    }

    // 임계값 체크
    if (Math.abs(offset) > threshold) {
      if (offset > 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (offset < 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    reset();
  };

  const reset = () => {
    touchStartX.current = null;
    touchStartY.current = null;
    setSwiping(false);
    setOffset(0);
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swiping, // 애니메이션 등에 활용 가능
    offset,  // 실시간 이동 거리
  };
}
