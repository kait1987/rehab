/**
 * Admin Review Status API
 * 
 * 리뷰 상태 변경 (숨김/삭제/승인)을 제공합니다.
 * 관리자만 접근 가능합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireAdmin, UnauthorizedError } from '@/lib/auth/admin-guard';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const { action } = body;

    if (!['hide', 'delete', 'approve'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use: hide, delete, approve' },
        { status: 400 }
      );
    }

    let newStatus: boolean;
    
    switch (action) {
      case 'hide':
      case 'delete':
        newStatus = true; // isDeleted = true
        break;
      case 'approve':
        newStatus = false; // isDeleted = false
        break;
      default:
        newStatus = false;
    }

    await prisma.review.update({
      where: { id },
      data: { isDeleted: newStatus }
    });

    return NextResponse.json({ 
      success: true, 
      newStatus: newStatus ? 'deleted' : 'active'
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Admin review PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
