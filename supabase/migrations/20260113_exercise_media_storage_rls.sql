-- P3-M2-01: Storage 버킷 RLS 정책
-- exercise-images, exercise-animations 버킷용
-- Public bucket이지만 업로드/삭제는 관리자만 가능

-- 버킷 생성 (Supabase Dashboard에서 수동으로 생성 권장)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-images', 'exercise-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-animations', 'exercise-animations', true);

-- storage.objects 테이블에 RLS 적용

-- 1. exercise-images 버킷 정책
-- 읽기: 모든 사용자 허용 (Public bucket)
CREATE POLICY "exercise_images_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'exercise-images');

-- 쓰기/삭제: 관리자만 (is_admin = true)
CREATE POLICY "exercise_images_admin_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'exercise-images' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE clerk_id = (SELECT auth.jwt() ->> 'sub') 
    AND is_admin = true
  )
);

CREATE POLICY "exercise_images_admin_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'exercise-images' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE clerk_id = (SELECT auth.jwt() ->> 'sub') 
    AND is_admin = true
  )
);

CREATE POLICY "exercise_images_admin_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'exercise-images' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE clerk_id = (SELECT auth.jwt() ->> 'sub') 
    AND is_admin = true
  )
);

-- 2. exercise-animations 버킷 정책
CREATE POLICY "exercise_animations_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'exercise-animations');

CREATE POLICY "exercise_animations_admin_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'exercise-animations' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE clerk_id = (SELECT auth.jwt() ->> 'sub') 
    AND is_admin = true
  )
);

CREATE POLICY "exercise_animations_admin_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'exercise-animations' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE clerk_id = (SELECT auth.jwt() ->> 'sub') 
    AND is_admin = true
  )
);

CREATE POLICY "exercise_animations_admin_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'exercise-animations' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE clerk_id = (SELECT auth.jwt() ->> 'sub') 
    AND is_admin = true
  )
);
