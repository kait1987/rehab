/**
 * Admin Template CRUD API
 * 
 * 개별 템플릿 조회/수정/삭제를 제공합니다.
 * 관리자만 접근 가능합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireAdmin, UnauthorizedError } from '@/lib/auth/admin-guard';

// GET - 개별 템플릿 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const template = await prisma.exerciseTemplate.findUnique({
      where: { id },
      include: {
        bodyPart: { select: { id: true, name: true } },
        exerciseEquipmentMappings: {
          include: { equipmentType: { select: { id: true, name: true } } }
        }
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Admin template GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - 템플릿 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const template = await prisma.exerciseTemplate.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        bodyPartId: body.bodyPartId,
        intensityLevel: body.intensityLevel,
        durationMinutes: body.durationMinutes,
        reps: body.reps,
        sets: body.sets,
        restSeconds: body.restSeconds,
        instructions: body.instructions,
        precautions: body.precautions,
        isActive: body.isActive,
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Admin template PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - 템플릿 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await prisma.exerciseTemplate.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Admin template DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
