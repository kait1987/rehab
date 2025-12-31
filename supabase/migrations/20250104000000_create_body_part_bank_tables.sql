-- ===================================================
-- 부위 Bank 관련 테이블 생성
-- body_part_exercise_mappings, body_part_contraindications
-- ===================================================

-- 1. body_part_exercise_mappings 테이블 (부위별 추천 운동 매핑)
CREATE TABLE public.body_part_exercise_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body_part_id uuid NOT NULL REFERENCES public.body_parts(id) ON DELETE CASCADE,
  exercise_template_id uuid NOT NULL REFERENCES public.exercise_templates(id) ON DELETE CASCADE,
  priority int NOT NULL, -- 낮을수록 우선순위 높음
  intensity_level int CHECK (intensity_level >= 1 AND intensity_level <= 4), -- 1-4 범위, nullable 허용
  pain_level_range varchar(20), -- 예: '1-2', '3-4', '5', 'all'
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT body_part_exercise_mappings_unique UNIQUE (body_part_id, exercise_template_id, pain_level_range)
);

COMMENT ON TABLE public.body_part_exercise_mappings IS '부위별 추천 운동 매핑';
COMMENT ON COLUMN public.body_part_exercise_mappings.priority IS '우선순위 (낮을수록 높은 우선순위)';
COMMENT ON COLUMN public.body_part_exercise_mappings.intensity_level IS '권장 강도 레벨 (1-4)';
COMMENT ON COLUMN public.body_part_exercise_mappings.pain_level_range IS '통증 정도 범위 (예: 1-2, 3-4, 5, all)';

CREATE INDEX idx_body_part_exercise_mappings_body_part_id ON public.body_part_exercise_mappings(body_part_id);
CREATE INDEX idx_body_part_exercise_mappings_exercise_template_id ON public.body_part_exercise_mappings(exercise_template_id);
CREATE INDEX idx_body_part_exercise_mappings_priority ON public.body_part_exercise_mappings(priority);
CREATE INDEX idx_body_part_exercise_mappings_pain_level_range ON public.body_part_exercise_mappings(pain_level_range);

DROP TRIGGER IF EXISTS handle_body_part_exercise_mappings_updated_at ON public.body_part_exercise_mappings;
CREATE TRIGGER handle_body_part_exercise_mappings_updated_at
  BEFORE UPDATE ON public.body_part_exercise_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- 2. body_part_contraindications 테이블 (부위별 금기 운동)
CREATE TABLE public.body_part_contraindications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body_part_id uuid NOT NULL REFERENCES public.body_parts(id) ON DELETE CASCADE,
  exercise_template_id uuid NOT NULL REFERENCES public.exercise_templates(id) ON DELETE CASCADE,
  pain_level_min int CHECK (pain_level_min >= 1 AND pain_level_min <= 5), -- 이 이상일 때 금기, NULL이면 항상 금기
  reason text, -- 금기 사유
  severity varchar(20) NOT NULL DEFAULT 'warning' CHECK (severity IN ('warning', 'strict')), -- 'warning' | 'strict'
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT body_part_contraindications_unique UNIQUE (body_part_id, exercise_template_id, pain_level_min)
);

COMMENT ON TABLE public.body_part_contraindications IS '부위별 금기 운동';
COMMENT ON COLUMN public.body_part_contraindications.pain_level_min IS '최소 통증 정도 (이 이상일 때 금기, NULL이면 항상 금기)';
COMMENT ON COLUMN public.body_part_contraindications.reason IS '금기 사유';
COMMENT ON COLUMN public.body_part_contraindications.severity IS '금기 심각도 (warning: 경고, strict: 엄격)';

CREATE INDEX idx_body_part_contraindications_body_part_id ON public.body_part_contraindications(body_part_id);
CREATE INDEX idx_body_part_contraindications_exercise_template_id ON public.body_part_contraindications(exercise_template_id);
CREATE INDEX idx_body_part_contraindications_pain_level_min ON public.body_part_contraindications(pain_level_min);

DROP TRIGGER IF EXISTS handle_body_part_contraindications_updated_at ON public.body_part_contraindications;
CREATE TRIGGER handle_body_part_contraindications_updated_at
  BEFORE UPDATE ON public.body_part_contraindications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

