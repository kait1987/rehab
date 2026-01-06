import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * 마이페이지 리다이렉트
 *
 * 주문 내역 페이지로 리다이렉트합니다.
 * 인증 체크는 서버 컴포넌트에서 처리합니다.
 */
export default async function MyPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  redirect("/my/orders");
}
