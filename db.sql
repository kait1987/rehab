-- ===================================================
-- REHAB 재활운동 어플리케이션 - 완전한 데이터베이스 스키마
-- PRD.md 기반 설계
-- (수정본) Postgres 실행 가능: extensions + users 테이블 추가
-- ===================================================

-- ============================================
-- 0️⃣ 필수 확장(extensions)
-- ============================================

-- gen_random_uuid() 사용 대비 (환경에 따라 필요)
create extension if not exists pgcrypto;  -- gen_random_uuid() [web:81][web:82]

-- 이메일을 대소문자 무시(unique)로 관리하고 싶으면 아래도 권장
-- (원치 않으면 주석 유지)
-- create extension if not exists citext;  -- case-insensitive text [web:95]


-- ============================================
-- 0.5️⃣ users 테이블(누락 보완)
-- ============================================
-- 기존 설계에서 public.users를 참조하고 있으므로 최소 형태로 추가합니다. [memory:27]

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  -- 운영 방식이 "아무나 접속"이어도 결국 계정/권한이 필요해지는 경우가 많아 최소 필드만 둡니다.
  clerk_id text unique,  -- Clerk 사용자 ID (AGENTS.md 요구사항)
  email text unique,
  name text,  -- 사용자 이름 (Clerk 동기화 API에서 사용)
  display_name text,
  is_admin boolean default false,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.users is '앱 사용자(최소 스키마). 외부 인증 시스템 도입 시 확장/대체 가능.';

create index if not exists idx_users_clerk_id on public.users(clerk_id);
create index if not exists idx_users_is_active on public.users(is_active);
create index if not exists idx_users_is_admin on public.users(is_admin);


-- ============================================
-- 1️⃣ 헬스장 관련 테이블
-- ============================================

create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  latitude decimal(10, 8) not null,
  longitude decimal(11, 8) not null,
  phone text,
  website text,
  price_range varchar(20), -- 'low', 'medium', 'high', 'premium'
  description text,
  is_active boolean default true,
  facility_info_count int default 0, -- 시설 정보 입력 개수 (≥3이면 완료)
  last_updated_at timestamptz default now(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.gyms is '재활 친화 헬스장/운동공간 기본 정보';

create index idx_gyms_location on public.gyms(latitude, longitude);
create index idx_gyms_is_active on public.gyms(is_active);
create index idx_gyms_price_range on public.gyms(price_range);


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

create index idx_gym_facilities_gym_id on public.gym_facilities(gym_id);
create index idx_gym_facilities_is_quiet on public.gym_facilities(is_quiet);
create index idx_gym_facilities_has_rehab_equipment on public.gym_facilities(has_rehab_equipment);
create index idx_gym_facilities_has_pt_coach on public.gym_facilities(has_pt_coach);


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

create index idx_gym_operating_hours_gym_id on public.gym_operating_hours(gym_id);
create index idx_gym_operating_hours_day_of_week on public.gym_operating_hours(day_of_week);


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

create index idx_gym_crowd_levels_gym_id on public.gym_crowd_levels(gym_id);
create index idx_gym_crowd_levels_time_slot on public.gym_crowd_levels(time_slot);
create index idx_gym_crowd_levels_crowd_level on public.gym_crowd_levels(crowd_level);


-- ============================================
-- 2️⃣ 리뷰 관련 테이블
-- ============================================

create table public.review_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category varchar(50),
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now() not null
);

comment on table public.review_tags is '리뷰 태그 마스터';

create index idx_review_tags_category on public.review_tags(category);
create index idx_review_tags_display_order on public.review_tags(display_order);


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

create index idx_reviews_gym_id on public.reviews(gym_id);
create index idx_reviews_user_id on public.reviews(user_id);
create index idx_reviews_is_deleted on public.reviews(is_deleted);
create index idx_reviews_is_admin_review on public.reviews(is_admin_review);
create index idx_reviews_created_at on public.reviews(created_at desc);


create table public.review_tag_mappings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  review_tag_id uuid not null references public.review_tags(id) on delete cascade,
  created_at timestamptz default now() not null,
  constraint review_tag_mappings_unique unique (review_id, review_tag_id)
);

comment on table public.review_tag_mappings is '리뷰-태그 매핑 (다대다 관계)';

