import { redirect } from "next/navigation";

/**
 * 마이페이지 리다이렉트
 * 
 * 주문 내역 페이지로 리다이렉트합니다.
 */
export default function MyPage() {
  redirect("/my/orders");
}

