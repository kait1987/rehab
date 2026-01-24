import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

/**
 * GET /api/admin/equipment
 * 모든 기구 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const equipment = await prisma.equipmentType.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({ equipment });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Schema
const equipmentSchema = z.object({
  name: z.string().min(1),
  displayOrder: z.number().int(),
  isActive: z.boolean().optional(),
});

/**
 * POST /api/admin/equipment
 * 기구 추가
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validated = equipmentSchema.parse(body);

    const newEquipment = await prisma.equipmentType.create({
      data: {
        name: validated.name,
        displayOrder: validated.displayOrder,
        isActive: validated.isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, equipment: newEquipment });
  } catch (error) {
    console.error("Error creating equipment:", error);
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
 * PUT /api/admin/equipment
 * 기구 수정 (ID via query param)
 */
export async function PUT(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "ID required" }, { status: 400 });

    const body = await request.json();
    const validated = equipmentSchema.partial().parse(body);

    const updated = await prisma.equipmentType.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ success: true, equipment: updated });
  } catch (error) {
    console.error("Error updating equipment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/equipment
 * 기구 삭제 (ID via query param)
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
    if (!id)
      return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Check usage
    // exerciseEquipmentMappings -> onDelete: Cascade
    // But safe to delete if we warn user.

    await prisma.equipmentType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json(
      { error: "Cannot delete equipment that is in use." },
      { status: 400 },
    );
  }
}
