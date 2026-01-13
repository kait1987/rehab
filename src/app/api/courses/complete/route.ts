/**
 * P3-AI-03: 코스 완료 API
 * POST /api/courses/complete
 * 
 * 운동별 완료/스킵/수정 정보를 배치로 저장합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// 허용된 상태값
const EXERCISE_STATUS = ['completed', 'skipped', 'modified'] as const;

// 개별 운동 스키마
const exerciseLogSchema = z.object({
  exerciseTemplateId: z.string().uuid(),
  status: z.enum(EXERCISE_STATUS),
  actualDuration: z.number().int().positive().optional(),
  userRating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional()
});

// 요청 본문 스키마
const completeBodySchema = z.object({
  courseId: z.string().uuid(),
  exercises: z.array(exerciseLogSchema).min(1).max(50),
  overallRating: z.number().int().min(1).max(5).optional(),
  painAfter: z.number().int().min(1).max(10).optional()
});

/**
 * POST: 코스 완료 로그 저장
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 요청 본문 파싱
    const body = await request.json();
    const validation = completeBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: '입력 데이터가 올바르지 않습니다.',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { courseId, exercises, overallRating, painAfter } = validation.data;

    // 코스 존재 확인
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, userId: true }
    });

    if (!course) {
      return NextResponse.json({ error: '코스를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 배치 저장 (트랜잭션)
    const created = await prisma.$transaction(
      exercises.map(exercise => 
        prisma.courseCompletionLog.create({
          data: {
            userId: user.id,
            courseId,
            exerciseTemplateId: exercise.exerciseTemplateId,
            status: exercise.status,
            actualDuration: exercise.actualDuration || null,
            userRating: exercise.userRating || overallRating || null,
            painAfter: painAfter || null,
            notes: exercise.notes || null
          },
          select: { id: true, status: true, exerciseTemplateId: true }
        })
      )
    );

    // 통계 계산
    const stats = {
      total: created.length,
      completed: created.filter(c => c.status === 'completed').length,
      skipped: created.filter(c => c.status === 'skipped').length,
      modified: created.filter(c => c.status === 'modified').length,
      completionRate: Math.round(
        (created.filter(c => c.status === 'completed').length / created.length) * 100
      )
    };

    return NextResponse.json({
      success: true,
      message: `${created.length}개의 운동 로그가 저장되었습니다.`,
      data: {
        logs: created,
        stats
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Course Complete Error:', error);
    return NextResponse.json(
      { error: '코스 완료 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
