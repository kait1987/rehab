"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * 카카오/네이버 소셜 로그인 버튼 컴포넌트
 * Clerk Custom OAuth Provider 사용
 */
export function SocialLoginButtons() {
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const [loading, setLoading] = useState<string | null>(null);

  const handleOAuth = async (
    provider: "oauth_custom_kakao" | "oauth_custom_naver",
  ) => {
    if (!signIn || !signUp) return;
    setLoading(provider);

    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err) {
      console.error("OAuth error:", err);
      setLoading(null);
    }
  };

  if (!signInLoaded || !signUpLoaded) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-10 bg-muted animate-pulse rounded-md" />
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 카카오 로그인 버튼 */}
      <Button
        type="button"
        variant="outline"
        onClick={() => handleOAuth("oauth_custom_kakao")}
        disabled={loading !== null}
        className="h-11 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] border-[#FEE500] hover:border-[#FDD835] font-medium"
      >
        {loading === "oauth_custom_kakao" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <KakaoIcon className="w-5 h-5 mr-2" />
        )}
        카카오로 계속하기
      </Button>

      {/* 네이버 로그인 버튼 */}
      <Button
        type="button"
        variant="outline"
        onClick={() => handleOAuth("oauth_custom_naver")}
        disabled={loading !== null}
        className="h-11 bg-[#03C75A] hover:bg-[#02B350] text-white border-[#03C75A] hover:border-[#02B350] font-medium"
      >
        {loading === "oauth_custom_naver" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <NaverIcon className="w-5 h-5 mr-2" />
        )}
        네이버로 계속하기
      </Button>
    </div>
  );
}

// 카카오 아이콘
function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.88 5.33 4.7 6.77-.15.54-.97 3.47-1 3.64 0 .1.04.2.13.26.08.05.19.06.28.02.38-.11 4.4-2.91 5.11-3.4.26.02.52.03.78.03 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8" />
    </svg>
  );
}

// 네이버 아이콘
function NaverIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" />
    </svg>
  );
}
