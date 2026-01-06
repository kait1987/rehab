import { createClient } from "@supabase/supabase-js";

/**
 * Supabase 클라이언트 생성 (레거시)
 * 
 * 공개 데이터 접근용 클라이언트입니다.
 * 인증이 필요한 데이터는 클라이언트 컴포넌트에서 직접 처리하세요.
 */
export const createSupabaseClient = async () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
