-- ===================================================
-- exercise_templates 테이블에 미디어 컬럼 추가
-- 운동 동작 시각화용 이미지/GIF/영상 URL 저장
-- ===================================================

ALTER TABLE public.exercise_templates
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS gif_url text,
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS english_name text;

COMMENT ON COLUMN public.exercise_templates.image_url IS '운동 정적 이미지 URL';
COMMENT ON COLUMN public.exercise_templates.gif_url IS '운동 동작 GIF URL';
COMMENT ON COLUMN public.exercise_templates.video_url IS '운동 관련 영상 URL';
COMMENT ON COLUMN public.exercise_templates.english_name IS '영문 운동명 (ExerciseDB API 검색용)';

-- 인덱스: english_name으로 검색할 경우를 대비
CREATE INDEX IF NOT EXISTS idx_exercise_templates_english_name 
ON public.exercise_templates(english_name) 
WHERE english_name IS NOT NULL;

-- YouTube 연동: video_url 컬럼에 YouTube video ID 저장
-- 예: "U3Hh0Ue-Hxs" (전체 URL이 아닌 video ID만 저장)