import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

/**
 * GET /api/admin/templates/[id]
 * 운동 템플릿 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const template = await prisma.exerciseTemplate.findUnique({
      where: { id },
      include: {
        bodyPart: true,
        bodyPartExerciseMappings: {
          include: {
            bodyPart: true,
          },
        },
        exerciseEquipmentMappings: {
          include: {
            equipmentType: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    // 모든 부위와 기구 타입도 함께 반환 (편집 UI용)
    const [allBodyParts, allEquipmentTypes] = await Promise.all([
      prisma.bodyPart.findMany({ orderBy: { name: "asc" } }),
      prisma.equipmentType.findMany({ orderBy: { name: "asc" } }),
    ]);

    return NextResponse.json({
      template,
      allBodyParts,
      allEquipmentTypes,
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Zod 스키마 for PUT
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  precautions: z.string().optional().nullable(),
  difficultyScore: z.number().min(1).max(5).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  gifUrl: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  bodyPartMappings: z
    .array(
      z.object({
        bodyPartId: z.string().uuid(),
        intensityLevel: z.number().min(1).max(5).optional(),
        priority: z.number().min(1).optional(),
        painLevelRange: z.string().optional().nullable(),
      }),
    )
    .optional(),
  equipmentIds: z.array(z.string().uuid()).optional(),
});

/**
 * PUT /api/admin/templates/[id]
 * 운동 템플릿 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateTemplateSchema.parse(body);

    // 트랜잭션으로 업데이트
    const result = await prisma.$transaction(async (tx) => {
      // 1. 템플릿 기본 정보 업데이트
      const updatedTemplate = await tx.exerciseTemplate.update({
        where: { id },
        data: {
          name: validated.name,
          description: validated.description,
          instructions: validated.instructions,
          precautions: validated.precautions,
          difficultyScore: validated.difficultyScore,
          imageUrl: validated.imageUrl,
          gifUrl: validated.gifUrl,
          videoUrl: validated.videoUrl,
          isActive: validated.isActive,
        },
      });

      // 2. 부위 매핑 업데이트
      if (validated.bodyPartMappings !== undefined) {
        // 기존 매핑 삭제
        await tx.bodyPartExerciseMapping.deleteMany({
          where: { exerciseTemplateId: id },
        });

        // 새 매핑 생성
        if (validated.bodyPartMappings.length > 0) {
          await tx.bodyPartExerciseMapping.createMany({
            data: validated.bodyPartMappings.map((mapping) => ({
              exerciseTemplateId: id,
              bodyPartId: mapping.bodyPartId,
              intensityLevel: mapping.intensityLevel ?? 2,
              priority: mapping.priority ?? 1,
              painLevelRange: mapping.painLevelRange ?? "all",
              isActive: true,
            })),
          });
        }
      }

      // 3. 기구 매핑 업데이트
      if (validated.equipmentIds !== undefined) {
        // 기존 매핑 삭제
        await tx.exerciseEquipmentMapping.deleteMany({
          where: { exerciseTemplateId: id },
        });

        // 새 매핑 생성
        if (validated.equipmentIds.length > 0) {
          await tx.exerciseEquipmentMapping.createMany({
            data: validated.equipmentIds.map((equipmentId) => ({
              exerciseTemplateId: id,
              equipmentTypeId: equipmentId,
            })),
          });
        }
      }

      return updatedTemplate;
    });

    return NextResponse.json({ success: true, template: result });
  } catch (error) {
    console.error("Error updating template:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/templates/[id]
 * 운동 템플릿 삭제 (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Soft delete - isActive를 false로 설정
    await prisma.exerciseTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
