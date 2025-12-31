-- ===================================================
-- 사용자 관련 테이블 생성
-- user_pain_profiles, user_course_history, user_favorites
-- ===================================================

-- user_pain_profiles 테이블 생성
CREATE TABLE public.user_pain_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body_part_id uuid NOT NULL REFERENCES public.body_parts(id),
  pain_level int CHECK (pain_level >= 1 AND pain_level <= 5),
  experience_level varchar(20),
  equipment_available text[],
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.user_pain_profiles IS '사용자 통증 프로필';

CREATE INDEX idx_user_pain_profiles_user_id ON public.user_pain_profiles(user_id);
CREATE INDEX idx_user_pain_profiles_body_part_id ON public.user_pain_profiles(body_part_id);

-- user_course_history 테이블 생성
CREATE TABLE public.user_course_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_at timestamptz,
  saved_at timestamptz DEFAULT now() NOT NULL,
  is_favorite boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.user_course_history IS '사용자 코스 히스토리';

CREATE INDEX idx_user_course_history_user_id ON public.user_course_history(user_id);
CREATE INDEX idx_user_course_history_course_id ON public.user_course_history(course_id);
CREATE INDEX idx_user_course_history_saved_at ON public.user_course_history(saved_at DESC);
CREATE INDEX idx_user_course_history_is_favorite ON public.user_course_history(is_favorite);

-- user_favorites 테이블 생성
CREATE TABLE public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  saved_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT user_favorites_unique UNIQUE (user_id, gym_id)
);

COMMENT ON TABLE public.user_favorites IS '즐겨찾기';

CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_gym_id ON public.user_favorites(gym_id);
CREATE INDEX idx_user_favorites_saved_at ON public.user_favorites(saved_at DESC);