create index idx_review_tag_mappings_review_id on public.review_tag_mappings(review_id);
create index idx_review_tag_mappings_review_tag_id on public.review_tag_mappings(review_tag_id);


-- ============================================
-- 3️⃣ 재활 코스 관련 테이블
-- ============================================

create table public.body_parts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now() not null
);

comment on table public.body_parts is '부위 마스터';

create index idx_body_parts_display_order on public.body_parts(display_order);


create table public.equipment_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now() not null
);

comment on table public.equipment_types is '기구 종류 마스터';

create index idx_equipment_types_display_order on public.equipment_types(display_order);


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

create index idx_exercise_templates_body_part_id on public.exercise_templates(body_part_id);
create index idx_exercise_templates_intensity_level on public.exercise_templates(intensity_level);
create index idx_exercise_templates_is_active on public.exercise_templates(is_active);


create table public.exercise_equipment_mappings (
  id uuid primary key default gen_random_uuid(),
  exercise_template_id uuid not null references public.exercise_templates(id) on delete cascade,
  equipment_type_id uuid not null references public.equipment_types(id) on delete cascade,
  is_required boolean default false,
  created_at timestamptz default now() not null,
  constraint exercise_equipment_mappings_unique unique (exercise_template_id, equipment_type_id)
);

comment on table public.exercise_equipment_mappings is '운동-기구 매핑';

create index idx_exercise_equipment_mappings_exercise_template_id on public.exercise_equipment_mappings(exercise_template_id);
create index idx_exercise_equipment_mappings_equipment_type_id on public.exercise_equipment_mappings(equipment_type_id);


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

create index idx_courses_user_id on public.courses(user_id);
create index idx_courses_pain_level on public.courses(pain_level);
create index idx_courses_is_template on public.courses(is_template);
create index idx_courses_created_at on public.courses(created_at desc);


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

create index idx_course_exercises_course_id on public.course_exercises(course_id);
create index idx_course_exercises_exercise_template_id on public.course_exercises(exercise_template_id);
create index idx_course_exercises_section on public.course_exercises(section, order_in_section);


-- ============================================
-- 4️⃣ 사용자 관련 테이블
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

create index idx_user_pain_profiles_user_id on public.user_pain_profiles(user_id);
create index idx_user_pain_profiles_body_part_id on public.user_pain_profiles(body_part_id);


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

create index idx_user_course_history_user_id on public.user_course_history(user_id);
create index idx_user_course_history_course_id on public.user_course_history(course_id);
create index idx_user_course_history_saved_at on public.user_course_history(saved_at desc);
create index idx_user_course_history_is_favorite on public.user_course_history(is_favorite);


create table public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  saved_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  constraint user_favorites_unique unique (user_id, gym_id)
);

comment on table public.user_favorites is '사용자 즐겨찾기';

create index idx_user_favorites_user_id on public.user_favorites(user_id);
create index idx_user_favorites_gym_id on public.user_favorites(gym_id);
create index idx_user_favorites_saved_at on public.user_favorites(saved_at desc);


-- ============================================
-- 5️⃣ 분석 관련 테이블
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

create index idx_events_user_id on public.events(user_id);
create index idx_events_anonymous_id on public.events(anonymous_id);
create index idx_events_event_name on public.events(event_name);
create index idx_events_event_time on public.events(event_time desc);
create index idx_events_user_key on public.events(coalesce(user_id::text, anonymous_id));


-- ============================================
-- 6️⃣ 트리거 함수 (updated_at 자동 업데이트)
-- ============================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- users에도 updated_at 트리거 추가(이번 수정에서 추가)
drop trigger if exists handle_users_updated_at on public.users;
create trigger handle_users_updated_at
  before update on public.users
  for each row
  execute function public.handle_updated_at();

drop trigger if exists handle_gyms_updated_at on public.gyms;
create trigger handle_gyms_updated_at
  before update on public.gyms
  for each row
  execute function public.handle_updated_at();

drop trigger if exists handle_gym_facilities_updated_at on public.gym_facilities;
create trigger handle_gym_facilities_updated_at
  before update on public.gym_facilities
  for each row
  execute function public.handle_updated_at();

drop trigger if exists handle_gym_operating_hours_updated_at on public.gym_operating_hours;
create trigger handle_gym_operating_hours_updated_at
  before update on public.gym_operating_hours
  for each row
  execute function public.handle_updated_at();

