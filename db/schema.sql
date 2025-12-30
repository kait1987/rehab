-- ===================================================
-- REHAB 재활운동 어플리케이션 - 핵심 스키마
-- PRD.md 기반 설계
-- 핵심 테이블 정의만 포함 (트리거, 뷰, seed data 제외)
-- ===================================================

-- ============================================
-- 1️⃣ 사용자 테이블
-- ============================================

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  display_name text,
  is_admin boolean default false,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.users is '앱 사용자(최소 스키마). 외부 인증 시스템 도입 시 확장/대체 가능.';

-- ============================================
-- 2️⃣ 마스터 데이터 테이블
-- ============================================

create table public.body_parts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now() not null
);

comment on table public.body_parts is '부위 마스터';

create table public.equipment_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now() not null
);

comment on table public.equipment_types is '기구 종류 마스터';

create table public.review_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category varchar(50),
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now() not null
);

comment on table public.review_tags is '리뷰 태그 마스터';

-- ============================================
-- 3️⃣ 헬스장 관련 테이블
-- ============================================

create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  latitude decimal(10, 8) not null,
  longitude decimal(11, 8) not null,
  phone text,
  website text,
  price_range varchar(20),
  description text,
  is_active boolean default true,
  facility_info_count int default 0,
  last_updated_at timestamptz default now(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.gyms is '재활 친화 헬스장/운동공간 기본 정보';

create table public.gym_facilities (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  is_quiet boolean default false,
  has_rehab_equipment boolean default false,
  has_pt_coach boolean default false,
  has_shower boolean default false,
  has_parking boolean default false,
  has_locker boolean default false,
  has_water_dispenser boolean default false,
  has_air_conditioning boolean default false,
  other_facilities text[],
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint gym_facilities_unique unique (gym_id)
);

comment on table public.gym_facilities is '헬스장 시설 정보';

create table public.gym_operating_hours (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  day_of_week int not null check (day_of_week >= 0 and day_of_week <= 6),
  open_time time,
  close_time time,
  is_closed boolean default false,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint gym_operating_hours_unique unique (gym_id, day_of_week)
);

comment on table public.gym_operating_hours is '헬스장 운영시간 정보 (요일별)';

create table public.gym_crowd_levels (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  time_slot varchar(20) not null,
  day_of_week int check (day_of_week >= 0 and day_of_week <= 6),
  crowd_level varchar(20) not null check (crowd_level in ('quiet', 'normal', 'busy')),
  source varchar(20) default 'manual',
  reported_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.gym_crowd_levels is '헬스장 혼잡도 정보 (시간대별, 수동 업데이트)';

-- ============================================
-- 4️⃣ 운동 템플릿 관련 테이블
-- ============================================

create table public.exercise_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  body_part_id uuid not null references public.body_parts(id),
  intensity_level int check (intensity_level >= 1 and intensity_level <= 4),
  duration_minutes int,
  reps int,
  sets int,
  rest_seconds int,
  difficulty_score int check (difficulty_score >= 1 and difficulty_score <= 10),
  contraindications text[],
  instructions text,
  precautions text,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.exercise_templates is '운동 템플릿';

create table public.exercise_equipment_mappings (
  id uuid primary key default gen_random_uuid(),
  exercise_template_id uuid not null references public.exercise_templates(id) on delete cascade,
  equipment_type_id uuid not null references public.equipment_types(id) on delete cascade,
  is_required boolean default false,
  created_at timestamptz default now() not null,
  constraint exercise_equipment_mappings_unique unique (exercise_template_id, equipment_type_id)
);

comment on table public.exercise_equipment_mappings is '운동-기구 매핑';

-- ============================================
-- 5️⃣ 재활 코스 관련 테이블
-- ============================================

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  total_duration_minutes int not null check (total_duration_minutes in (60, 90, 120)),
  pain_level int check (pain_level >= 1 and pain_level <= 5),
  experience_level varchar(20),
  body_parts text[],
  equipment_available text[],
  course_type varchar(20) default 'warmup_main_cooldown',
  is_template boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.courses is '재활 코스 기본 정보 (60/90/120분 코스만 허용)';

create table public.course_exercises (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  exercise_template_id uuid not null references public.exercise_templates(id),
  section varchar(20) not null check (section in ('warmup', 'main', 'cooldown')),
  order_in_section int not null,
  duration_minutes int,
  reps int,
  sets int,
  rest_seconds int,
  notes text,
  created_at timestamptz default now() not null
);

comment on table public.course_exercises is '코스 내 운동 목록';

-- ============================================
-- 6️⃣ 리뷰 관련 테이블
-- ============================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  comment text,
  is_admin_review boolean default false,
  is_deleted boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.reviews is '리뷰 기본 정보 (태그 기반, 별점 대신)';

create table public.review_tag_mappings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  review_tag_id uuid not null references public.review_tags(id) on delete cascade,
  created_at timestamptz default now() not null,
  constraint review_tag_mappings_unique unique (review_id, review_tag_id)
);

comment on table public.review_tag_mappings is '리뷰-태그 매핑 (다대다 관계)';

-- ============================================
-- 7️⃣ 사용자 관련 테이블
-- ============================================

create table public.user_pain_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  body_part_id uuid not null references public.body_parts(id),
  pain_level int check (pain_level >= 1 and pain_level <= 5),
  experience_level varchar(20),
  equipment_available text[],
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.user_pain_profiles is '사용자 통증 프로필';

create table public.user_course_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  completed_at timestamptz,
  saved_at timestamptz default now() not null,
  is_favorite boolean default false,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.user_course_history is '사용자 코스 히스토리';

create table public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  saved_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  constraint user_favorites_unique unique (user_id, gym_id)
);

comment on table public.user_favorites is '사용자 즐겨찾기';

-- ============================================
-- 8️⃣ 분석 관련 테이블
-- ============================================

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  anonymous_id text,
  event_name varchar(100) not null,
  event_data jsonb,
  event_time timestamptz default now() not null,
  created_at timestamptz default now() not null
);

comment on table public.events is '분석용 이벤트';
