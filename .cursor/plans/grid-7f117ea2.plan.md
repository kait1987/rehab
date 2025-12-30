<!-- 7f117ea2-165a-4ad9-82f7-e199dbeb99b7 72333266-e177-4f05-9ffe-848b26e9660c -->
# Phase 6: 테스트 & 배포 계획

## 현재 상태 분석

### 구현 완료된 기능

- Phase 1-5까지 모든 핵심 기능 구현 완료
- 기본 에러 처리 구현됨 (일부 페이지)
- 로딩 상태 UI 구현됨 (일부 페이지)

### 개선이 필요한 부분

1. 전체 사용자 플로우 E2E 점검 미완료
2. 예외처리 강화 필요 (모든 페이지/컴포넌트)
3. Vercel 배포 설정 미완료
4. 환경변수 문서화 및 설정 가이드 부재

## 구현 계획

### 1. 전체 사용자 플로우 E2E 점검

#### 1.1 사용자 플로우 정의 및 체크리스트 작성

- **파일**: `docs/E2E_TEST_CHECKLIST.md` (신규 생성)
- 주요 플로우:

1. 회원가입/로그인 → 상품 탐색 → 장바구니 추가 → 주문 생성 → 결제 → 주문 확인
2. 비회원 상태에서 상품 탐색
3. 장바구니 관리 (추가/수정/삭제)
4. 주문 내역 조회
5. 에러 시나리오 (재고 부족, 결제 실패 등)

#### 1.2 수동 테스트 수행

- 각 플로우별 테스트 시나리오 실행
- 버그 및 개선사항 기록
- `docs/BUG_REPORT.md` 또는 기존 `docs/error_report.md`에 기록

#### 1.3 주요 버그 수정

- 발견된 버그 우선순위 정리
- Critical/High 우선순위 버그부터 수정
- 수정 후 재테스트

### 2. 주요 버그 수정 및 예외처리 강화

#### 2.1 전역 에러 처리 개선

- **파일**: `app/error.tsx`, `app/not-found.tsx` (신규 생성 또는 개선)
- Next.js Error Boundary 구현
- 404 페이지 개선
- 500 에러 페이지 구현

#### 2.2 API/Server Actions 에러 처리 강화

- **파일**: `app/actions/orders.ts`, 기타 Server Actions
- 모든 Server Action에 try-catch 및 명확한 에러 메시지
- 클라이언트에 전달되는 에러 메시지 사용자 친화적으로 개선

#### 2.3 클라이언트 컴포넌트 에러 처리

- **파일들**: 
- `app/cart/page.tsx`
- `app/checkout/page.tsx`
- `app/my/orders/page.tsx`
- `app/my/orders/[id]/page.tsx`
- `components/cart/add-to-cart-button.tsx`
- `components/checkout/checkout-form.tsx`
- 모든 데이터 fetching에 에러 처리 추가
- 네트워크 오류, 권한 오류 등 다양한 시나리오 처리

#### 2.4 입력 검증 강화

- **파일**: `components/checkout/checkout-form.tsx`
- Zod 스키마를 사용한 폼 검증 (이미 react-hook-form 사용 중)
- 클라이언트 사이드 검증 + 서버 사이드 검증

#### 2.5 재고 검증 강화

- **파일**: `app/actions/orders.ts`, `components/cart/add-to-cart-button.tsx`
- 주문 생성 시 재고 재확인
- 장바구니 추가/수정 시 재고 검증

### 3. Vercel 배포 설정 및 환경변수 구성

#### 3.1 Vercel 프로젝트 설정

- **파일**: `vercel.json` (신규 생성, 선택사항)
- Next.js 15 기본 설정으로 대부분 자동 감지
- 필요시 빌드 설정 커스터마이징

#### 3.2 환경변수 문서화

- **파일**: `docs/DEPLOYMENT.md` (신규 생성)
- 필수 환경변수 목록
- Vercel 환경변수 설정 가이드
- Clerk, Supabase, Toss Payments 환경변수 설정 방법

#### 3.3 환경변수 예시 파일

- **파일**: `.env.example` (신규 생성)
- 모든 필수 환경변수 목록 (값은 비워두기)
- 각 환경변수 설명 주석 추가

#### 3.4 빌드 테스트

- 로컬에서 `pnpm build` 실행
- 빌드 오류 확인 및 수정
- 타입 오류 확인 및 수정

#### 3.5 Vercel 배포 가이드 작성

- **파일**: `docs/DEPLOYMENT.md`
- Vercel 계정 생성 및 프로젝트 연결
- GitHub 연동 방법
- 환경변수 설정 방법
- 배포 후 확인 사항

### 4. 추가 개선 사항

#### 4.1 로깅 개선

- 프로덕션 환경에서 불필요한 console.log 제거
- 에러 로깅은 유지 (console.error)
- 개발 환경과 프로덕션 환경 구분

#### 4.2 성능 최적화

- 이미지 최적화 확인 (next/image 사용 중)
- 불필요한 리렌더링 방지
- 코드 스플리팅 확인

#### 4.3 보안 점검

- 환경변수 노출 확인
- API 키 보안 확인
- XSS 방지 확인

## 구현 순서

1. **E2E 테스트 체크리스트 작성 및 수동 테스트 수행**

- 사용자 플로우 정의
- 체크리스트 작성
- 수동 테스트 수행
- 버그 기록

2. **에러 처리 강화**

- 전역 에러 처리 (error.tsx, not-found.tsx)
- Server Actions 에러 처리
- 클라이언트 컴포넌트 에러 처리
- 입력 검증 강화

3. **주요 버그 수정**

- 발견된 버그 우선순위 정리
- Critical/High 우선순위 버그 수정
- 재테스트

4. **Vercel 배포 준비**

- .env.example 파일 생성
- 빌드 테스트
- 배포 문서 작성

5. **최종 검증**

- 전체 플로우 재테스트
- 배포 전 체크리스트 확인

## 참고 파일

- `package.json`: 빌드 스크립트 확인
- `next.config.ts`: Next.js 설정
- `docs/error_report.md`: 기존 에러 리포트
- `docs/PRD.md`: 프로젝트 요구사항
- `AGENTS.md`: 프로젝트 구조 및 가이드

### To-dos

- [ ] E2E 테스트 체크리스트 작성 (docs/E2E_TEST_CHECKLIST.md)
- [ ] 수동 테스트 수행 및 버그 기록
- [ ] 전역 에러 처리 구현 (app/error.tsx, app/not-found.tsx)
- [ ] Server Actions 에러 처리 강화
- [ ] 클라이언트 컴포넌트 에러 처리 강화
- [ ] 입력 검증 강화 (Zod 스키마 적용)
- [ ] 주요 버그 수정 (발견된 버그 우선순위별)
- [ ] .env.example 파일 생성 및 환경변수 문서화
- [ ] 빌드 테스트 및 타입 오류 수정
- [ ] Vercel 배포 가이드 작성 (docs/DEPLOYMENT.md)
- [ ] 로깅 개선 (프로덕션 환경 console.log 제거)
- [ ] 최종 검증 및 전체 플로우 재테스트