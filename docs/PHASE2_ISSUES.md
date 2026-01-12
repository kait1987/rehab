# Phase 2 GitHub Issues (Copy/Paste Ready)

이 파일의 각 섹션을 GitHub Issue 본문에 그대로 복사하여 사용하세요.

---

## 공통 Issue 템플릿 (상단 삽입용)

```markdown
## Goal
<!-- 이 티켓이 끝나면 무엇이 가능해지는지 1~2줄 -->

## Scope
- In:
- Out:

## Acceptance Criteria (AC)
- [ ] 

## Implementation Notes
- 

## Tests
- [ ] Unit (Vitest)
- [ ] E2E (Playwright)
- [ ] Manual

## Links
- Sprint:
- Related tickets:
```

---

# 🗓️ Sprint 1 (1/18–1/25) - Admin Foundation

## S1-01: docs/ADMIN_SETUP.md (Clerk admin role 가이드)

```markdown
## Goal
Clerk에서 관리자 role(publicMetadata) 부여 방법을 문서화한다.

## Scope
- In: Clerk Dashboard에서 user publicMetadata에 role=admin 설정 가이드
- Out: 자동 role 부여 로직

## Acceptance Criteria (AC)
- [ ] docs/ADMIN_SETUP.md 문서가 추가된다.
- [ ] role 설정 예시(JSON) 포함.
- [ ] "Production 키/인스턴스 사용" 주의 문구 포함.

## Implementation Notes
- Clerk RBAC는 publicMetadata에 role을 넣는 패턴을 권장한다.

## Tests
- [ ] Manual: 문서대로 설정 시 관리자 접근 가능(추후 S1-02/S1-07과 함께)

## Links
- Sprint: S1
- Reference: Clerk RBAC (publicMetadata)
```

---

## S1-02: src/middleware.ts - /admin 가드

```markdown
## Goal
/admin/* 경로를 관리자만 접근 가능하게 막는다.

## Scope
- In: middleware에서 role 검사 후 unauthorized redirect
- Out: DB is_admin 기반 권한 체크(SSOT는 Clerk)

## Acceptance Criteria (AC)
- [ ] 비로그인 사용자가 /admin 접근 시 로그인 또는 /unauthorized로 이동한다.
- [ ] 일반 사용자 role로 /admin 접근 시 /unauthorized로 이동한다.
- [ ] admin role로 /admin 접근 시 정상 렌더링된다.

## Implementation Notes
- Clerk session token claims에서 publicMetadata.role을 읽어 role 체크한다.
- claims 경로(sessionClaims.*)는 S1-03 설정과 반드시 일치시킨다.

## Tests
- [ ] E2E: admin-access.spec.ts에서 비로그인/일반/관리자 케이스 검증

## Links
- Sprint: S1
- Related: S1-03, S1-06, S1-07
```

---

## S1-03: Clerk Session Token에 publicMetadata 포함

```markdown
## Goal
middleware/API에서 role을 안정적으로 읽을 수 있게 session token claims에 publicMetadata를 포함한다.

## Scope
- In: Clerk Dashboard 설정(세션 토큰 커스터마이즈)
- Out: 앱 코드 변경(별도 티켓에서)

## Acceptance Criteria (AC)
- [ ] sessionClaims에서 publicMetadata.role을 읽을 수 있다(서버 로그/테스트로 확인).

## Implementation Notes
- Clerk RBAC 가이드에 따라 publicMetadata를 기반으로 role을 관리한다.

## Tests
- [ ] Manual: 서버에서 sessionClaims dump로 role 확인

## Links
- Sprint: S1
- Related: S1-02, S1-04
```

---

## S1-04: src/lib/auth/admin-guard.ts (requireAdmin 유틸)

```markdown
## Goal
관리자 API에서 재사용 가능한 requireAdmin() 가드 함수를 만든다.

## Scope
- In: requireAdmin() 구현 + 테스트
- Out: 각 API에 적용(개별 API 티켓에서 적용)

## Acceptance Criteria (AC)
- [ ] requireAdmin()이 admin이 아니면 UNAUTHORIZED 에러를 던진다.
- [ ] admin이면 정상 반환한다.

## Implementation Notes
- auth()로 sessionClaims를 읽고 publicMetadata.role 기반으로 판단한다.

## Tests
- [ ] Unit(Vitest): admin/non-admin mock으로 케이스 2개

## Links
- Sprint: S1
- Related: S1-05
```

---

## S1-05: /api/admin/health 샘플 라우트

