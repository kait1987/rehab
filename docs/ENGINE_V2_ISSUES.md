# Phase 2 Engine v2 - GitHub Issues

> 이 문서의 각 섹션을 GitHub Issues에 복사하여 사용하세요.

---

## 0. EPIC 이슈 (가장 먼저 생성)

### Issue Title
```
EPIC: Phase 2 Engine v2 (Templates/BodyBank/Contra/Difficulty)
```

### Issue Body
```markdown
## Goal
Engine v2를 3주(데이터 1주 + 로직 1주 + 통합/검증 1주) 안에 "기능적으로 동작 + 테스트 가능" 상태로 만든다.

## Non-goals
- 의료 진단/처방 수준의 로직 고도화
- 프로덕션 운영 자동화(배치/크론) 완성

## Sprint Plan (Tasklist)
### Sprint 1 — Templates 200 확장
- [ ] ENG-S1-01 scripts/analyze-templates.ts (현황 분석 스크립트)
- [ ] ENG-S1-02 data/exercise-templates-expansion.json (추가 템플릿 100개)
- [ ] ENG-S1-03 scripts/seed-templates-v2.ts (템플릿 시드 v2)
- [ ] ENG-S1-04 prisma/seeds/exercise-templates.ts 정리(통합/재현성)

### Sprint 2 — Body Bank 50+ 확장
- [ ] ENG-S2-01 prisma/schema.prisma: BodyPart 계층/동의어 필드
- [ ] ENG-S2-02 src/types/body-part-hierarchy.ts (타입/헬퍼)
- [ ] ENG-S2-03 scripts/seed-body-parts-50.(js|ts) (부위 50+ 시딩)
- [ ] ENG-S2-04 UI 단계적 선택(최소 지원)

### Sprint 3 — Contraindication Engine 고도화
- [ ] ENG-S3-01 prisma/schema.prisma: BodyPartContraindication 모델
- [ ] ENG-S3-02 src/lib/engine/contraindication-engine.ts
- [ ] ENG-S3-03 course-generation 통합(filter/merge)

### Sprint 4 — Difficulty Engine(자동 난이도)
- [ ] ENG-S4-01 prisma/schema.prisma: UserFitnessProfile 모델
- [ ] ENG-S4-02 src/lib/engine/difficulty-engine.ts
- [ ] ENG-S4-03 multiplier를 코스 결과에 반영

### Sprint 5 — 통합/검증/문서화
- [ ] ENG-S5-01 Unit test suites (contraindication/difficulty)
- [ ] ENG-S5-02 E2E tests/e2e/course-generation-v2.spec.ts
- [ ] ENG-S5-03 Engine v2 문서화(README/ARCHITECTURE)

## Definition of Done (DoD)
- [ ] Templates 200개 + Body parts 50+ 시드가 재현 가능(새 DB에서도 동일하게 구성)
- [ ] Contraindication/Difficulty 엔진이 Unit 테스트로 고정됨
- [ ] E2E 1개 이상으로 코스 생성 v2 플로우 검증
- [ ] 문서에 로컬 실행/검증 커맨드가 정리됨

## Links
- Related: Phase 2 Sprint Board (Admin/Records/Quality)
```

---

## Sprint 1: Templates 200 확장

### ENG-S1-01

**Title:** `ENG-S1-01: scripts/analyze-templates.ts (templates 현황 분석)`

```markdown
## Goal
현재 exercise_templates 분포(부위/강도/기구/스트레칭)를 분석해 부족 카테고리를 수치로 도출한다.

## Scope
- In: DB 조회 → 통계 산출 → JSON/콘솔 출력
- Out: 추천 로직 변경

## Acceptance Criteria (AC)
- [ ] 총 템플릿 수 출력
- [ ] bodyPart별 count 출력
- [ ] intensityLevel별 분포 출력
- [ ] equipment별 분포 출력
- [ ] 결과를 reports/templates-analysis.json로 저장(또는 동등한 출력)

## Implementation Notes
- 실행 커맨드: node scripts/analyze-templates.ts (실행 방식은 repo 환경에 맞춤)

## Tests
- [ ] Manual: 스크립트 실행 성공 및 출력 확인

## Links
- EPIC: Phase 2 Engine v2
```

---

### ENG-S1-02

**Title:** `ENG-S1-02: data/exercise-templates-expansion.json (추가 템플릿 100개)`

```markdown
## Goal
추가 템플릿 100개를 JSON 데이터로 고정해 시드/검증의 단일 소스로 사용한다.

## Acceptance Criteria (AC)
- [ ] TemplateExpansionInput 스키마와 호환
- [ ] name 중복 없음(또는 중복 처리 규칙 명시)
- [ ] bodyPartName/equipmentNames가 마스터 데이터와 매칭
- [ ] 목표 분포 충족(어깨/허리/무릎/목·손목/스트레칭/기타)

## Tests
- [ ] Manual: JSON lint + seed 파싱 성공

## Links
- Related: ENG-S1-03
```

