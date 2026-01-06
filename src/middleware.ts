import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 보호할 경로만 명시
const isProtectedRoute = createRouteMatcher(["/my(.*)"]);

export default clerkMiddleware((auth, req) => {
  // 보호된 경로일 때만 protect() 호출
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

// matcher 설정 (정적 파일, Next.js 내부 파일 제외)
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
