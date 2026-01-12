# Engine v2 아키텍처 문서

## 개요

Engine v2는 재활 운동 코스 생성을 위한 핵심 엔진입니다.

## 핵심 모듈

### 1. Contraindication Engine
**파일:** `src/lib/engine/contraindication-engine.ts`

금기 조건을 체크하고 제외할 운동을 결정합니다.

```typescript
// 사용 예시
const result = await checkContraindication({
  templateId: 'template-001',
  bodyPartId: 'body-part-001',
  painLevel: 5,
  condition: '급성'
});

if (result.isExcluded) {
  // 운동 제외
}
```

### 2. Difficulty Engine
**파일:** `src/lib/engine/difficulty-engine.ts`

사용자 상태 기반 자동 난이도 조절을 수행합니다.

```typescript
// 사용 예시
const difficulty = await calculateDifficulty({
  userId: 'user-001',
  selectedBodyParts: ['bp-001'],
  painLevels: { 'bp-001': 3 },
  userRehabPhase: 'recovery'
});

// 운동에 조정 적용
const adjusted = applyDifficultyAdjustments(exercise, difficulty.adjustments);
```

## 데이터 모델

### BodyPart (계층 구조)
- `parentId`: 상위 부위 (null = 대분류)
- `level`: 1=대분류, 2=소분류
- `synonyms`: 동의어 배열

### UserFitnessProfile
- `fitnessLevel`: 1-5
- `rehabPhase`: initial | recovery | strengthening
- `avgCompletionRate`: 코스 완료율

## 로컬 실행

```bash
# 1. 템플릿 분석
npx tsx scripts/analyze-templates.ts

# 2. 템플릿 시드 (200개)
npx tsx scripts/seed-templates-v2.ts

# 3. 부위 시드 (50개)
npx tsx scripts/seed-body-parts-50.ts

# 4. 단위 테스트
npm run test -- --grep "engine"

# 5. E2E 테스트
npx playwright test tests/e2e/course-generation-v2.spec.ts
```

## 재활 단계별 규칙

| 단계 | 최대 강도 | 반복 배수 | 휴식 배수 |
|------|----------|----------|----------|
| 초기 | 2 | 0.7x | 1.3x |
| 회복 | 3 | 1.0x | 1.0x |
| 강화 | 4 | 1.2x | 0.8x |

## 통증 레벨별 조정

| 통증 | 강도 조정 | 반복 조정 |
|------|----------|----------|
| 1-2 | +0~1 | 1.0-1.2x |
| 3 | 0 | 0.9x |
| 4-5 | -1~2 | 0.5-0.7x |
