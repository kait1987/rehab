# 마이그레이션 검증 가이드

## 개요

이 문서는 DB 기본 스키마 구축 플랜에 따라 생성된 마이그레이션 파일들이 올바르게 적용되었는지 검증하는 방법을 제공합니다.

## 마이그레이션 파일 목록

다음 9개의 마이그레이션 파일이 순서대로 생성되었습니다:

1. `20250102000000_create_master_tables.sql` - 마스터 데이터 테이블 (body_parts, equipment_types, review_tags)
2. `20250102000001_create_gym_tables.sql` - 헬스장 관련 테이블 (gyms, gym_facilities, gym_operating_hours, gym_crowd_levels)
3. `20250102000002_create_exercise_tables.sql` - 운동 관련 테이블 (exercise_templates, exercise_equipment_mappings)
4. `20250102000003_create_course_tables.sql` - 코스 관련 테이블 (courses, course_exercises)
5. `20250102000004_create_review_tables.sql` - 리뷰 관련 테이블 (reviews, review_tag_mappings)
6. `20250102000005_create_user_related_tables.sql` - 사용자 관련 테이블 (user_pain_profiles, user_course_history, user_favorites)
7. `20250102000006_create_event_table.sql` - 이벤트 테이블 (events)
8. `20250102000007_create_additional_indexes.sql` - 추가 인덱스 (현재 비어있음, 향후 확장용)
9. `20250102000008_create_triggers.sql` - 트리거 함수 및 트리거

## 검증 단계

### 1. 테이블 생성 확인

Supabase Dashboard의 Table Editor에서 다음 테이블들이 생성되었는지 확인하세요:

- [ ] body_parts
- [ ] equipment_types
- [ ] review_tags
- [ ] gyms
- [ ] gym_facilities
- [ ] gym_operating_hours
- [ ] gym_crowd_levels
- [ ] exercise_templates
- [ ] exercise_equipment_mappings
- [ ] courses
- [ ] course_exercises
- [ ] reviews
- [ ] review_tag_mappings
- [ ] user_pain_profiles
- [ ] user_course_history
- [ ] user_favorites
- [ ] events

**참고**: `users` 테이블은 기존 마이그레이션 파일(`20251211075629_users.sql`)에 의해 이미 생성되어 있습니다.

### 2. 외래키 제약조건 확인

다음 SQL 쿼리를 실행하여 모든 외래키 제약조건이 올바르게 설정되었는지 확인하세요:

```sql
-- 모든 외래키 제약조건 확인
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

**확인 사항:**
- [ ] 모든 FK가 `public.users(id)`를 참조하는지 확인 (auth.users 참조 없어야 함)
- [ ] FK 제약조건이 올바르게 설정되었는지 확인 (CASCADE, SET NULL 등)

### 3. 인덱스 확인

다음 SQL 쿼리를 실행하여 모든 인덱스가 생성되었는지 확인하세요:

```sql
-- 모든 인덱스 확인
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**확인 사항:**
- [ ] 모든 FK 컬럼에 인덱스가 생성되었는지 확인
- [ ] Prisma Schema에 정의된 모든 인덱스가 생성되었는지 확인
- [ ] 복합 인덱스가 올바르게 생성되었는지 확인

### 4. 트리거 확인

다음 SQL 쿼리를 실행하여 모든 트리거가 생성되었는지 확인하세요:

```sql
-- 모든 트리거 확인
SELECT
  trigger_name,
  event_object_table AS table_name,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

**확인 사항:**
- [ ] `handle_updated_at()` 함수가 생성되었는지 확인
- [ ] 각 테이블에 BEFORE UPDATE 트리거가 생성되었는지 확인
- [ ] 트리거가 올바르게 동작하는지 테스트 (UPDATE 쿼리 실행 후 updated_at 확인)

### 5. 트리거 동작 테스트

다음 SQL 쿼리를 실행하여 트리거가 올바르게 동작하는지 테스트하세요:

```sql
-- 트리거 테스트
BEGIN;

-- 테스트 데이터 삽입
INSERT INTO public.gyms (name, address, latitude, longitude)
VALUES ('테스트 헬스장', '서울시 강남구', 37.5665, 126.9780)
RETURNING id, created_at, updated_at;

-- 1초 대기
SELECT pg_sleep(1);

-- UPDATE 실행
UPDATE public.gyms
SET name = '수정된 헬스장'
WHERE name = '테스트 헬스장'
RETURNING id, created_at, updated_at;

