import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * 마이페이지 리다이렉트
 * 
 * 인증이 필요한 페이지입니다.
 * 주문 내역 페이지로 리다이렉트합니다.
 */
export default async function MyPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  redirect("/my/orders");
}

