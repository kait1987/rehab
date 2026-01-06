import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase 클라이언트 (Server Component용)
 *
 * 공개 데이터 접근용 클라이언트입니다.
 * 인증이 필요한 데이터는 클라이언트 컴포넌트에서 useClerkSupabaseClient()를 사용하세요.
 *
 * @example
 * ```tsx
 * import { createClient } from '@/lib/supabase/server';
 *
 * export default async function MyPage() {
 *   const supabase = await createClient();
 *   const { data, error } = await supabase
 *     .from('public_instruments')
 *     .select('*');
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}
