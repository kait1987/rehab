# DATABASE_URL "Tenant or user not found" 에러 해결 가이드

## 문제 상황

"Tenant or user not found" 에러가 계속 발생하는 경우, 연결 풀러의 사용자명 형식 문제일 가능성이 높습니다.

## 해결 방법

### ✅ 방법 1: 사용자명을 `postgres`로 변경 (연결 풀러용) - 현재 적용됨

Supabase 연결 풀러를 사용할 때는 사용자명이 `postgres`만 필요할 수 있습니다.

**현재 설정:**
```env
DATABASE_URL="postgresql://postgres:flslwl01%21%40%23@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```

**변경 사항:**
- 사용자명: `postgres.ggmoudegjlobgytngkgx` → `postgres`

### 다음 단계

1. **개발 서버 완전 종료**
   ```bash
   # 터미널에서 Ctrl + C로 중지
   # 또는 포트 3000을 사용하는 프로세스 종료
   ```

2. **개발 서버 재시작**
   ```bash
   pnpm dev
   ```

3. **연결 테스트**
   - 서버 시작 시 콘솔 로그 확인
   - `[DATABASE_URL 검증 성공]` 메시지 확인
   - 실제 API 호출 테스트

### ⚠️ 방법 1이 실패하는 경우: 직접 연결 사용

연결 풀러가 계속 실패하면 직접 연결을 사용하세요:

**수정:**
```env
DATABASE_URL="postgresql://postgres.ggmoudegjlobgytngkgx:flslwl01%21%40%23@db.ggmoudegjlobgytngkgx.supabase.co:5432/postgres?sslmode=require"
```

**변경 사항:**
- 사용자명: `postgres` → `postgres.ggmoudegjlobgytngkgx`
- 호스트: `aws-0-ap-northeast-1.pooler.supabase.com` → `db.ggmoudegjlobgytngkgx.supabase.co`
- 포트: `6543` → `5432`
- 파라미터: `pgbouncer=true` 제거

**주의:** 직접 연결은 연결 수 제한이 있으므로, 프로덕션에서는 연결 풀러를 사용하는 것이 좋습니다.

### 🔍 방법 2도 실패하는 경우: Supabase 대시보드 확인

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택 (프로젝트 ID: `ggmoudegjlobgytngkgx`)
3. Settings → Database 메뉴로 이동
4. Connection string 섹션으로 스크롤
5. **Session mode** 또는 **Transaction mode** 선택 (연결 풀러)
6. **URI** 형식 복사
7. `.env` 파일에 그대로 붙여넣기
8. `[YOUR-PASSWORD]` 부분만 실제 비밀번호로 교체 (URL 인코딩 필요)

## 확인 사항

서버 시작 시 다음을 확인하세요:

```
[Prisma Client 초기화] 환경 변수 로드 상태:
  DATABASE_URL 존재: ✅ 있음
  사용자명: postgres (또는 postgres.ggmoudegjlobgytngkgx)
  포트 6543 (풀러): ✅ (또는 포트 5432 직접 연결)
  pgbouncer 파라미터: ✅ (직접 연결 시 없음)

[DATABASE_URL 검증 성공]
  호스트: aws-0-ap-northeast-1.pooler.supabase.com (또는 db.ggmoudegjlobgytngkgx.supabase.co)
  포트: 6543 (또는 5432)
  사용자명: postgres (또는 postgres.ggmoudegjlobgytngkgx)
```

## 문제 해결 체크리스트

- [ ] 방법 1 시도: 사용자명을 `postgres`로 변경
- [ ] Prisma Client 재생성 (`pnpm prisma:generate`)
- [ ] 개발 서버 완전 재시작
- [ ] 연결 테스트
- [ ] 방법 1 실패 시 방법 2 시도: 직접 연결 사용
- [ ] 방법 2도 실패 시 Supabase 대시보드에서 연결 문자열 확인

## 참고 문서

- `docs/FIX_TENANT_USER_NOT_FOUND.md` - 상세한 에러 해결 가이드
- `docs/DATABASE_URL_TROUBLESHOOTING.md` - DATABASE_URL 트러블슈팅 가이드
- `docs/RESTART_SERVER_GUIDE.md` - 개발 서버 재시작 가이드