```markdown
## Goal
관리자 API 가드 패턴을 실제 route에 적용해 샘플로 고정한다.

## Scope
- In: GET /api/admin/health
- Out: DB 접근

## Acceptance Criteria (AC)
- [ ] admin 요청: 200 + { ok: true, role: 'admin' } 반환
- [ ] non-admin 요청: 401/403 처리

## Implementation Notes
- requireAdmin()을 사용한다.

## Tests
- [ ] Unit(Vitest): admin/non-admin 케이스
- [ ] Manual: curl로 확인

## Links
- Sprint: S1
- Related: S1-04
```

---

## S1-06: /unauthorized 페이지

```markdown
## Goal
권한 없는 사용자에게 명확한 안내 페이지를 제공한다.

## Scope
- In: src/app/unauthorized/page.tsx
- Out: 디자인 고도화

## Acceptance Criteria (AC)
- [ ] "권한이 없습니다" 메시지 렌더링
- [ ] 홈으로 이동 CTA 제공

## Tests
- [ ] E2E: unauthorized 페이지 렌더 확인

## Links
- Sprint: S1
```

---

## S1-07: tests/e2e/admin/admin-access.spec.ts (Admin 스모크)

```markdown
## Goal
/admin 접근 제어가 깨지지 않도록 스모크 E2E를 추가한다.

## Scope
- In: 비로그인/일반/관리자 접근 시나리오
- Out: 관리자 기능 CRUD 플로우

## Acceptance Criteria (AC)
- [ ] 비로그인 → /admin 접근 시 차단 동작 확인
- [ ] 일반 사용자 → /admin 접근 시 차단 동작 확인
- [ ] 관리자 → /admin 접근 성공

## Implementation Notes
- 추후 admin 로그인 세션은 storageState 또는 테스트용 계정으로 고정(방법은 팀 내 합의).

## Tests
- [ ] E2E: playwright에서 통과

## Links
- Sprint: S1
```

---

# 🗓️ Sprint 2 (1/25–2/01) - Admin Dashboard + Templates Read

## S2-01: src/app/admin/layout.tsx (Admin Layout)

```markdown
## Goal
/admin 하위 페이지 공통 레이아웃(사이드바/네비)을 제공한다.

## Acceptance Criteria (AC)
- [ ] Dashboard/Templates/Reviews/Gyms 링크가 노출된다.
- [ ] 접근 시 올바른 라우트로 이동한다.

## Tests
- [ ] E2E: 레이아웃 렌더링 스모크

## Links
- Sprint: S2
```

---

## S2-02: src/app/admin/page.tsx (Dashboard)

```markdown
## Goal
관리자 대시보드에서 핵심 지표 카드 4개를 보여준다.

## Acceptance Criteria (AC)
- [ ] 지표 카드 4개가 렌더링된다.
- [ ] API 응답이 없을 때 로딩/에러 상태가 보인다.

## Tests
- [ ] E2E: 카드 4개 표시 확인

## Links
- Sprint: S2
```

---

## S2-03: GET /api/admin/stats

```markdown
## Goal
관리자 대시보드 지표를 제공하는 API를 만든다.

## API Contract
GET /api/admin/stats -> { totalUsers, todayCourses, newReviews, pendingReports }

## Acceptance Criteria (AC)
- [ ] admin만 호출 가능하다(가드 적용).
- [ ] 응답 스키마가 문서와 일치한다.

## Tests
- [ ] Unit(Vitest): 집계 로직(최소 mock)

## Links
- Sprint: S2
```

---

## S2-04: src/app/admin/templates/page.tsx (Templates List)

```markdown
## Goal
템플릿 목록/검색/페이지네이션 UI를 제공한다.

## Acceptance Criteria (AC)
- [ ] 검색어 입력 시 목록이 필터된다.
- [ ] 페이지 이동이 동작한다.

## Tests
- [ ] E2E: 목록 렌더/검색 동작

## Links
- Sprint: S2
```

---

## S2-05: GET /api/admin/templates (List API)

```markdown
## Goal
템플릿 목록/검색/페이지네이션 API 제공

## API Contract
GET /api/admin/templates?page=&limit=&search=

## Acceptance Criteria (AC)
- [ ] admin만 호출 가능하다(가드).
- [ ] page/limit/search 동작한다.

## Tests
- [ ] Unit(Vitest): 페이지네이션/검색

## Links
- Sprint: S2
```

---

# 🗓️ Sprint 3 (2/01–2/08) - Admin CRUD (Templates/Reviews)

## S3-01: Admin Template Create/Edit UI

