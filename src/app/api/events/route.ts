/**
 * @file api/events/route.ts
 * @description 사용자 이벤트 트래킹 API
 * 
 * 주요 사용자 액션을 events 테이블에 기록합니다.
 * 보안: 좌표(lat, lng), 이메일 원문 저장 금지
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { auth } from "@clerk/nextjs/server";

// 허용된 이벤트 이름 목록
const ALLOWED_EVENTS = [
  "view_home",
  "start_onboarding",
  "complete_course_generation",
  "view_gym_list",
  "view_gym_detail",
  "submit_review",
  "save_course",
  "click_gym_card",
  "toggle_favorite",
] as const;

// 금지된 속성 키 (보안)
const FORBIDDEN_KEYS = ["lat", "lng", "latitude", "longitude", "email", "password"];

interface EventPayload {
  event_name: string;
  properties?: Record<string, unknown>;
  anonymous_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EventPayload = await request.json();
    const { event_name, properties, anonymous_id } = body;

    // 이벤트 이름 검증
    if (!event_name || !ALLOWED_EVENTS.includes(event_name as typeof ALLOWED_EVENTS[number])) {
      return NextResponse.json(
        { error: "유효하지 않은 이벤트 이름입니다." },
        { status: 400 }
      );
    }

    // 금지된 키 필터링 (좌표, 이메일 저장 금지)
    let sanitizedProperties = properties || {};
    if (properties) {
      sanitizedProperties = Object.fromEntries(
        Object.entries(properties).filter(
          ([key]) => !FORBIDDEN_KEYS.includes(key.toLowerCase())
        )
      );
    }

    // 사용자 ID 가져오기 (로그인한 경우)
    const { userId: clerkUserId } = await auth();
    
    // Supabase 클라이언트
    const supabase = getServiceRoleClient();
    
    // DB에서 실제 user_id 조회 (clerk_id로)
    let dbUserId: string | null = null;
    if (clerkUserId) {
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("email", clerkUserId) // Clerk ID가 email 필드에 저장된 경우
        .single();
      
      if (user) {
        dbUserId = user.id;
      }
    }

    // 이벤트 저장
    const { error } = await supabase.from("events").insert({
      user_id: dbUserId,
      anonymous_id: anonymous_id || null,
      event_name,
      event_data: sanitizedProperties,
      event_time: new Date().toISOString(),
    });

    if (error) {
      console.error("Event insert error:", error);
      return NextResponse.json(
        { error: "이벤트 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Event tracking error:", error);
    return NextResponse.json(
      { error: "이벤트 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
