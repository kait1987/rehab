-- ===================================================
-- 코스 관련 테이블 생성
-- courses, course_exercises
-- ===================================================

-- courses 테이블 생성
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  total_duration_minutes int NOT NULL CHECK (total_duration_minutes IN (60, 90, 120)),
  pain_level int CHECK (pain_level >= 1 AND pain_level <= 5),
  experience_level varchar(20),
  body_parts text[],
  equipment_available text[],
  course_type varchar(20) DEFAULT 'warmup_main_cooldown',
  is_template boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.courses IS '재활 코스 기본 정보';

CREATE INDEX idx_courses_user_id ON public.courses(user_id);
CREATE INDEX idx_courses_pain_level ON public.courses(pain_level);
CREATE INDEX idx_courses_is_template ON public.courses(is_template);
CREATE INDEX idx_courses_created_at ON public.courses(created_at DESC);

-- course_exercises 테이블 생성
CREATE TABLE public.course_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  exercise_template_id uuid NOT NULL REFERENCES public.exercise_templates(id),
  section varchar(20) NOT NULL CHECK (section IN ('warmup', 'main', 'cooldown')),
  order_in_section int NOT NULL,
  duration_minutes int,
  reps int,
  sets int,
  rest_seconds int,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.course_exercises IS '코스 내 운동 목록';

CREATE INDEX idx_course_exercises_course_id ON public.course_exercises(course_id);
CREATE INDEX idx_course_exercises_exercise_template_id ON public.course_exercises(exercise_template_id);
CREATE INDEX idx_course_exercises_section ON public.course_exercises(section, order_in_section);

