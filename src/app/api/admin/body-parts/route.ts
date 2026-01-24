import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

/**
 * GET /api/admin/body-parts
 * 모든 부위 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const bodyParts = await prisma.bodyPart.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({ bodyParts });
  } catch (error) {
    console.error("Error fetching body parts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Schema
const bodyPartSchema = z.object({
  name: z.string().min(1),
  displayOrder: z.number().int(),
  isActive: z.boolean().optional(),
});

/**
 * POST /api/admin/body-parts
 * 부위 추가
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validated = bodyPartSchema.parse(body);

    const newBodyPart = await prisma.bodyPart.create({
      data: {
        name: validated.name,
        displayOrder: validated.displayOrder,
        isActive: validated.isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, bodyPart: newBodyPart });
  } catch (error) {
    console.error("Error creating body part:", error);
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
 * PUT /api/admin/body-parts
 * 부위 수정 (ID via query param)
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
    // allow partial updates
    const validated = bodyPartSchema.partial().parse(body);

    const updated = await prisma.bodyPart.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ success: true, bodyPart: updated });
  } catch (error) {
    console.error("Error updating body part:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/body-parts
 * 부위 삭제 (ID via query param)
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

    // Check relations?
    // onDelete cascade might remove all mappings!
    // Safe deleting? or just let it cascade?
    // Prisma schema says:
    // bodyPartExerciseMappings -> onDelete: Cascade.
    // exerciseTemplates -> onDelete: Restrict? No relation attribute means restrict by default if referenced.
    // ExerciseTemplate has `bodyPartId`.
    // Let's check schema.

    // In schema:
    // model ExerciseTemplate { ... bodyPart BodyPart @relation(fields: [bodyPartId], references: [id]) ... }
    // No onDelete specified -> Default is usually Restrict or NoAction in generic SQL, but Prisma differentiates.
    // Actually in PostgreSQL default is NO ACTION (fail).
    // So if templates use this body part, delete will fail. Which is GOOD.

    await prisma.bodyPart.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting body part:", error);
    // Prisma err P2003 (Foreign key constraint failed)
    return NextResponse.json(
      { error: "Cannot delete body part that is in use." },
      { status: 400 },
    );
  }
}