---

### ENG-S1-03

**Title:** `ENG-S1-03: scripts/seed-templates-v2.ts (템플릿 시드 v2)`

```markdown
## Goal
추가 템플릿을 시딩해 exercise_templates를 200개 이상으로 만든다(재실행 안전).

## Acceptance Criteria (AC)
- [ ] seed 실행 후 templates >= 200
- [ ] bodyPartName/equipmentNames 매칭 실패 시 exit 1로 실패(누락 금지)
- [ ] 재실행해도 중복 insert로 깨지지 않음(UPSERT/skip 규칙 구현)

## Tests
- [ ] Manual: seed 실행 + DB count 확인

## Links
- Related: ENG-S1-02, ENG-S1-04
```

---

### ENG-S1-04

**Title:** `ENG-S1-04: prisma/seeds/exercise-templates.ts 정리(시드 통합/재현성)`

```markdown
## Goal
기존 seed와 v2 seed를 정리해 "마스터 데이터 시드 파이프라인"을 단일 엔트리로 고정한다.

## Acceptance Criteria (AC)
- [ ] 로컬 fresh DB에서 seed 실행 시 pain-check 관련 마스터 데이터가 항상 존재
- [ ] npm run verify(또는 seed) 경로에 templates seed가 포함됨
- [ ] 시드 실패 시 원인이 로그로 명확히 남음

## Tests
- [ ] Manual: fresh DB에서 verify/seed 동작 확인
```

---

## Sprint 2: Body Bank 50+ 확장

### ENG-S2-01

**Title:** `ENG-S2-01: prisma/schema.prisma - BodyPart 계층/동의어 필드 추가`

```markdown
## Goal
BodyPart를 계층(parentId/level) + 동의어(synonyms) 기반으로 확장한다.

## Acceptance Criteria (AC)
- [ ] schema.prisma에 parentId, level, synonyms, displayOrder, isActive 추가
- [ ] npx prisma migrate dev 성공
- [ ] parent/children relation 조회 가능

## Notes
- migrate는 dev workflow를 따른다.

## Tests
- [ ] Manual: migrate dev 성공
```

---

### ENG-S2-02

**Title:** `ENG-S2-02: src/types/body-part-hierarchy.ts (계층 타입/헬퍼)`

```markdown
## Goal
UI/엔진 공통으로 쓰는 BodyPart 계층 타입/헬퍼를 제공한다.

## Acceptance Criteria (AC)
- [ ] BodyPartNode 타입 정의
- [ ] 트리 빌드/플랫 변환 유틸
- [ ] 동의어 매칭 헬퍼(옵션)

## Tests
- [ ] Unit(Vitest): 트리 구성/조회 테스트
```

---

### ENG-S2-03

**Title:** `ENG-S2-03: scripts/seed-body-parts-50 (부위 50+ 시딩)`

```markdown
## Goal
body_parts를 50+개로 확장하고 parentId/level/synonyms를 포함해 시딩한다.

## Acceptance Criteria (AC)
- [ ] seed 실행 후 body_parts >= 50
- [ ] parentId 참조 무결성 보장
- [ ] displayOrder 기준 정렬 가능

## Tests
- [ ] Manual: count + 샘플 계층 검증
```

---

### ENG-S2-04

**Title:** `ENG-S2-04: UI 단계적 부위 선택(대분류→소분류) 최소 지원`

```markdown
## Goal
부위 선택을 대분류→소분류로 진행 가능하게 최소 UI를 제공한다.

## Acceptance Criteria (AC)
- [ ] 대분류 선택 시 하위 부위 목록이 필터되어 노출
- [ ] 최종 선택 값이 기존 코스 생성 입력과 호환

## Tests
- [ ] E2E(선택): 부위 선택 스모크 1개
```

---

## Sprint 3: Contraindication Engine 고도화

### ENG-S3-01

**Title:** `ENG-S3-01: prisma/schema.prisma - BodyPartContraindication 모델 추가`

```markdown
## Goal
부위+템플릿+통증 범위 기반 금기 조건 테이블을 도입한다.

## Acceptance Criteria (AC)
- [ ] BodyPartContraindication 모델 추가
- [ ] npx prisma migrate dev 성공
- [ ] painLevelMin/Max, condition, severity(soft/hard) 포함

## Tests
- [ ] Manual: migrate dev 성공
```

---

### ENG-S3-02

**Title:** `ENG-S3-02: src/lib/engine/contraindication-engine.ts 구현`

