import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";

/**
 * GET /api/admin/stats
 * 대시보드 통계 조회
 * Query params:
 *   - type: 'summary' | 'trends' | 'popular'
 */
export async function GET(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "summary";

    switch (type) {
      case "summary":
        return await getSummaryStats();
      case "trends":
        return await getCourseTrends();
      case "popular":
        return await getPopularExercises();
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// 요약 통계
async function getSummaryStats() {
  const [
    totalUsers,
    totalExercises,
    totalCourses,
    totalBodyParts,
    totalEquipment,
    recentCourses,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.exerciseTemplate.count({ where: { isActive: true } }),
    prisma.course.count(),
    prisma.bodyPart.count({ where: { isActive: true } }),
    prisma.equipmentType.count({ where: { isActive: true } }),
    prisma.course.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    }),
  ]);

  return NextResponse.json({
    summary: {
      totalUsers,
      totalExercises,
      totalCourses,
      totalBodyParts,
      totalEquipment,
      recentCourses,
    },
  });
}

// 코스 생성 추이 (최근 30일)
async function getCourseTrends() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const courses = await prisma.course.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Group by date
  const trendMap = new Map<string, number>();

  // Initialize all dates with 0
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split("T")[0];
    trendMap.set(dateStr, 0);
  }

  // Count courses per day
  courses.forEach((course) => {
    const dateStr = course.createdAt.toISOString().split("T")[0];
    trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
  });

  const trends = Array.from(trendMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return NextResponse.json({ trends });
}

// 인기 운동 TOP 10
async function getPopularExercises() {
  // CourseExercise 테이블에서 exerciseTemplateId 기준으로 그룹화
  const popularRaw = await prisma.courseExercise.groupBy({
    by: ["exerciseTemplateId"],
    _count: {
      exerciseTemplateId: true,
    },
    orderBy: {
      _count: {
        exerciseTemplateId: "desc",
      },
    },
    take: 10,
  });

  // Get exercise details
  const exerciseIds = popularRaw.map((item) => item.exerciseTemplateId);
  const exercises = await prisma.exerciseTemplate.findMany({
    where: {
      id: { in: exerciseIds },
    },
    include: {
      bodyPart: true,
    },
  });

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  const popular = popularRaw.map((item) => {
    const exercise = exerciseMap.get(item.exerciseTemplateId);
    return {
      id: item.exerciseTemplateId,
      name: exercise?.name || "Unknown",
      bodyPart: exercise?.bodyPart?.name || "-",
      count: item._count.exerciseTemplateId,
    };
  });

  return NextResponse.json({ popular });
}