-- updated_at이 자동으로 업데이트되었는지 확인
SELECT 
  id,
  name,
  created_at,
  updated_at,
  CASE 
    WHEN updated_at > created_at + INTERVAL '1 second'
    THEN '트리거 동작 성공'
    ELSE '트리거 동작 실패'
  END AS test_result
FROM public.gyms
WHERE name = '수정된 헬스장';

-- 정리
DELETE FROM public.gyms WHERE name = '수정된 헬스장';

ROLLBACK;
```

### 6. FK 제약조건 테스트

다음 SQL 쿼리를 실행하여 FK 제약조건이 올바르게 동작하는지 테스트하세요:

```sql
-- FK 제약조건 테스트
BEGIN;

-- 마스터 데이터 삽입
INSERT INTO public.body_parts (name, display_order) 
VALUES ('허리', 1) 
RETURNING id AS body_part_id;

-- 정상 INSERT 테스트
INSERT INTO public.exercise_templates (name, body_part_id)
VALUES ('허리 스트레칭', (SELECT id FROM public.body_parts WHERE name = '허리' LIMIT 1))
RETURNING id AS exercise_template_id;

-- FK 제약조건 위반 테스트 (에러 발생 기대)
-- 아래 쿼리는 에러를 발생시켜야 정상입니다
-- INSERT INTO public.exercise_templates (name, body_part_id) 
-- VALUES ('실패해야 하는 운동', '00000000-0000-0000-0000-000000000000'::uuid);

-- 정리
DELETE FROM public.exercise_templates WHERE name = '허리 스트레칭';
DELETE FROM public.body_parts WHERE name = '허리';

ROLLBACK;
```

### 7. ON DELETE CASCADE 테스트

다음 SQL 쿼리를 실행하여 ON DELETE CASCADE가 올바르게 동작하는지 테스트하세요:

```sql
-- ON DELETE CASCADE 테스트
BEGIN;

-- 헬스장 및 시설 정보 삽입
INSERT INTO public.gyms (name, address, latitude, longitude)
VALUES ('테스트 헬스장', '서울시 강남구', 37.5665, 126.9780)
RETURNING id AS gym_id;

INSERT INTO public.gym_facilities (gym_id, is_quiet, has_rehab_equipment)
VALUES ((SELECT id FROM public.gyms WHERE name = '테스트 헬스장' LIMIT 1), true, true)
RETURNING id AS gym_facility_id;

-- CASCADE 테스트 전 확인
SELECT 
  'CASCADE 테스트 전' AS test_phase,
  g.id AS gym_id,
  g.name,
  COUNT(gf.id) AS gym_facilities_count
FROM public.gyms g
LEFT JOIN public.gym_facilities gf ON g.id = gf.gym_id
WHERE g.name = '테스트 헬스장'
GROUP BY g.id, g.name;

-- gyms 삭제 (CASCADE로 gym_facilities도 삭제됨)
DELETE FROM public.gyms 
WHERE id = (SELECT id FROM public.gyms WHERE name = '테스트 헬스장' LIMIT 1);

-- CASCADE 테스트 후 확인
SELECT 
  'CASCADE 테스트 결과' AS test_phase,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM public.gyms WHERE name = '테스트 헬스장')
      AND NOT EXISTS (
        SELECT 1 FROM public.gym_facilities gf
        WHERE gf.gym_id IN (SELECT id FROM public.gyms WHERE name = '테스트 헬스장')
      )
    THEN 'CASCADE 동작 성공: gym_facilities가 자동으로 삭제되었습니다.'
    ELSE 'CASCADE 동작 확인 필요'
  END AS test_result;

ROLLBACK;
```

## 수정 사항

### 2025-01-XX: gym_operating_hours 테이블 수정

- `open_time` 컬럼 타입: `time` → `text`
- `close_time` 컬럼 타입: `time` → `text`

**이유**: 플랜 요구사항에 따라 운영 시간을 텍스트 형식으로 저장하도록 변경했습니다.

## 다음 단계

1. **Prisma Client 재생성**: 마이그레이션 적용 후 Prisma Client를 재생성하세요:
   ```bash
   pnpm prisma:generate
   ```

2. **Prisma Studio 실행**: Prisma Studio를 실행하여 스키마를 확인하세요:
   ```bash
   pnpm prisma:studio
   ```

3. **애플리케이션 테스트**: 애플리케이션에서 데이터베이스 연결 및 CRUD 작업을 테스트하세요.

## 참고 자료

- [플랜 문서](.cursor/plans/db_기본_스키마_구축_-_실행_가능한_마이그레이션_작업지시서_9733820f.plan.md)
- [Prisma Schema](prisma/schema.prisma)
- [DB SQL 참고 파일](db.sql)

