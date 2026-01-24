import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

/**
 * GET /api/admin/mappings/body-parts?bodyPartId=...
 * 특정 부위의 운동 매핑 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const bodyPartId = searchParams.get("bodyPartId");

    // 부위 목록 반환 (드롭다운용)
    if (!bodyPartId) {
      const bodyParts = await prisma.bodyPart.findMany({
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ bodyParts });
    }

    // 특정 부위의 매핑 반환
    const mappings = await prisma.bodyPartExerciseMapping.findMany({
      where: { bodyPartId },
      include: {
        exerciseTemplate: true,
      },
      orderBy: [{ priority: "asc" }, { exerciseTemplate: { name: "asc" } }],
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
  bodyPartId: z.string().uuid(),
  updates: z.array(
    z.object({
      id: z.string().optional(), // Existing mapping ID
      exerciseTemplateId: z.string().uuid(),
      intensityLevel: z.number().min(1).max(5).optional(),
      priority: z.number().min(1).optional(),
      painLevelRange: z.string().optional().nullable(),
    }),
  ),
});

/**
 * POST /api/admin/mappings/body-parts
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
      // 1. Process each update
      for (const update of validated.updates) {
        if (update.id) {
          // Update existing
          await tx.bodyPartExerciseMapping.update({
            where: { id: update.id },
            data: {
              intensityLevel: update.intensityLevel,
              priority: update.priority,
              painLevelRange: update.painLevelRange,
            },
          });
        } else {
          // Create new (if not exists)
          // Check for duplicate constraint [bodyPartId, exerciseTemplateId, painLevelRange]
          // If duplicates allowed logic needed? Schema has unique constraint.
          // For now, assume creation of distinct mapping.

          await tx.bodyPartExerciseMapping.create({
            data: {
              bodyPartId: validated.bodyPartId,
              exerciseTemplateId: update.exerciseTemplateId,
              intensityLevel: update.intensityLevel ?? 2,
              priority: update.priority ?? 1,
              painLevelRange: update.painLevelRange ?? "all",
              isActive: true,
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
 * DELETE /api/admin/mappings/body-parts
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

    await prisma.bodyPartExerciseMapping.delete({
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
