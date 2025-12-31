-- ===================================================
-- 운동 관련 테이블 생성
-- exercise_templates, exercise_equipment_mappings
-- ===================================================

-- exercise_templates 테이블 생성
CREATE TABLE public.exercise_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  body_part_id uuid NOT NULL REFERENCES public.body_parts(id),
  intensity_level int CHECK (intensity_level >= 1 AND intensity_level <= 4),
  duration_minutes int,
  reps int,
  sets int,
  rest_seconds int,
  difficulty_score int CHECK (difficulty_score >= 1 AND difficulty_score <= 10),
  contraindications text[],
  instructions text,
  precautions text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.exercise_templates IS '운동 템플릿';

CREATE INDEX idx_exercise_templates_body_part_id ON public.exercise_templates(body_part_id);
CREATE INDEX idx_exercise_templates_intensity_level ON public.exercise_templates(intensity_level);
CREATE INDEX idx_exercise_templates_is_active ON public.exercise_templates(is_active);

-- exercise_equipment_mappings 테이블 생성
CREATE TABLE public.exercise_equipment_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_template_id uuid NOT NULL REFERENCES public.exercise_templates(id) ON DELETE CASCADE,
  equipment_type_id uuid NOT NULL REFERENCES public.equipment_types(id) ON DELETE CASCADE,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT exercise_equipment_mappings_unique UNIQUE (exercise_template_id, equipment_type_id)
);

COMMENT ON TABLE public.exercise_equipment_mappings IS '운동-기구 매핑';

CREATE INDEX idx_exercise_equipment_mappings_exercise_template_id ON public.exercise_equipment_mappings(exercise_template_id);
CREATE INDEX idx_exercise_equipment_mappings_equipment_type_id ON public.exercise_equipment_mappings(equipment_type_id);

