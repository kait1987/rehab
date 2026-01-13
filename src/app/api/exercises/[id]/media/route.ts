/**
 * P3-M2-02: 운동 미디어 조회 API
 * GET /api/exercises/[id]/media
 * 
 * 운동 템플릿의 미디어(이미지/Lottie) 및 자세 가이드를 조회합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

interface MediaItem {
  url: string;
  mediaType: string;
  metadata: unknown;
}

interface PostureGuideItem {
  stepNumber: number;
  instruction: string;
  commonMistake: string | null;
  correction: string | null;
  imageUrl: string | null;
}

interface MediaResponse {
  thumbnail: MediaItem | null;
  startPose: MediaItem | null;
  endPose: MediaItem | null;
  motion: MediaItem | null;
  postureGuide: PostureGuideItem[];
}

/**
 * GET: 운동 미디어 및 자세 가이드 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exerciseTemplateId } = await params;

    // UUID 유효성 검사
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(exerciseTemplateId)) {
      return NextResponse.json(
        { error: '유효하지 않은 운동 ID입니다.' },
        { status: 400 }
      );
    }

    // 1. 운동 템플릿 존재 확인
    const exercise = await prisma.exerciseTemplate.findUnique({
      where: { id: exerciseTemplateId },
      select: { id: true, name: true }
    });

    if (!exercise) {
      return NextResponse.json(
        { error: '운동을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 2. 미디어 조회
    const media = await prisma.exerciseMedia.findMany({
      where: {
        exerciseTemplateId,
        isActive: true
      },
      orderBy: { order: 'asc' }
    });

    // 3. 자세 가이드 조회
    const guides = await prisma.postureGuide.findMany({
      where: { exerciseTemplateId },
      orderBy: { stepNumber: 'asc' }
    });

    // 4. purpose별 매핑
    const findMedia = (purpose: string): MediaItem | null => {
      const item = media.find(m => m.purpose === purpose);
      if (!item) return null;
      return {
        url: item.url,
        mediaType: item.mediaType,
        metadata: item.metadata
      };
    };

    const response: MediaResponse = {
      thumbnail: findMedia('thumbnail'),
      startPose: findMedia('start_pose'),
      endPose: findMedia('end_pose'),
      motion: findMedia('motion'),
      postureGuide: guides.map(g => ({
        stepNumber: g.stepNumber,
        instruction: g.instruction,
        commonMistake: g.commonMistake,
        correction: g.correction,
        imageUrl: g.imageUrl
      }))
    };

    return NextResponse.json({
      success: true,
      exerciseId: exerciseTemplateId,
      exerciseName: exercise.name,
      ...response
    });

  } catch (error) {
    console.error('Exercise Media API Error:', error);
    return NextResponse.json(
      { error: '미디어 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
