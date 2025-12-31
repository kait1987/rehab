-- ===================================================
-- 트리거 생성
-- updated_at 자동 업데이트 트리거
-- ===================================================

-- 공용 트리거 함수 생성
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

-- 각 테이블에 BEFORE UPDATE 트리거 생성
-- 주의: users 테이블은 이미 20251211075629_users.sql에 트리거가 있을 수 있으므로 DROP IF EXISTS 사용

DROP TRIGGER IF EXISTS handle_gyms_updated_at ON public.gyms;
CREATE TRIGGER handle_gyms_updated_at
  BEFORE UPDATE ON public.gyms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_gym_facilities_updated_at ON public.gym_facilities;
CREATE TRIGGER handle_gym_facilities_updated_at
  BEFORE UPDATE ON public.gym_facilities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_gym_operating_hours_updated_at ON public.gym_operating_hours;
CREATE TRIGGER handle_gym_operating_hours_updated_at
  BEFORE UPDATE ON public.gym_operating_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_gym_crowd_levels_updated_at ON public.gym_crowd_levels;
CREATE TRIGGER handle_gym_crowd_levels_updated_at
  BEFORE UPDATE ON public.gym_crowd_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_reviews_updated_at ON public.reviews;
CREATE TRIGGER handle_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_exercise_templates_updated_at ON public.exercise_templates;
CREATE TRIGGER handle_exercise_templates_updated_at
  BEFORE UPDATE ON public.exercise_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_courses_updated_at ON public.courses;
CREATE TRIGGER handle_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_pain_profiles_updated_at ON public.user_pain_profiles;
CREATE TRIGGER handle_user_pain_profiles_updated_at
  BEFORE UPDATE ON public.user_pain_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_course_history_updated_at ON public.user_course_history;
CREATE TRIGGER handle_user_course_history_updated_at
  BEFORE UPDATE ON public.user_course_history
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- users 테이블 트리거는 이미 20251211075629_users.sql에 있을 수 있으므로 확인 후 생성
-- 기존 트리거가 있으면 덮어쓰지 않도록 주의
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_body_part_exercise_mappings_updated_at ON public.body_part_exercise_mappings;
CREATE TRIGGER handle_body_part_exercise_mappings_updated_at
  BEFORE UPDATE ON public.body_part_exercise_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_body_part_contraindications_updated_at ON public.body_part_contraindications;
CREATE TRIGGER handle_body_part_contraindications_updated_at
  BEFORE UPDATE ON public.body_part_contraindications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


