/**
 * 환경 변수 확인 API
 * Next.js 환경에서 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 값을 확인합니다.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  
  return NextResponse.json({
    NEXT_PUBLIC_NAVER_MAP_CLIENT_ID: clientId || 'undefined',
    exists: !!clientId,
  });
}