```markdown
## Goal
관리자가 템플릿을 생성/수정할 수 있는 폼 제공

## Acceptance Criteria (AC)
- [ ] 생성/수정 폼이 필수 필드 검증을 한다.
- [ ] 저장 성공 시 목록/상세로 정상 이동한다.

## Tests
- [ ] E2E: 생성→확인→수정 플로우

## Links
- Sprint: S3
```

---

## S3-02: /api/admin/templates/[id] CRUD API

```markdown
## Goal
템플릿 CRUD API 제공(서버 경유)

## Acceptance Criteria (AC)
- [ ] Create/Update/Delete 동작
- [ ] admin 가드 적용

## Tests
- [ ] Unit(Vitest): CRUD 케이스

## Links
- Sprint: S3
```

---

## S3-03: Admin Reviews Management UI

```markdown
## Goal
리뷰 목록/필터/액션(숨김/삭제/승인) UI 제공

## Acceptance Criteria (AC)
- [ ] 필터가 동작한다.
- [ ] 액션 수행 후 상태가 갱신된다.

## Tests
- [ ] E2E: 목록/상태변경

## Links
- Sprint: S3
```

---

## S3-04: PATCH /api/admin/reviews/[id]

```markdown
## Goal
리뷰 상태 변경 API 제공

## Acceptance Criteria (AC)
- [ ] action=hide|delete|approve 처리
- [ ] admin 가드 적용

## Tests
- [ ] Unit(Vitest): 액션별 테스트

## Links
- Sprint: S3
```

---

## S3-05: E2E - Template CRUD

```markdown
## Goal
템플릿 CRUD 회귀 방지용 E2E 추가

## Acceptance Criteria (AC)
- [ ] create → list 확인 → update → delete 통과

## Links
- Sprint: S3
```

---

## S3-06: E2E - Review Management

```markdown
## Goal
리뷰 관리 회귀 방지용 E2E 추가

## Acceptance Criteria (AC)
- [ ] hide/approve 중 1개 액션 플로우 통과

## Links
- Sprint: S3
```

---

# 🗓️ Sprint 4 (2/08–2/15) - Data Expansion + Engine v2 Core

## S4-01: Prisma Schema - New Tables

```markdown
## Goal
Phase 2 신규 테이블 3개를 Prisma schema에 반영하고 migrate한다.

## Scope
- In: GymReport, UserProgressLog, UserContraindicationHistory 모델 추가
- Out: 프로덕션 롤백 전략(별도 운영 문서)

## Acceptance Criteria (AC)
- [ ] npx prisma migrate dev 성공
- [ ] 개발 DB에서만 reset 사용 가능하다는 주석/문서 추가

## Tests
- [ ] Manual: migrate 적용 확인

## Links
- Sprint: S4
```

---

## S4-02: RLS Policies for New Tables

```markdown
## Goal
신규 테이블에 RLS를 적용해 사용자 데이터 접근을 보호한다.

## Important Decision
- Admin 전체 조회/처리는 DB RLS로 풀지 않고, **Next.js Admin API(service role)**에서 처리한다.

## Acceptance Criteria (AC)
- [ ] user_contraindication_history: 본인 SELECT/INSERT만 허용
- [ ] user_progress_logs: 본인 ALL만 허용
- [ ] gym_reports: 본인 INSERT 허용(옵션: 본인 SELECT)
- [ ] Supabase Dashboard에서 RLS enabled 확인

## Tests
- [ ] Manual: Supabase 정책 확인 + 간단 쿼리 테스트

## Links
- Sprint: S4
```

---

## S4-03: BodyPart Hierarchy (parentId)

```markdown
## Goal
body_parts에 parentId로 계층을 도입한다.

## Acceptance Criteria (AC)
- [ ] parent/children 관계가 Prisma에서 조회된다.

## Tests
- [ ] Unit(Vitest): 계층 조회 로직

## Links
- Sprint: S4
```

---

## S4-04: Seed templates 200

```markdown
## Goal
exercise_templates를 200개로 확장 시딩한다.

## Acceptance Criteria (AC)
- [ ] 스크립트 실행 후 templates=200
- [ ] 카테고리 밸런스(상체/하체/코어)가 맞는다.

## Tests
- [ ] Manual: DB 카운트 확인

## Links
- Sprint: S4
```

---

## S4-05: Seed body parts 50

```markdown
## Goal
body_parts를 50개로 확장 시딩한다.

## Acceptance Criteria (AC)
- [ ] 스크립트 실행 후 body_parts=50
- [ ] parentId가 지정된다(계층).

## Tests
- [ ] Manual: DB 카운트 확인

## Links
- Sprint: S4
```

