import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/**
 * SSO 콜백 페이지
 * 카카오/네이버 OAuth 인증 후 리다이렉트되는 페이지
 */
export default function SSOCallbackPage() {
  return <AuthenticateWithRedirectCallback />;
}
