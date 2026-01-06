import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Server Component용)
 *
 * 2025년 4월부터 권장되는 네이티브 통합 방식:
 * - JWT 템플릿 불필요
 * - Clerk 세션 토큰을 Supabase에 자동 전달
 * - auth().getToken()으로 현재 세션 토큰 사용
 * - Server Component 및 Server Actions에서 사용
 *
 * 이 클라이언트는 Clerk 세션 토큰을 Supabase 요청 헤더에 자동으로 주입합니다.
 * RLS 정책에서 auth.jwt()->>'sub'를 사용하여 Clerk 사용자 ID를 확인할 수 있습니다.
 *
 * @example
 * ```tsx
 * // 공식 문서 패턴 (권장)
 * import { createClient } from '@/lib/supabase/server';
 *
 * export default async function MyPage() {
 *   const supabase = await createClient();
 *   const { data, error } = await supabase
 *     .from('instruments')
 *     .select('*');
 *   
 *   if (error) {
 *     return <div>Error: {error.message}</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       {data?.map((item) => (
 *         <div key={item.id}>{item.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 명시적 함수명 사용
 * import { createClerkSupabaseClient } from '@/lib/supabase/server';
 *
 * export default async function MyPage() {
 *   const supabase = await createClerkSupabaseClient();
 *   // ... 동일한 사용법
 * }
 * ```
 *
 * @see {@link https://supabase.com/docs/guides/getting-started/quickstarts/nextjs Supabase Next.js Quickstart}
 * @see {@link https://clerk.com/docs/guides/development/integrations/databases/supabase Clerk Supabase Integration Guide}
 */

/**
 * Supabase 클라이언트 생성 (Clerk 통합)
 *
 * 공식 문서 패턴 호환: Supabase 공식 문서의 `createClient` 함수명 사용
 * @see {@link https://supabase.com/docs/guides/getting-started/quickstarts/nextjs Supabase Next.js Quickstart}
 */
export async function createClient() {
  return await createClerkSupabaseClient();
}

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 생성
 *
 * 명시적인 함수명을 원하는 경우 이 함수를 사용하세요.
 * 이 함수는 `createClient()`와 동일한 기능을 제공합니다.
 */
export async function createClerkSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    async accessToken() {
      return (await auth()).getToken();
    },
  });
}
