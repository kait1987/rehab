-- ===================================================
-- 이벤트 테이블 생성
-- events
-- ===================================================

-- events 테이블 생성
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  anonymous_id text,
  event_name varchar(100) NOT NULL,
  event_data jsonb,
  event_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.events IS '분석용 이벤트';

CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_anonymous_id ON public.events(anonymous_id);
CREATE INDEX idx_events_event_name ON public.events(event_name);
CREATE INDEX idx_events_event_time ON public.events(event_time DESC);
CREATE INDEX idx_events_user_key ON public.events(coalesce(user_id::text, anonymous_id));

