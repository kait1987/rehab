import { createClient } from "@supabase/supabase-js";

/**
 * 공개 데이터용 Supabase 클라이언트
 *
 * 인증이 필요 없는 공개 데이터에 접근할 때 사용합니다.
 * RLS 정책이 'to anon'인 데이터만 접근 가능합니다.
 *
 * @example
 * ```tsx
 * import { supabase } from '@/lib/supabase/client';
 *
 * // 공개 게시글 조회
 * const { data } = await supabase
 *   .from('public_posts')
 *   .select('*');
 * ```
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
