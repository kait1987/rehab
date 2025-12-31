-- ===================================================
-- 부위 Bank 시드 데이터 (예시)
-- ===================================================
-- 
-- 주의: 실제 시드는 scripts/upload-body-part-bank.ts 스크립트를 사용하세요.
-- 이 파일은 예시용으로만 제공됩니다.
-- 
-- 사용법:
--   pnpm body-part-bank:generate  # JSON 생성
--   pnpm body-part-bank:validate  # 검증
--   pnpm body-part-bank:upload    # 업로드
-- ===================================================

-- 예시: 허리 부위에 대한 추천 운동 및 금기 운동
-- (실제 데이터는 scripts/upload-body-part-bank.ts로 업로드)

/*
-- 예시 INSERT 문 (주석 처리됨)
-- body_part_id와 exercise_template_id는 실제 UUID로 대체해야 합니다.

-- 추천 운동 매핑 예시
INSERT INTO public.body_part_exercise_mappings (
  body_part_id,
  exercise_template_id,
  priority,
  intensity_level,
  pain_level_range,
  is_active
) VALUES (
  (SELECT id FROM public.body_parts WHERE name = '허리'),
  (SELECT id FROM public.exercise_templates WHERE name = '허리 스트레칭 1'),
  1,
  2,
  '1-2',
  true
);

-- 금기 운동 예시
INSERT INTO public.body_part_contraindications (
  body_part_id,
  exercise_template_id,
  pain_level_min,
  reason,
  severity,
  is_active
) VALUES (
  (SELECT id FROM public.body_parts WHERE name = '허리'),
  (SELECT id FROM public.exercise_templates WHERE name = '고강도 허리 운동'),
  4,
  '통증이 심할 때는 피해야 함',
  'strict',
  true
);
*/

