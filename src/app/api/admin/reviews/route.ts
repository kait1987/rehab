/**
 * Admin Reviews List API
 * 
 * 리뷰 목록/필터를 제공합니다.
 * 관리자만 접근 가능합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireAdmin, UnauthorizedError } from '@/lib/auth/admin-guard';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    // 필터 조건
    const where = filter === 'deleted' 
      ? { isDeleted: true }
      : filter === 'active'
      ? { isDeleted: false }
      : {};

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          gym: { select: { name: true } },
          user: { select: { email: true } },
          reviewTagMappings: {
            include: { reviewTag: { select: { name: true } } }
          }
        }
      }),
      prisma.review.count({ where })
    ]);

    return NextResponse.json({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Admin reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