drop trigger if exists handle_gym_crowd_levels_updated_at on public.gym_crowd_levels;
create trigger handle_gym_crowd_levels_updated_at
  before update on public.gym_crowd_levels
  for each row
  execute function public.handle_updated_at();

drop trigger if exists handle_reviews_updated_at on public.reviews;
create trigger handle_reviews_updated_at
  before update on public.reviews
  for each row
  execute function public.handle_updated_at();

drop trigger if exists handle_exercise_templates_updated_at on public.exercise_templates;
create trigger handle_exercise_templates_updated_at
  before update on public.exercise_templates
  for each row
  execute function public.handle_updated_at();

drop trigger if exists handle_courses_updated_at on public.courses;
create trigger handle_courses_updated_at
  before update on public.courses
  for each row
  execute function public.handle_updated_at();

drop trigger if exists handle_user_pain_profiles_updated_at on public.user_pain_profiles;
create trigger handle_user_pain_profiles_updated_at
  before update on public.user_pain_profiles
  for each row
  execute function public.handle_updated_at();

drop trigger if exists handle_user_course_history_updated_at on public.user_course_history;
create trigger handle_user_course_history_updated_at
  before update on public.user_course_history
  for each row
  execute function public.handle_updated_at();


-- ============================================
-- 7️⃣ 유용한 뷰 (View)
-- ============================================

create or replace view public.vw_gym_summary as
select
  g.id,
  g.name,
  g.address,
  g.latitude,
  g.longitude,
  g.price_range,
  g.is_active,
  g.facility_info_count,
  gf.is_quiet,
  gf.has_rehab_equipment,
  gf.has_pt_coach,
  gf.has_shower,
  gf.has_parking,
  count(distinct r.id) as review_count,
  count(distinct rtm.review_tag_id) as tag_count,
  g.created_at,
  g.updated_at
from public.gyms g
left join public.gym_facilities gf on g.id = gf.gym_id
left join public.reviews r on g.id = r.gym_id and r.is_deleted = false
left join public.review_tag_mappings rtm on r.id = rtm.review_id
where g.is_active = true
group by g.id, g.name, g.address, g.latitude, g.longitude, g.price_range, g.is_active, g.facility_info_count,
         gf.is_quiet, gf.has_rehab_equipment, gf.has_pt_coach, gf.has_shower, gf.has_parking, g.created_at, g.updated_at;

comment on view public.vw_gym_summary is '헬스장 요약 정보';


create or replace view public.vw_review_summary as
select
  r.id,
  r.gym_id,
  g.name as gym_name,
  r.user_id,
  r.comment,
  r.is_admin_review,
  r.created_at,
  array_agg(rt.name) as tags
from public.reviews r
join public.gyms g on r.gym_id = g.id
left join public.review_tag_mappings rtm on r.id = rtm.review_id
left join public.review_tags rt on rtm.review_tag_id = rt.id
where r.is_deleted = false
group by r.id, r.gym_id, g.name, r.user_id, r.comment, r.is_admin_review, r.created_at;

comment on view public.vw_review_summary is '리뷰 요약 정보';


create or replace view public.vw_course_summary as
select
  c.id,
  c.user_id,
  c.total_duration_minutes,
  c.pain_level,
  c.experience_level,
  c.body_parts,
  c.equipment_available,
  c.course_type,
  c.is_template,
  count(distinct ce.id) as exercise_count,
  sum(ce.duration_minutes) as total_exercise_duration,
  c.created_at,
  c.updated_at
from public.courses c
left join public.course_exercises ce on c.id = ce.course_id
group by c.id, c.user_id, c.total_duration_minutes, c.pain_level, c.experience_level,
         c.body_parts, c.equipment_available, c.course_type, c.is_template, c.created_at, c.updated_at;

comment on view public.vw_course_summary is '코스 요약 정보';


-- ============================================
-- 8️⃣ 초기 데이터 (Seed Data)
-- ============================================

insert into public.body_parts (name, display_order) values
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
on conflict (name) do nothing;

insert into public.equipment_types (name, display_order) values
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
on conflict (name) do nothing;

insert into public.review_tags (name, category, display_order) values
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
on conflict (name) do nothing;

-- ============================================
-- ✅ 완료
-- ============================================
