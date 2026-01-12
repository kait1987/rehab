import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // E2E 테스트 바이패스
  if (process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true') {
    return NextResponse.next();
  }

  // Admin 경로 보호
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const { userId, sessionClaims } = await auth();
    
    // 비로그인 사용자
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    
    // 관리자 권한 확인 (Clerk publicMetadata.role)
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

