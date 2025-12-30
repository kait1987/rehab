-- 예시: RLS 정책 설정 (프로덕션용)
-- 
-- ⚠️ 주의: 이 파일은 예시입니다. 개발 환경에서는 RLS를 비활성화하는 것을 권장합니다.
-- 프로덕션 환경에 배포하기 전에 적절한 RLS 정책을 검토하고 적용하세요.
--
-- 참고: https://clerk.com/docs/guides/development/integrations/databases/supabase

-- ============================================
-- users 테이블 RLS 정책 예시
-- ============================================

-- RLS 활성화
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회 가능
-- CREATE POLICY "Users can view their own data"
-- ON public.users
-- FOR SELECT
-- TO authenticated
-- USING (
--   (SELECT auth.jwt()->>'sub') = clerk_id
-- );

-- 사용자는 자신의 데이터만 수정 가능
-- CREATE POLICY "Users can update their own data"
-- ON public.users
-- FOR UPDATE
-- TO authenticated
-- USING (
--   (SELECT auth.jwt()->>'sub') = clerk_id
-- )
-- WITH CHECK (
--   (SELECT auth.jwt()->>'sub') = clerk_id
-- );

-- 사용자는 자신의 데이터만 삭제 가능
-- CREATE POLICY "Users can delete their own data"
-- ON public.users
-- FOR DELETE
-- TO authenticated
-- USING (
--   (SELECT auth.jwt()->>'sub') = clerk_id
-- );

-- ============================================
-- tasks 테이블 RLS 정책 예시 (공식 문서 참고)
-- ============================================

-- 예시 테이블 생성 (이미 존재하는 경우 주석 처리)
-- CREATE TABLE IF NOT EXISTS public.tasks (
--   id SERIAL PRIMARY KEY,
--   name TEXT NOT NULL,
--   user_id TEXT NOT NULL DEFAULT (SELECT auth.jwt()->>'sub'),
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
-- );

-- RLS 활성화
-- ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 작업만 조회 가능
-- CREATE POLICY "User can view their own tasks"
-- ON public.tasks
-- FOR SELECT
-- TO authenticated
-- USING (
--   (SELECT auth.jwt()->>'sub') = user_id
-- );

-- 사용자는 자신의 작업만 생성 가능
-- CREATE POLICY "Users must insert their own tasks"
-- ON public.tasks
-- AS PERMISSIVE
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   (SELECT auth.jwt()->>'sub') = user_id
-- );

-- 사용자는 자신의 작업만 수정 가능
-- CREATE POLICY "Users can update their own tasks"
-- ON public.tasks
-- FOR UPDATE
-- TO authenticated
-- USING (
--   (SELECT auth.jwt()->>'sub') = user_id
-- )
-- WITH CHECK (
--   (SELECT auth.jwt()->>'sub') = user_id
-- );

-- 사용자는 자신의 작업만 삭제 가능
-- CREATE POLICY "Users can delete their own tasks"
-- ON public.tasks
-- FOR DELETE
-- TO authenticated
-- USING (
--   (SELECT auth.jwt()->>'sub') = user_id
-- );

-- ============================================
-- RLS 정책 작동 원리
-- ============================================
--
-- 1. Clerk 세션 토큰이 Supabase 요청 헤더에 포함됩니다
-- 2. Supabase는 auth.jwt() 함수를 통해 JWT 토큰에 접근합니다
-- 3. auth.jwt()->>'sub'는 Clerk 사용자 ID를 반환합니다
-- 4. RLS 정책은 이 값을 사용하여 데이터 접근을 제한합니다
--
-- 참고:
-- - auth.jwt()->>'sub': Clerk 사용자 ID (예: "user_2abc123...")
-- - USING 절: 기존 행에 대한 접근 권한 확인
-- - WITH CHECK 절: 새 행 생성/수정 시 검증
-- - TO authenticated: 인증된 사용자에게만 적용

