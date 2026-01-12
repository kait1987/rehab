# Phase 2 장소 데이터 고도화 - GitHub Issues

> 이 문서의 각 섹션을 GitHub Issues에 복사하여 사용하세요.

---

## 0. EPIC 이슈 (가장 먼저 생성)

### Issue Title
```
EPIC: Phase 2 - 장소 데이터 고도화(제보/운영시간 검증/리뷰 신뢰도)
```

### Issue Body
```markdown
## Goal
헬스장 데이터의 품질과 신뢰성을 향상시키는 3가지 핵심 기능 구현:
1) 사용자 제보(GymReport) → 관리자 승인/거절 → 반영
2) 운영시간 자동 검증(validator + 관리자 수동 검증)
3) 리뷰 신뢰도(trustScore) + 투표(ReviewVote) + trust 정렬

## Security/Authorization Principles (고정)
- Admin SSOT: Clerk publicMetadata.role === 'admin'
- DB 2중 방어: Supabase RLS 활성화 + auth.uid() 기반 정책
- Admin CRUD: Next.js Admin API 서버 경유(클라이언트 직결 최소화)

## Sprint Plan (Tasklist)
### Sprint 1 (1주차): 데이터 모델 + 제보 기능
- [ ] P2-LOC-S1-01 Prisma: GymReport 모델 추가 + 마이그레이션
- [ ] P2-LOC-S1-02 RLS: gym_reports 정책 적용(auth.uid 기반)
- [ ] P2-LOC-S1-03 API: POST /api/gyms/[id]/report (제보 제출)
- [ ] P2-LOC-S1-04 UI: gym-report-button + gym-report-modal
- [ ] P2-LOC-S1-05 Admin API: GET /api/admin/reports (목록)
- [ ] P2-LOC-S1-06 Admin API: PATCH /api/admin/reports/[id] (승인/거절)
- [ ] P2-LOC-S1-07 Admin UI: /admin/reports 페이지
- [ ] P2-LOC-S1-08 E2E: 제보 제출 → 관리자 승인 플로우

### Sprint 2 (2주차): 검증 + 신뢰도 시스템
- [ ] P2-LOC-S2-01 Prisma: GymOperatingHour 필드 확장(verify 관련)
- [ ] P2-LOC-S2-02 Engine: operating-hours-validator.ts + unit test
- [ ] P2-LOC-S2-03 Admin API: 미검증 목록 + 수동 검증 엔드포인트
- [ ] P2-LOC-S2-04 Prisma: Review 확장(trustScore 등) + ReviewVote 모델
- [ ] P2-LOC-S2-05 Engine: review-trust-engine.ts + unit test
- [ ] P2-LOC-S2-06 API: POST /api/reviews/[id]/vote + UI
- [ ] P2-LOC-S2-07 API: GET /api/gyms/[id]/reviews?sort=trust
- [ ] P2-LOC-S2-08 Admin API: POST /api/admin/reviews/recalculate-trust
- [ ] P2-LOC-S2-09 E2E: 리뷰 투표 → trust 정렬 반영 플로우

## Definition of Done (DoD)
- [ ] Unit: operating-hours-validator.test.ts 통과
- [ ] Unit: review-trust-engine.test.ts 통과
- [ ] E2E: 제보 플로우 통과
- [ ] E2E: 리뷰 투표/정렬 플로우 통과
- [ ] RLS 적용 확인(사용자 본인 데이터만 접근/생성 가능)
```

---

## Sprint 1: 데이터 모델 + 제보 기능

### P2-LOC-S1-01

**Title:** `P2-LOC-S1-01 Prisma: GymReport 모델 추가 + 마이그레이션`

```markdown
## Goal
사용자 제보 데이터를 저장할 GymReport 테이블을 추가한다.

## Files
- prisma/schema.prisma (MODIFY)

## DB
- GymReport 모델 추가
- index: gymId, status
- migrate 적용

## Acceptance Criteria (AC)
- [ ] migrate 성공
- [ ] gym_reports 테이블 생성 및 인덱스 확인
- [ ] 샘플 row insert 가능

## Tests
- [ ] Manual: migrate + DB 확인

## Links
- EPIC: Phase 2 - 장소 데이터 고도화
```

---

### P2-LOC-S1-02

**Title:** `P2-LOC-S1-02 RLS: gym_reports 정책 적용(auth.uid 기반)`

```markdown
## Goal
gym_reports에 RLS를 적용해 사용자가 본인 제보만 생성/조회하도록 보호한다.

## Files
- supabase/migrations/xxx_gym_reports_rls.sql (NEW)

## Policy Requirements
- [ ] ALTER TABLE gym_reports ENABLE ROW LEVEL SECURITY;
- [ ] INSERT: WITH CHECK (auth.uid() = user_id)
- [ ] (옵션) SELECT: USING (auth.uid() = user_id)
- [ ] Admin 전체 조회/승인은 RLS로 풀지 않고 Next.js Admin API(서버)에서 처리

## Acceptance Criteria (AC)
- [ ] 로그인 사용자만 insert 가능
- [ ] 타 유저 데이터 select 불가(옵션 정책 적용 시)
- [ ] Supabase Dashboard에서 RLS enabled 확인

## Tests
- [ ] Manual: 정책 확인 및 간단 쿼리 검증
```

