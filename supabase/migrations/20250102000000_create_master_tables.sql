-- ===================================================
-- 마스터 데이터 테이블 생성
-- body_parts, equipment_types, review_tags
-- ===================================================

-- body_parts 테이블 생성
CREATE TABLE public.body_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.body_parts IS '부위 마스터';

CREATE INDEX idx_body_parts_display_order ON public.body_parts(display_order);

-- equipment_types 테이블 생성
CREATE TABLE public.equipment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.equipment_types IS '기구 종류 마스터';

CREATE INDEX idx_equipment_types_display_order ON public.equipment_types(display_order);

-- review_tags 테이블 생성
CREATE TABLE public.review_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category varchar(50),
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.review_tags IS '리뷰 태그 마스터';

CREATE INDEX idx_review_tags_category ON public.review_tags(category);
CREATE INDEX idx_review_tags_display_order ON public.review_tags(display_order);