```markdown
## Goal
checkContraindication(input) -> ContraindicationResult 엔진 구현

## Acceptance Criteria (AC)
- [ ] hard 금기는 제외(isExcluded=true)
- [ ] soft 금기는 경고 + 대체 후보 제공 가능
- [ ] painLevel + condition 조합 처리

## Tests
- [ ] Unit(Vitest): 통증 5 제외, 통증 2 통과 등 케이스
```

---

### ENG-S3-03

**Title:** `ENG-S3-03: course-generation 통합(filter-contraindications + merge-body-parts)`

```markdown
## Goal
코스 생성 로직에 금기 엔진을 통합해 결과 코스에서 제외가 반영되게 한다.

## Acceptance Criteria (AC)
- [ ] 금기 대상 템플릿이 결과 코스에서 제외됨
- [ ] 제외 사유가 UI에서 표시 가능(옵션)

## Tests
- [ ] Unit(Vitest): 특정 templateId 제외 검증
- [ ] E2E(옵션): 고통증 입력 시 고강도 제외
```

---

## Sprint 4: Difficulty Engine (자동 난이도)

### ENG-S4-01

**Title:** `ENG-S4-01: prisma/schema.prisma - UserFitnessProfile 모델 추가`

```markdown
## Goal
난이도 자동 조절을 위한 사용자 상태 모델(UserFitnessProfile)을 추가한다.

## Acceptance Criteria (AC)
- [ ] npx prisma migrate dev 성공
- [ ] fitnessLevel(1~5), rehabPhase 포함
- [ ] avgCompletionRate/avgPainReduction 포함

## Tests
- [ ] Manual: migrate dev 성공
```

---

### ENG-S4-02

**Title:** `ENG-S4-02: src/lib/engine/difficulty-engine.ts 구현`

```markdown
## Goal
calculateDifficulty(input) -> DifficultyOutput(강도 + multipliers + reason)을 구현한다.

## Acceptance Criteria (AC)
- [ ] rehabPhase 3단계 규칙 적용
- [ ] 통증 레벨 기반 조정 적용(4~5 강도 다운 등)
- [ ] recommendedIntensity가 항상 1~5 범위

## Tests
- [ ] Unit(Vitest): phase/통증별 시나리오
```

---

### ENG-S4-03

**Title:** `ENG-S4-03: 난이도 multipliers를 코스 결과(sets/reps/rest/duration)에 반영`

```markdown
## Goal
DifficultyOutput multipliers를 코스 생성 결과에 실제 적용한다.

## Acceptance Criteria (AC)
- [ ] reps/sets/rest/duration이 multiplier로 조정됨
- [ ] 총 시간(60/90/120) 제약을 크게 벗어나지 않음(허용 오차 정책 명시)

## Tests
- [ ] Unit(Vitest): multiplier 적용 결과 검증
```

---

## Sprint 5: 통합/검증/문서화

### ENG-S5-01

**Title:** `ENG-S5-01: Unit test suites (contraindication/difficulty)`

```markdown
## Goal
엔진 로직을 단위 테스트로 고정한다.

## Acceptance Criteria (AC)
- [ ] contraindication 관련 테스트 통과
- [ ] difficulty 관련 테스트 통과

## Tests
- [ ] Unit(Vitest)
```

---

### ENG-S5-02

**Title:** `ENG-S5-02: E2E tests/e2e/course-generation-v2.spec.ts`

```markdown
## Goal
Engine v2 핵심 플로우를 E2E로 검증한다.

## Acceptance Criteria (AC)
- [ ] 통증 4~5 입력 시 고강도 템플릿 제외 확인
- [ ] rehabPhase에 따라 강도/반복/휴식 변화 확인
- [ ] 실패 시 trace로 디버깅 가능

## Notes
- Playwright trace는 `npx playwright test --trace on`, `npx playwright show-trace`로 확인 가능.
```

---

### ENG-S5-03

**Title:** `ENG-S5-03: Engine v2 문서화(README/ARCHITECTURE)`

```markdown
## Goal
엔진 v2 데이터/규칙/테스트 방법을 문서화한다.

## Acceptance Criteria (AC)
- [ ] 템플릿 데이터 스키마 + seed 방법 문서화
- [ ] 금기/난이도 규칙 정리
- [ ] 로컬 검증 커맨드(verify 포함) 정리

## Tests
- [ ] Manual: 문서대로 따라했을 때 재현 가능
```

---

## 이슈 생성 순서

1. **EPIC 이슈 먼저 생성**
2. **각 ENG-* 이슈 생성 후 EPIC의 체크리스트에 링크 추가**

예시:
```markdown
- [ ] [ENG-S1-01](#123) scripts/analyze-templates.ts
```