---

### P2-LOC-S1-03

**Title:** `P2-LOC-S1-03 API: POST /api/gyms/[id]/report (제보 제출)`

```markdown
## Goal
사용자가 헬스장 정보 오류/변경을 제보할 수 있는 API 구현

## Endpoint
POST /api/gyms/[id]/report

## Body (example)
{
  "reportType": "hours_changed",
  "fieldName": "operatingHours",
  "currentValue": "10:00-22:00",
  "suggestedValue": "09:00-23:00",
  "description": "최근부터 운영시간이 늘어났습니다"
}

## Requirements
- userId는 서버에서 세션 기반으로 강제 주입(클라 입력 무시)
- status는 항상 pending
- 유효성 검증(reportType/fieldName/길이)

## Acceptance Criteria (AC)
- [ ] 로그인 사용자만 가능
- [ ] 성공 시 { id, status: "pending" } 반환
- [ ] RLS 정책과 충돌 없이 insert 성공

## Tests
- [ ] Unit(Vitest): 유효성/응답 스키마
- [ ] E2E(후속): 제보 제출 플로우에서 사용
```

---

### P2-LOC-S1-04

**Title:** `P2-LOC-S1-04 UI: 제보하기 버튼 + 모달`

```markdown
## Goal
Gym detail 화면에서 제보 제출 UI 제공

## Files
- components/gym-detail/gym-report-button.tsx (NEW)
- components/gym-detail/gym-report-modal.tsx (NEW)

## Acceptance Criteria (AC)
- [ ] reportType 1개 이상 선택 필수
- [ ] 제출 성공 시 토스트/닫기/버튼 상태 정상
- [ ] 실패 시 에러 메시지 표시

## Tests
- [ ] Manual: 브라우저에서 제출 확인
- [ ] E2E: 제보 플로우에서 커버
```

---

### P2-LOC-S1-05

**Title:** `P2-LOC-S1-05 Admin API: GET /api/admin/reports (제보 목록)`

```markdown
## Goal
관리자가 pending 제보를 목록으로 확인한다(필터/페이지네이션 포함)

## Endpoint
GET /api/admin/reports?status=pending&page=1&limit=20

## Requirements
- requireAdmin(Clerk role) 가드 적용
- 기본 정렬: createdAt desc

## Acceptance Criteria (AC)
- [ ] admin만 200
- [ ] non-admin 401/403
- [ ] status 필터 동작

## Tests
- [ ] Unit(Vitest): 권한/필터
```

---

### P2-LOC-S1-06

**Title:** `P2-LOC-S1-06 Admin API: PATCH /api/admin/reports/[id] (승인/거절)`

```markdown
## Goal
관리자가 제보를 approve/reject 처리한다.

## Endpoint
PATCH /api/admin/reports/[id]

## Body
{ "action": "approve" | "reject", "reviewNote"?: string }

## Requirements
- requireAdmin(Clerk role) 가드
- status 업데이트 + reviewedAt/reviewedBy 기록

## Acceptance Criteria (AC)
- [ ] approve/reject 동작
- [ ] 처리 후 목록에서 상태 반영

## Tests
- [ ] Unit(Vitest): 액션별 테스트
```

---

### P2-LOC-S1-07

**Title:** `P2-LOC-S1-07 Admin UI: /admin/reports (제보 관리 페이지)`

```markdown
## Goal
관리자 제보 관리 UI 구현(목록/필터/승인/거절)

## Files
- app/admin/reports/page.tsx (NEW)

## Acceptance Criteria (AC)
- [ ] pending 목록 표시
- [ ] approve/reject 버튼 동작
- [ ] 처리 후 UI 갱신

## Tests
- [ ] Manual: admin 계정으로 사용 확인
```

---

### P2-LOC-S1-08

**Title:** `P2-LOC-S1-08 E2E: 제보 제출 → 관리자 승인 플로우`

```markdown
## Goal
제보 기능 회귀 방지 E2E 추가

## Scenario
1) 일반 사용자: gym detail → report 제출
2) 관리자: /admin/reports → approve
3) 상태 변경 확인

## Acceptance Criteria (AC)
- [ ] 전체 플로우 통과
```

---

## Sprint 2: 검증 + 신뢰도 시스템

### P2-LOC-S2-01 ~ S2-09

*(Sprint 2 이슈는 Sprint 1 완료 후 생성)*

---

## 이슈 생성 순서

1. **EPIC 이슈 먼저 생성**
2. **Sprint 1 이슈 생성 (S1-01 ~ S1-08)**
3. **EPIC tasklist에 이슈 링크 추가**
4. **Sprint 2는 Sprint 1 완료 후 생성**
