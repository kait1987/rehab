/**
 * Body Parts API
 * GET /api/body-parts - 부위 목록 조회
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET() {
  try {
    const bodyParts = await prisma.bodyPart.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        parentId: true,
        level: true,
      },
      orderBy: [
        { level: 'asc' },
        { displayOrder: 'asc' },
        { name: 'asc' },
      ]
    });

    return NextResponse.json({ bodyParts });
  } catch (error) {
    console.error('Body parts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
