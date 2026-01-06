-- ===================================================
-- Phase 3.2: Full Text Search (FTS) 도입
-- 헬스장 검색 성능 및 정확도 향상을 위한 마이그레이션
-- ===================================================

-- 1. search_vector 컬럼 추가 (tsvector 타입)
-- 헬스장 이름, 주소, 설명을 기반으로 검색 가능하도록 함
alter table public.gyms
add column if not exists search_vector tsvector;

comment on column public.gyms.search_vector is 'Full Text Search용 벡터 (헬스장 이름, 주소, 설명 기반)';

-- 2. search_vector를 자동으로 갱신하는 함수 생성
create or replace function public.update_gym_search_vector()
returns trigger as $$
begin
  -- 헬스장 이름, 주소, 설명을 결합하여 tsvector 생성
  -- 'simple' 설정: 한국어/영어 모두 대소문자 구분 없이 검색 가능
  new.search_vector :=
    to_tsvector('simple', coalesce(new.name, '')) ||
    to_tsvector('simple', coalesce(new.address, '')) ||
    to_tsvector('simple', coalesce(new.description, ''));
  
  return new;
end;
$$ language plpgsql;

comment on function public.update_gym_search_vector() is '헬스장 정보 변경 시 search_vector를 자동으로 갱신하는 트리거 함수';

-- 3. 트리거 생성 (INSERT 및 UPDATE 시 자동 실행)
drop trigger if exists trigger_update_gym_search_vector on public.gyms;

create trigger trigger_update_gym_search_vector
  before insert or update of name, address, description on public.gyms
  for each row
  execute function public.update_gym_search_vector();

comment on trigger trigger_update_gym_search_vector on public.gyms is '헬스장 정보 변경 시 search_vector 자동 갱신';

-- 4. GIN 인덱스 생성 (Full Text Search 성능 향상)
-- GIN 인덱스는 tsvector 타입에 최적화된 인덱스로, 빠른 텍스트 검색을 제공
create index if not exists idx_gyms_search_vector_gin
  on public.gyms
  using gin(search_vector);

comment on index idx_gyms_search_vector_gin is 'Full Text Search용 GIN 인덱스 (검색 성능 향상)';

-- 5. 기존 데이터에 대해 search_vector 초기화
-- 이미 존재하는 헬스장 데이터에 대해 search_vector를 채움
update public.gyms
set search_vector =
  to_tsvector('simple', coalesce(name, '')) ||
  to_tsvector('simple', coalesce(address, '')) ||
  to_tsvector('simple', coalesce(description, ''))
where search_vector is null;

comment on table public.gyms is '재활 친화 헬스장/운동공간 기본 정보 (Full Text Search 지원)';

