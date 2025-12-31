-- ===================================================
-- 유용한 뷰 (View) 생성
-- ===================================================

-- 헬스장 요약 정보 뷰
CREATE OR REPLACE VIEW public.vw_gym_summary AS
SELECT
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
  count(DISTINCT r.id) AS review_count,
  count(DISTINCT rtm.review_tag_id) AS tag_count,
  g.created_at,
  g.updated_at
FROM public.gyms g
LEFT JOIN public.gym_facilities gf ON g.id = gf.gym_id
LEFT JOIN public.reviews r ON g.id = r.gym_id AND r.is_deleted = false
LEFT JOIN public.review_tag_mappings rtm ON r.id = rtm.review_id
WHERE g.is_active = true
GROUP BY g.id, g.name, g.address, g.latitude, g.longitude, g.price_range, g.is_active, g.facility_info_count,
         gf.is_quiet, gf.has_rehab_equipment, gf.has_pt_coach, gf.has_shower, gf.has_parking, g.created_at, g.updated_at;

COMMENT ON VIEW public.vw_gym_summary IS '헬스장 요약 정보';

-- 리뷰 요약 정보 뷰
CREATE OR REPLACE VIEW public.vw_review_summary AS
SELECT
  r.id,
  r.gym_id,
  g.name AS gym_name,
  r.user_id,
  r.comment,
  r.is_admin_review,
  r.created_at,
  array_agg(rt.name) AS tags
FROM public.reviews r
JOIN public.gyms g ON r.gym_id = g.id
LEFT JOIN public.review_tag_mappings rtm ON r.id = rtm.review_id
LEFT JOIN public.review_tags rt ON rtm.review_tag_id = rt.id
WHERE r.is_deleted = false
GROUP BY r.id, r.gym_id, g.name, r.user_id, r.comment, r.is_admin_review, r.created_at;

COMMENT ON VIEW public.vw_review_summary IS '리뷰 요약 정보';

-- 코스 요약 정보 뷰
CREATE OR REPLACE VIEW public.vw_course_summary AS
SELECT
  c.id,
  c.user_id,
  c.total_duration_minutes,
  c.pain_level,
  c.experience_level,
  c.body_parts,
  c.equipment_available,
  c.course_type,
  c.is_template,
  count(DISTINCT ce.id) AS exercise_count,
  sum(ce.duration_minutes) AS total_exercise_duration,
  c.created_at,
  c.updated_at
FROM public.courses c
LEFT JOIN public.course_exercises ce ON c.id = ce.course_id
GROUP BY c.id, c.user_id, c.total_duration_minutes, c.pain_level, c.experience_level,
         c.body_parts, c.equipment_available, c.course_type, c.is_template, c.created_at, c.updated_at;

COMMENT ON VIEW public.vw_course_summary IS '코스 요약 정보';

