import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 공개 경로 정의 (인증 없이 접근 가능)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/gyms(.*)",
  "/courses(.*)", // /courses는 공개 (단, /courses/new는 보호된 경로에서 먼저 체크됨)
  "/instruments(.*)",
  "/api/public(.*)",
]);

// 보호된 경로 정의 (인증 필요)
const isProtectedRoute = createRouteMatcher([
  "/my(.*)",
  "/courses/new(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // 보호된 경로 접근 시 인증 확인
  if (isProtectedRoute(request)) {
    const { userId } = await auth();

    if (!userId) {
      // 미인증 사용자는 로그인 페이지로 리다이렉트
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // 공개 경로가 아닌 경우 기본적으로 보호
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
