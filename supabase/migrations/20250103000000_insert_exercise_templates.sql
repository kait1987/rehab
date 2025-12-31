-- ===================================================
-- 재활 운동 템플릿 초기 데이터 삽입
-- ===================================================
-- 
-- 이 마이그레이션은 templates/exercise-templates-100.json 파일을
-- 기반으로 작성되었습니다.
-- 
-- 실제 운영 시에는 scripts/upload-templates.ts 스크립트를 사용하여
-- JSON 파일에서 직접 업로드하는 것을 권장합니다.
-- 
-- 이 SQL 파일은 예시용이며, 실제 데이터는 JSON 파일을 참고하세요.

-- 주의: 이 마이그레이션은 body_parts와 equipment_types가
-- 이미 삽입되어 있어야 합니다 (20250102000011_insert_seed_data.sql).

-- 예시 템플릿 1개만 포함 (실제 100개는 scripts/upload-templates.ts 사용 권장)
-- 
-- 템플릿 업로드 방법:
-- 1. pnpm tsx scripts/validate-templates.ts (검증)
-- 2. pnpm tsx scripts/upload-templates.ts (업로드)

-- 예시: 허리 스트레칭 템플릿
-- 실제 사용 시에는 scripts/upload-templates.ts를 사용하세요.

-- INSERT INTO public.exercise_templates (
--   name,
--   description,
--   body_part_id,
--   intensity_level,
--   duration_minutes,
--   reps,
--   sets,
--   rest_seconds,
--   difficulty_score,
--   contraindications,
--   instructions,
--   precautions,
--   is_active
-- )
-- SELECT
--   '허리 스트레칭 예시',
--   '허리 부위를 위한 재활 운동 템플릿 예시입니다.',
--   bp.id,
--   2,
--   15,
--   12,
--   3,
--   45,
--   3,
--   ARRAY[]::text[],
--   '허리 부위에 집중하는 운동입니다. 천천히 진행하세요.',
--   '통증이 심해지면 즉시 중단하고 전문의와 상담하세요.',
--   true
-- FROM public.body_parts bp
-- WHERE bp.name = '허리'
-- ON CONFLICT DO NOTHING;

-- 예시: 기구 매핑
-- INSERT INTO public.exercise_equipment_mappings (
--   exercise_template_id,
--   equipment_type_id,
--   is_required
-- )
-- SELECT
--   et.id,
--   eq.id,
--   false
-- FROM public.exercise_templates et
-- CROSS JOIN public.equipment_types eq
-- WHERE et.name = '허리 스트레칭 예시'
--   AND eq.name = '매트'
-- ON CONFLICT DO NOTHING;

-- 실제 템플릿 데이터는 scripts/upload-templates.ts를 사용하여 업로드하세요.
-- 이 파일은 마이그레이션 구조 예시용입니다.

COMMENT ON TABLE public.exercise_templates IS '운동 템플릿 - 실제 데이터는 scripts/upload-templates.ts로 업로드';

