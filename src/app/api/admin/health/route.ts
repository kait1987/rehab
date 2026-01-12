/**
 * Admin Health Check API
 * 
 * 관리자 API 가드 패턴 샘플입니다.
 * 관리자만 접근 가능합니다.
 */

import { NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/auth/admin-guard';

export async function GET() {
  try {
    const { userId, role } = await requireAdmin();

    return NextResponse.json({
      ok: true,
      role,
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
