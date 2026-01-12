/**
 * Admin Templates List API
 * 
 * 템플릿 목록/검색/페이지네이션을 제공합니다.
 * 관리자만 접근 가능합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireAdmin, UnauthorizedError } from '@/lib/auth/admin-guard';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // 검색 조건
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // 병렬로 데이터와 카운트 조회
    const [templates, total] = await Promise.all([
      prisma.exerciseTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          intensityLevel: true,
          isActive: true,
          bodyPart: {
            select: { name: true }
          }
        }
      }),
      prisma.exerciseTemplate.count({ where })
    ]);

    return NextResponse.json({
      templates,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    console.error('Admin templates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 새 템플릿 생성
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (!body.name || !body.bodyPartId) {
      return NextResponse.json(
        { error: 'Name and bodyPartId are required' },
        { status: 400 }
      );
    }

    const template = await prisma.exerciseTemplate.create({
      data: {
        name: body.name,
        description: body.description || null,
        bodyPartId: body.bodyPartId,
        intensityLevel: body.intensityLevel || 2,
        durationMinutes: body.durationMinutes || 5,
        reps: body.reps || 10,
        sets: body.sets || 3,
        restSeconds: body.restSeconds || 30,
        instructions: body.instructions || null,
        precautions: body.precautions || null,
        isActive: body.isActive ?? true,
      }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Admin template POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
