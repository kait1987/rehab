import { redirect } from "next/navigation";

/**
 * 마이페이지 리다이렉트
 * 
 * 주문 내역 페이지로 리다이렉트합니다.
 * 인증 체크는 클라이언트 컴포넌트에서 처리합니다.
 */
export default function MyPage() {
  redirect("/my/orders");
}

