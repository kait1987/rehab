"use client";

import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Client Component용)
 *
 * 2025년 4월부터 권장되는 네이티브 통합 방식:
 * - JWT 템플릿 불필요
 * - Clerk 세션 토큰을 Supabase에 자동 전달
 * - useAuth().getToken()으로 현재 세션 토큰 사용
 * - React Hook으로 제공되어 Client Component에서 사용
 *
 * 이 클라이언트는 Clerk 세션 토큰을 Supabase 요청 헤더에 자동으로 주입합니다.
 * RLS 정책에서 auth.jwt()->>'sub'를 사용하여 Clerk 사용자 ID를 확인할 수 있습니다.
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
 *
 * export default function MyComponent() {
 *   const supabase = useClerkSupabaseClient();
 *
 *   async function fetchData() {
 *     const { data, error } = await supabase
 *       .from('tasks')
 *       .select('*');
 *     return data;
 *   }
 *
 *   return <div>...</div>;
 * }
 * ```
 *
 * @see {@link https://clerk.com/docs/guides/development/integrations/databases/supabase Clerk Supabase Integration Guide}
 */
export function useClerkSupabaseClient() {
  const { getToken } = useAuth();

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }

    return createClient(supabaseUrl, supabaseKey, {
      async accessToken() {
        // Clerk 세션 토큰을 Supabase 요청에 자동으로 주입
        // 이 토큰은 Supabase의 auth.jwt() 함수를 통해 접근 가능
        return (await getToken()) ?? null;
      },
    });
  }, [getToken]);

  return supabase;
}
