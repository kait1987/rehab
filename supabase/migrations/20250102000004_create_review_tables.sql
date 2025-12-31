-- ===================================================
-- 리뷰 관련 테이블 생성
-- reviews, review_tag_mappings
-- ===================================================

-- reviews 테이블 생성
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  comment text,
  is_admin_review boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.reviews IS '리뷰 기본 정보 (태그 기반, 별점 대신)';

CREATE INDEX idx_reviews_gym_id ON public.reviews(gym_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_is_deleted ON public.reviews(is_deleted);
CREATE INDEX idx_reviews_is_admin_review ON public.reviews(is_admin_review);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);

-- review_tag_mappings 테이블 생성
CREATE TABLE public.review_tag_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  review_tag_id uuid NOT NULL REFERENCES public.review_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT review_tag_mappings_unique UNIQUE (review_id, review_tag_id)
);

COMMENT ON TABLE public.review_tag_mappings IS '리뷰-태그 매핑 (다대다 관계)';

CREATE INDEX idx_review_tag_mappings_review_id ON public.review_tag_mappings(review_id);
CREATE INDEX idx_review_tag_mappings_review_tag_id ON public.review_tag_mappings(review_tag_id);

