-- ===================================================
-- 추가 인덱스 생성
-- Prisma Schema에 정의된 모든 인덱스 확인 및 누락된 인덱스 추가
-- ===================================================

-- 모든 필수 인덱스는 이미 각 테이블 생성 마이그레이션에서 생성되었습니다.
-- 이 파일은 추가적인 성능 최적화 인덱스나 복합 인덱스를 위한 공간입니다.

-- 필요시 추가 인덱스를 여기에 작성하세요.
-- 예: 자주 사용되는 쿼리 패턴에 대한 복합 인덱스 등

-- 현재 Prisma Schema에 정의된 모든 인덱스는 이미 생성되었습니다:
-- - body_parts: display_order
-- - equipment_types: display_order
-- - review_tags: category, display_order
-- - gyms: location (latitude, longitude), is_active, price_range
-- - gym_facilities: gym_id, is_quiet, has_rehab_equipment, has_pt_coach
-- - gym_operating_hours: gym_id, day_of_week
-- - gym_crowd_levels: gym_id, time_slot, crowd_level
-- - exercise_templates: body_part_id, intensity_level, is_active
-- - exercise_equipment_mappings: exercise_template_id, equipment_type_id
-- - courses: user_id, pain_level, is_template, created_at DESC
-- - course_exercises: course_id, exercise_template_id, section (section, order_in_section)
-- - reviews: gym_id, user_id, is_deleted, is_admin_review, created_at DESC
-- - review_tag_mappings: review_id, review_tag_id
-- - user_pain_profiles: user_id, body_part_id
-- - user_course_history: user_id, course_id, saved_at DESC, is_favorite
-- - user_favorites: user_id, gym_id, saved_at DESC
-- - events: user_id, anonymous_id, event_name, event_time DESC

-- 추가 인덱스가 필요한 경우 여기에 작성하세요.

