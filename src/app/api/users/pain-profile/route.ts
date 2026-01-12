/**
 * P2-3-S1-01/02: 부상 부위 프로필 API
 * GET /api/users/pain-profile - 현재 사용자 프로필 조회
 * POST /api/users/pain-profile - 프로필 생성/수정 (upsert)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// POST 요청 스키마
const painProfileSchema = z.object({
  bodyPartId: z.string().uuid(),
  painLevel: z.number().min(1).max(5),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  equipmentAvailable: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ items: [] });
    }

    // 부상 프로필 조회 (부위 정보 포함)
    const profiles = await prisma.userPainProfile.findMany({
      where: { userId: user.id },
      include: {
        bodyPart: {
          select: {
            id: true,
            name: true,
            parentId: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const items = profiles.map((p) => ({
      id: p.id,
      bodyPartId: p.bodyPartId,
      bodyPartName: p.bodyPart.name,
      painLevel: p.painLevel,
      experienceLevel: p.experienceLevel,
      equipmentAvailable: p.equipmentAvailable,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Pain profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 요청 본문 파싱
    const body = await request.json();
    const validation = painProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { bodyPartId, painLevel, experienceLevel, equipmentAvailable } = validation.data;

    // 부위 존재 확인
    const bodyPart = await prisma.bodyPart.findUnique({
      where: { id: bodyPartId },
      select: { id: true, name: true }
    });

    if (!bodyPart) {
      return NextResponse.json({ error: 'Body part not found' }, { status: 404 });
    }

    // 기존 프로필 확인 (upsert)
    const existingProfile = await prisma.userPainProfile.findFirst({
      where: {
        userId: user.id,
        bodyPartId,
      }
    });

    let profile;
    if (existingProfile) {
      // 업데이트
      profile = await prisma.userPainProfile.update({
        where: { id: existingProfile.id },
        data: {
          painLevel,
          experienceLevel: experienceLevel || null,
          equipmentAvailable: equipmentAvailable || [],
        }
      });
    } else {
      // 생성
      profile = await prisma.userPainProfile.create({
        data: {
          userId: user.id,
          bodyPartId,
          painLevel,
          experienceLevel: experienceLevel || null,
          equipmentAvailable: equipmentAvailable || [],
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        bodyPartId: profile.bodyPartId,
        bodyPartName: bodyPart.name,
        painLevel: profile.painLevel,
        experienceLevel: profile.experienceLevel,
        equipmentAvailable: profile.equipmentAvailable,
      },
      message: existingProfile ? '프로필이 수정되었습니다.' : '프로필이 저장되었습니다.'
    }, { status: existingProfile ? 200 : 201 });

  } catch (error) {
    console.error('Pain profile POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
