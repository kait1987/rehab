/**
 * @file useAnalytics.ts
 * @description 사용자 이벤트 트래킹 훅
 * 
 * 주요 사용자 액션을 /api/events로 전송합니다.
 * anonymous_id는 localStorage에 저장됩니다.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

// 허용된 이벤트 타입
type EventName =
  | "view_home"
  | "start_onboarding"
  | "complete_course_generation"
  | "view_gym_list"
  | "view_gym_detail"
  | "submit_review"
  | "save_course"
  | "click_gym_card"
  | "toggle_favorite";

// 이벤트 속성 타입 (좌표/이메일 제외)
type EventProperties = Record<string, string | number | boolean | null>;

// anonymous_id 생성 및 저장
function getAnonymousId(): string {
  if (typeof window === "undefined") return "";
  
  const key = "rehab_anonymous_id";
  let id = localStorage.getItem(key);
  
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    try {
      localStorage.setItem(key, id);
    } catch {
      // 프라이빗 모드에서 실패할 수 있음
    }
  }
  
  return id;
}

export function useAnalytics() {
  const { isSignedIn } = useAuth();
  const [anonymousId, setAnonymousId] = useState<string>("");

  useEffect(() => {
    setAnonymousId(getAnonymousId());
  }, []);

  const trackEvent = useCallback(
    async (eventName: EventName, properties?: EventProperties) => {
      try {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_name: eventName,
            properties,
            anonymous_id: isSignedIn ? undefined : anonymousId,
          }),
        });
      } catch (error) {
        // 에러 발생 시 조용히 실패 (사용자 경험에 영향 없음)
        console.debug("Event tracking failed:", error);
      }
    },
    [isSignedIn, anonymousId]
  );

  return { trackEvent };
}

// 간편 사용을 위한 개별 훅
export function useTrackPageView(pageName: EventName) {
  const { trackEvent } = useAnalytics();
  
  useEffect(() => {
    trackEvent(pageName);
  }, [trackEvent, pageName]);
}
