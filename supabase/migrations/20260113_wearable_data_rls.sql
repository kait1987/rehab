-- P3-W1-02: wearable_data RLS 정책
-- 본인 데이터만 접근/작성 가능 (auth.uid() 기반)

-- RLS 활성화
ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 데이터만 조회
CREATE POLICY "wearable_data_select_own"
ON wearable_data
FOR SELECT
USING ((SELECT auth.uid()) = user_id);

-- INSERT: 본인 데이터만 삽입
CREATE POLICY "wearable_data_insert_own"
ON wearable_data
FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

-- UPDATE: 본인 데이터만 수정
CREATE POLICY "wearable_data_update_own"
ON wearable_data
FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

-- DELETE: 본인 데이터만 삭제
CREATE POLICY "wearable_data_delete_own"
ON wearable_data
FOR DELETE
USING ((SELECT auth.uid()) = user_id);
