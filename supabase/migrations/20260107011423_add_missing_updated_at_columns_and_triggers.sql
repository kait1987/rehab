-- ===================================================
-- 누락된 updated_at 컬럼 및 트리거 추가
-- Phase 1 검증 결과 보완 마이그레이션
-- ===================================================

-- 1. Master 테이블에 updated_at 컬럼 추가
ALTER TABLE public.body_parts 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

ALTER TABLE public.equipment_types 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

ALTER TABLE public.review_tags 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

-- 2. 매핑 테이블에 updated_at 컬럼 추가
ALTER TABLE public.exercise_equipment_mappings 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

ALTER TABLE public.course_exercises 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

ALTER TABLE public.review_tag_mappings 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

-- 3. User/Event 테이블에 updated_at 컬럼 추가
ALTER TABLE public.user_favorites 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

-- 4. handle_updated_at() 함수가 없으면 생성 (이미 존재하지만 안전을 위해)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_updated_at() IS 'updated_at 컬럼을 자동으로 현재 시간으로 업데이트하는 트리거 함수';

-- 5. 각 테이블에 updated_at 트리거 추가
-- Master 테이블 트리거
DROP TRIGGER IF EXISTS handle_body_parts_updated_at ON public.body_parts;
CREATE TRIGGER handle_body_parts_updated_at
  BEFORE UPDATE ON public.body_parts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_equipment_types_updated_at ON public.equipment_types;
CREATE TRIGGER handle_equipment_types_updated_at
  BEFORE UPDATE ON public.equipment_types
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_review_tags_updated_at ON public.review_tags;
CREATE TRIGGER handle_review_tags_updated_at
  BEFORE UPDATE ON public.review_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 매핑 테이블 트리거
DROP TRIGGER IF EXISTS handle_exercise_equipment_mappings_updated_at ON public.exercise_equipment_mappings;
CREATE TRIGGER handle_exercise_equipment_mappings_updated_at
  BEFORE UPDATE ON public.exercise_equipment_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_course_exercises_updated_at ON public.course_exercises;
CREATE TRIGGER handle_course_exercises_updated_at
  BEFORE UPDATE ON public.course_exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_review_tag_mappings_updated_at ON public.review_tag_mappings;
CREATE TRIGGER handle_review_tag_mappings_updated_at
  BEFORE UPDATE ON public.review_tag_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- User/Event 테이블 트리거
DROP TRIGGER IF EXISTS handle_user_favorites_updated_at ON public.user_favorites;
CREATE TRIGGER handle_user_favorites_updated_at
  BEFORE UPDATE ON public.user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_events_updated_at ON public.events;
CREATE TRIGGER handle_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. 기존 데이터의 updated_at 값을 created_at으로 초기화 (NULL 방지)
UPDATE public.body_parts SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE public.equipment_types SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE public.review_tags SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE public.exercise_equipment_mappings SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE public.course_exercises SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE public.review_tag_mappings SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE public.user_favorites SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE public.events SET updated_at = COALESCE(event_time, created_at) WHERE updated_at IS NULL;

