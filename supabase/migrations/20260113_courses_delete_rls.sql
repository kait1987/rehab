-- ===================================================
-- courses 테이블 RLS DELETE 정책 추가
-- 본인 코스만 삭제 가능하도록 설정
-- ===================================================

-- courses 테이블에 RLS가 이미 활성화되어 있을 수 있으므로 
-- 중복 방지를 위해 IF NOT EXISTS는 지원되지 않으나 에러가 발생하면 무시
DO $$ 
BEGIN
  -- RLS 활성화 (이미 활성화되어 있으면 무시됨)
  ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 기존 DELETE 정책이 있으면 삭제
DROP POLICY IF EXISTS "Users can delete own courses" ON public.courses;

-- DELETE 정책 생성: 본인 코스만 삭제 가능
CREATE POLICY "Users can delete own courses"
ON public.courses
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 코멘트 추가
COMMENT ON POLICY "Users can delete own courses" ON public.courses IS '로그인 사용자는 본인이 생성한 코스만 삭제할 수 있음';