---

## S4-06: auto-difficulty.ts + tests

```markdown
## Goal
사용자 이력 기반 난이도 자동 조절 함수 스켈레톤 구현

## Acceptance Criteria (AC)
- [ ] calculateDifficulty()가 최소 규칙으로 동작
- [ ] 케이스별 테스트 통과

## Tests
- [ ] Unit(Vitest)

## Links
- Sprint: S4
```

---

# 🗓️ Sprint 5 (2/15–2/22) - User Records + Quality

## S5-01: Course Feedback Modal + schema update

```markdown
## Goal
운동 완료 후 피드백(통증/메모)을 저장한다.

## Acceptance Criteria (AC)
- [ ] feedback JSONB 저장
- [ ] E2E로 제출 플로우 1개 통과

## Links
- Sprint: S5
```

---

## S5-02: /my/history UI

```markdown
## Goal
주간 히스토리/캘린더/부위별 빈도 차트 UI 제공

## Acceptance Criteria (AC)
- [ ] 페이지가 렌더링되고 API 데이터를 표시한다.

## Links
- Sprint: S5
```

---

## S5-03: GET /api/users/history

```markdown
## Goal
기간별 운동 기록 + 통계를 제공한다.

## Acceptance Criteria (AC)
- [ ] from/to 필터가 동작
- [ ] stats 계산이 맞는다

## Tests
- [ ] Unit(Vitest)

## Links
- Sprint: S5
```

---

## S5-04: GET /api/courses/recommended

```markdown
## Goal
오늘의 추천 코스를 제공한다.

## Acceptance Criteria (AC)
- [ ] 로그인 사용자에게 course+reason을 반환한다.

## Tests
- [ ] Unit(Vitest)

## Links
- Sprint: S5
```

---

## S5-05: Home recommended card

```markdown
## Goal
홈에 "오늘의 추천 코스" 카드를 노출한다.

## Acceptance Criteria (AC)
- [ ] 로그인 사용자에게만 노출된다.
- [ ] 클릭 시 코스 상세로 이동한다.

## Links
- Sprint: S5
```

---

## S5-06: Gym report page

```markdown
## Goal
사용자가 헬스장 정보 수정/폐업 제보를 제출할 수 있다.

## Acceptance Criteria (AC)
- [ ] reportType/details 입력 후 제출 가능
- [ ] 성공 시 pending 안내

## Links
- Sprint: S5
```

---

## S5-07: POST /api/gyms/[id]/report

```markdown
## Goal
헬스장 제보 저장 API

## Acceptance Criteria (AC)
- [ ] reporter_id는 auth.uid 기반으로 저장(서버에서 강제)
- [ ] status는 pending

## Tests
- [ ] Unit(Vitest)

## Links
- Sprint: S5
```

---

## S5-08: Review trust score

```markdown
## Goal
리뷰 신뢰도 점수 계산 로직 추가

## Acceptance Criteria (AC)
- [ ] trust_score 계산 함수 + 테스트
- [ ] DB 컬럼 추가 및 기본값 적용

## Tests
- [ ] Unit(Vitest)

## Links
- Sprint: S5
```

---

## S5-09: Gym search sort options

```markdown
## Goal
정렬 옵션 확장(review_count, trust_weighted, recently_updated)

## Acceptance Criteria (AC)
- [ ] sort 파라미터에 따라 정렬 결과가 달라진다

## Tests
- [ ] Unit(Vitest)

## Links
- Sprint: S5
```

---

## S5-10: Phase 2 Final E2E Suite

```markdown
## Goal
Phase 2 핵심 플로우 회귀 방지 E2E 묶음 추가

## Acceptance Criteria (AC)
- [ ] Admin flow 1개
- [ ] User record flow 1개
- [ ] Recommended flow 1개
- [ ] 실패 시 trace로 디버깅 가능(필요 시 `npx playwright test --trace on`, `npx playwright show-trace`)

## Links
- Sprint: S5
```

---

# 📊 Summary

| Sprint | 기간 | 티켓 수 | 핵심 산출물 |
|--------|------|---------|-------------|
| S1 | 1/18-1/25 | 7 | Admin 인증/가드 |
| S2 | 1/25-2/01 | 5 | Dashboard, Templates 목록 |
| S3 | 2/01-2/08 | 6 | CRUD, 리뷰 관리 |
| S4 | 2/08-2/15 | 6 | 스키마 확장, RLS, 시드 |
| S5 | 2/15-2/22 | 10 | 사용자 기록, 추천, 품질 |
| **Total** | 5주 | **34** | |
