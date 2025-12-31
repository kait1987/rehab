-- ===================================================
-- 헬스장 관련 테이블 생성
-- gyms, gym_facilities, gym_operating_hours, gym_crowd_levels
-- ===================================================

-- gyms 테이블 생성
CREATE TABLE public.gyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  phone text,
  website text,
  price_range varchar(20),
  description text,
  is_active boolean DEFAULT true,
  facility_info_count int DEFAULT 0,
  last_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.gyms IS '재활 친화 헬스장/운동공간 기본 정보';

CREATE INDEX idx_gyms_location ON public.gyms(latitude, longitude);
CREATE INDEX idx_gyms_is_active ON public.gyms(is_active);
CREATE INDEX idx_gyms_price_range ON public.gyms(price_range);

-- gym_facilities 테이블 생성
CREATE TABLE public.gym_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  is_quiet boolean DEFAULT false,
  has_rehab_equipment boolean DEFAULT false,
  has_pt_coach boolean DEFAULT false,
  has_shower boolean DEFAULT false,
  has_parking boolean DEFAULT false,
  has_locker boolean DEFAULT false,
  has_water_dispenser boolean DEFAULT false,
  has_air_conditioning boolean DEFAULT false,
  other_facilities text[],
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT gym_facilities_unique UNIQUE (gym_id)
);

COMMENT ON TABLE public.gym_facilities IS '헬스장 시설 정보';

CREATE INDEX idx_gym_facilities_gym_id ON public.gym_facilities(gym_id);
CREATE INDEX idx_gym_facilities_is_quiet ON public.gym_facilities(is_quiet);
CREATE INDEX idx_gym_facilities_has_rehab_equipment ON public.gym_facilities(has_rehab_equipment);
CREATE INDEX idx_gym_facilities_has_pt_coach ON public.gym_facilities(has_pt_coach);

-- gym_operating_hours 테이블 생성
CREATE TABLE public.gym_operating_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time,
  close_time time,
  is_closed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT gym_operating_hours_unique UNIQUE (gym_id, day_of_week)
);

COMMENT ON TABLE public.gym_operating_hours IS '헬스장 운영시간 정보 (요일별)';

CREATE INDEX idx_gym_operating_hours_gym_id ON public.gym_operating_hours(gym_id);
CREATE INDEX idx_gym_operating_hours_day_of_week ON public.gym_operating_hours(day_of_week);

-- gym_crowd_levels 테이블 생성
CREATE TABLE public.gym_crowd_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  time_slot varchar(20) NOT NULL,
  day_of_week int CHECK (day_of_week >= 0 AND day_of_week <= 6),
  crowd_level varchar(20) NOT NULL CHECK (crowd_level IN ('quiet', 'normal', 'busy')),
  source varchar(20) DEFAULT 'manual',
  reported_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.gym_crowd_levels IS '헬스장 혼잡도 정보 (시간대별, 수동 업데이트)';

CREATE INDEX idx_gym_crowd_levels_gym_id ON public.gym_crowd_levels(gym_id);
CREATE INDEX idx_gym_crowd_levels_time_slot ON public.gym_crowd_levels(time_slot);
CREATE INDEX idx_gym_crowd_levels_crowd_level ON public.gym_crowd_levels(crowd_level);

