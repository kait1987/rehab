import { NextResponse } from "next/server";

/**
 * Clerk 사용자 동기화 API (임시 비활성화)
 * 
 * Edge Runtime 호환성 문제로 인해 임시로 비활성화되었습니다.
 * 인증은 Client Component에서만 처리합니다.
 */
export async function POST() {
  return NextResponse.json({ ok: true });
}
