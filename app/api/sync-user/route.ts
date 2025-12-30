import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

/**
 * Clerk 사용자를 Prisma users 테이블에 동기화하는 API
 *
 * 클라이언트에서 로그인 후 이 API를 호출하여 사용자 정보를 로컬 PostgreSQL에 저장합니다.
 * 이미 존재하는 경우 업데이트하고, 없으면 새로 생성합니다.
 */
export async function POST() {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clerk에서 사용자 정보 가져오기
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 사용자 이름 결정
    const userName =
      clerkUser.fullName ||
      clerkUser.username ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      "Unknown";

    // 이메일 추출
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress || null;

    // Prisma를 사용하여 사용자 정보 동기화 (upsert)
    const user = await prisma.user.upsert({
      where: {
        clerkId: clerkUser.id,
      },
      update: {
        name: userName,
        email: userEmail,
        updatedAt: new Date(),
      },
      create: {
        clerkId: clerkUser.id,
        name: userName,
        email: userEmail,
      },
    });

    return NextResponse.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("Sync user error:", error);
    
    // Prisma 에러 처리
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { error: "Failed to sync user", details: errorMessage },
      { status: 500 }
    );
  }
}
