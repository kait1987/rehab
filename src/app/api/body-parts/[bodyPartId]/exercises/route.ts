import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

/**
 * 부위별 운동 템플릿 매핑 조회 API
 * 
 * 특정 부위에 대한 운동 템플릿 목록을 조회합니다.
 * 통증 정도 범위(painLevelRange)와 사용 가능한 기구로 필터링할 수 있습니다.
 * 
 * @param request NextRequest
 * @param params { bodyPartId: string }
 * @returns 운동 템플릿 목록
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bodyPartId: string }> }
) {
  try {
    const { bodyPartId } = await params;
    
    // URL 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const painLevel = searchParams.get("painLevel");
    const equipmentAvailableParam = searchParams.get("equipmentAvailable");
    
    // bodyPartId 검증
    if (!bodyPartId || typeof bodyPartId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "부위 ID가 필요합니다.",
        },
        { status: 400 }
      );
    }

    // painLevel 검증 (선택적, 있으면 1-5 범위)
    let painLevelNum: number | null = null;
    if (painLevel) {
      painLevelNum = parseInt(painLevel, 10);
      if (isNaN(painLevelNum) || painLevelNum < 1 || painLevelNum > 5) {
        return NextResponse.json(
          {
            success: false,
            error: "통증 정도는 1-5 사이의 숫자여야 합니다.",
          },
          { status: 400 }
        );
      }
    }

    // equipmentAvailable 파싱 (선택적, 쉼표로 구분된 문자열)
    const equipmentAvailable: string[] = equipmentAvailableParam
      ? equipmentAvailableParam.split(",").filter(Boolean)
      : [];

    // BodyPart 존재 확인
    const bodyPart = await prisma.bodyPart.findUnique({
      where: { id: bodyPartId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!bodyPart) {
      return NextResponse.json(
        {
          success: false,
          error: "해당 부위를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // BodyPartExerciseMapping 조회 (해당 부위의 모든 매핑)
    const mappings = await prisma.bodyPartExerciseMapping.findMany({
      where: {
        bodyPartId: bodyPartId,
        isActive: true,
      },
      include: {
        exerciseTemplate: {
          include: {
            exerciseEquipmentMappings: {
              include: {
                equipmentType: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { priority: "asc" }, // 우선순위 오름차순 (낮을수록 우선)
      ],
    });

    // painLevelRange 매칭 함수
    const matchesPainLevelRange = (
      painLevelRange: string | null | undefined,
      userPainLevel: number
    ): boolean => {
      if (!painLevelRange || painLevelRange === "all") {
        return true;
      }

      if (painLevelRange.includes("-")) {
        // 범위 형식: '1-2', '3-4'
        const [min, max] = painLevelRange.split("-").map(Number);
        return userPainLevel >= min && userPainLevel <= max;
      }

      // 단일 값: '5'
      const level = Number(painLevelRange);
      return userPainLevel === level;
    };

    // 필터링된 운동 목록
    const filteredExercises = mappings
      .filter((mapping) => {
        // painLevelRange 필터링 (painLevel이 제공된 경우만)
        if (painLevelNum !== null) {
          if (
            !matchesPainLevelRange(
              mapping.painLevelRange,
              painLevelNum
            )
          ) {
            return false;
          }
        }

        // 기구 필터링 (equipmentAvailable이 제공된 경우만)
        if (equipmentAvailable.length > 0) {
          const requiredEquipment = mapping.exerciseTemplate.exerciseEquipmentMappings
            .filter((eem) => eem.isRequired)
            .map((eem) => eem.equipmentType.name);

          // 필수 기구가 모두 사용 가능한 기구 목록에 포함되어야 함
          if (requiredEquipment.length > 0) {
            const hasRequiredEquipment = requiredEquipment.every((eq) =>
              equipmentAvailable.includes(eq)
            );
            if (!hasRequiredEquipment) {
              return false;
            }
          }
        }

        // 운동 템플릿이 활성화되어 있어야 함
        return mapping.exerciseTemplate.isActive;
      })
      .map((mapping) => {
        const template = mapping.exerciseTemplate;
        return {
          id: template.id,
          name: template.name,
          description: template.description || null,
          priority: mapping.priority,
          intensityLevel: mapping.intensityLevel || template.intensityLevel || null,
          durationMinutes: template.durationMinutes || null,
          reps: template.reps || null,
          sets: template.sets || null,
          restSeconds: template.restSeconds || null,
          difficultyScore: template.difficultyScore || null,
          painLevelRange: mapping.painLevelRange || null,
          instructions: template.instructions || null,
          precautions: template.precautions || null,
          contraindications: template.contraindications || [],
          equipment: template.exerciseEquipmentMappings.map((eem) => ({
            id: eem.equipmentType.id,
            name: eem.equipmentType.name,
            isRequired: eem.isRequired,
          })),
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        bodyPartId: bodyPart.id,
        bodyPartName: bodyPart.name,
        exercises: filteredExercises,
        totalCount: filteredExercises.length,
        filters: {
          painLevel: painLevelNum,
          equipmentAvailable: equipmentAvailable.length > 0 ? equipmentAvailable : null,
        },
      },
    });
  } catch (error) {
    console.error("Get body part exercises error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "운동 템플릿을 조회하는 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

