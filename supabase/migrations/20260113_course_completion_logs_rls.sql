-- P3-AI-02: course_completion_logs RLS 정책
-- 본인 데이터만 접근/작성 가능 (auth.uid() 기반)

-- RLS 활성화
ALTER TABLE course_completion_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 데이터만 조회
CREATE POLICY "course_completion_logs_select_own"
ON course_completion_logs
FOR SELECT
USING ((SELECT auth.uid()) = user_id);

-- INSERT: 본인 데이터만 삽입 (WITH CHECK 포함)
CREATE POLICY "course_completion_logs_insert_own"
ON course_completion_logs
FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

-- UPDATE: 본인 데이터만 수정
CREATE POLICY "course_completion_logs_update_own"
ON course_completion_logs
FOR UPDATE
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- DELETE: 본인 데이터만 삭제
CREATE POLICY "course_completion_logs_delete_own"
ON course_completion_logs
FOR DELETE
USING ((SELECT auth.uid()) = user_id);
