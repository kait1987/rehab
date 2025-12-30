import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

/**
 * 통증 체크 폼에 필요한 데이터 조회 API
 * 
 * BodyPart와 EquipmentType 목록을 반환합니다.
 * 인증 없이 접근 가능 (공개 데이터)
 */
export async function GET() {
  try {
    // BodyPart와 EquipmentType을 동시에 조회
    const [bodyParts, equipmentTypes] = await Promise.all([
      prisma.bodyPart.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        select: {
          id: true,
          name: true,
          displayOrder: true,
        },
      }),
      prisma.equipmentType.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        select: {
          id: true,
          name: true,
          displayOrder: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        bodyParts,
        equipmentTypes,
      },
    });
  } catch (error) {
    console.error("Get pain check data error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

