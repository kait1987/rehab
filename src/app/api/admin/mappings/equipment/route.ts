import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

/**
 * GET /api/admin/mappings/equipment?equipmentId=...
 * 특정 기구의 운동 매핑 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const equipmentId = searchParams.get("equipmentId");

    // 기구 목록 반환 (드롭다운용)
    if (!equipmentId) {
      const equipment = await prisma.equipmentType.findMany({
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ equipment });
    }

    // 특정 기구의 매핑 반환
    const mappings = await prisma.exerciseEquipmentMapping.findMany({
      where: { equipmentTypeId: equipmentId },
      include: {
        exerciseTemplate: true,
      },
      orderBy: {
        exerciseTemplate: { name: "asc" },
      },
    });

    return NextResponse.json({ mappings });
  } catch (error) {
    console.error("Error fetching mappings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Schema for batch update
const updateMappingSchema = z.object({
  equipmentTypeId: z.string().uuid(),
  updates: z.array(
    z.object({
      id: z.string().optional(), // Existing mapping ID
      exerciseTemplateId: z.string().uuid(),
      isRequired: z.boolean().optional(),
    }),
  ),
});

/**
 * POST /api/admin/mappings/equipment
 * 매핑 일괄 업데이트 (Upsert)
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateMappingSchema.parse(body);

    // Transaction to handle batch updates
    await prisma.$transaction(async (tx) => {
      for (const update of validated.updates) {
        if (update.id) {
          // Update existing
          await tx.exerciseEquipmentMapping.update({
            where: { id: update.id },
            data: {
              isRequired: update.isRequired,
            },
          });
        } else {
          // Create new
          await tx.exerciseEquipmentMapping.create({
            data: {
              equipmentTypeId: validated.equipmentTypeId,
              exerciseTemplateId: update.exerciseTemplateId,
              isRequired: update.isRequired ?? false,
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating mappings:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
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
 * DELETE /api/admin/mappings/equipment
 * 매핑 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.exerciseEquipmentMapping.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting mapping:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
