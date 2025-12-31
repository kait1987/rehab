-- ===================================================
-- 초기 데이터 (Seed Data) 삽입
-- ===================================================

-- body_parts 초기 데이터
INSERT INTO public.body_parts (name, display_order) VALUES
  ('허리', 1),
  ('어깨', 2),
  ('무릎', 3),
  ('목', 4),
  ('손목', 5),
  ('발목', 6),
  ('팔꿈치', 7),
  ('엉덩이', 8),
  ('등', 9),
  ('가슴', 10)
ON CONFLICT (name) DO NOTHING;

-- equipment_types 초기 데이터
INSERT INTO public.equipment_types (name, display_order) VALUES
  ('매트', 1),
  ('덤벨', 2),
  ('머신', 3),
  ('밴드', 4),
  ('짐볼', 5),
  ('폼롤러', 6),
  ('케틀벨', 7),
  ('바벨', 8),
  ('TRX', 9),
  ('없음', 10)
ON CONFLICT (name) DO NOTHING;

-- review_tags 초기 데이터
INSERT INTO public.review_tags (name, category, display_order) VALUES
  ('조용함', 'positive', 1),
  ('재활 친화', 'positive', 2),
  ('장비 깨끗함', 'positive', 3),
  ('분위기 좋음', 'positive', 4),
  ('접근성 좋음', 'positive', 5),
  ('복잡함', 'negative', 6),
  ('시끄러움', 'negative', 7),
  ('장비 부족', 'negative', 8),
  ('주차 어려움', 'negative', 9),
  ('가격 부담', 'negative', 10)
ON CONFLICT (name) DO NOTHING;

