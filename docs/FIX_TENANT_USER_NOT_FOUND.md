# "Tenant or user not found" 에러 해결 가이드

## 에러 메시지

```
FATAL: Tenant or user not found
```

이 에러는 데이터베이스 연결은 성공했지만, 사용자 인증에 실패했을 때 발생합니다.

## 원인

Supabase 연결 풀러를 사용할 때 사용자명 형식이 잘못되었을 가능성이 높습니다.

**일반적인 원인:**
- 연결 풀러에서 `postgres.ggmoudegjlobgytngkgx` 형식의 사용자명을 인식하지 못함
- 연결 풀러는 때로 `postgres`만 사용해야 함

## 해결 방법

### 1. Supabase 대시보드에서 연결 문자열 확인

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택 (프로젝트 ID: `ggmoudegjlobgytngkgx`)
3. Settings → Database 메뉴로 이동
4. Connection string 섹션으로 스크롤
5. **Session mode** 또는 **Transaction mode** 선택 (연결 풀러)
6. **URI** 형식 복사

### 2. 사용자명 형식 확인

Supabase 대시보드에서 복사한 연결 문자열의 사용자명을 확인하세요:

**가능한 형식:**
- `postgres` (연결 풀러에서 일반적)
- `postgres.ggmoudegjlobgytngkgx` (직접 연결에서 사용)

### 3. .env 파일 수정

연결 풀러를 사용하는 경우, 사용자명을 `postgres`로 변경해보세요:

**현재 (잘못된 형식일 수 있음):**
```env
DATABASE_URL="postgresql://postgres.ggmoudegjlobgytngkgx:flslwl01%21%40%23@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```

**수정 후 (시도해볼 형식):**
```env
DATABASE_URL="postgresql://postgres:flslwl01%21%40%23@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```

**또는 Supabase 대시보드에서 제공하는 정확한 형식 사용:**
- 대시보드에서 복사한 연결 문자열을 그대로 사용
- `[YOUR-PASSWORD]` 부분만 실제 비밀번호로 교체 (URL 인코딩 필요)

### 4. 비밀번호 URL 인코딩 확인

비밀번호 `flslwl01!@#`는 다음과 같이 인코딩되어야 합니다:
- `!` → `%21`
- `@` → `%40`
- `#` → `%23`
- **인코딩된 비밀번호:** `flslwl01%21%40%23`

### 5. 개발 서버 재시작

`.env` 파일을 수정한 후:

```bash
# 개발 서버 중지 (Ctrl + C)
# Prisma Client 재생성
pnpm prisma:generate
# 개발 서버 재시작
pnpm dev
```

## 확인 방법

서버 시작 시 콘솔에서 다음을 확인하세요:

```
[Prisma Client 초기화] 환경 변수 로드 상태:
  DATABASE_URL 존재: ✅ 있음
  사용자명: postgres (또는 postgres.ggmoudegjlobgytngkgx)
  호스트: aws-0-ap-northeast-1.pooler.supabase.com
  포트: 6543
```

## 추가 확인 사항

### Supabase 연결 풀러 설정 확인

1. Supabase 대시보드 → Settings → Database
2. Connection pooling 섹션 확인
3. Pooler mode가 활성화되어 있는지 확인

### 직접 연결로 테스트 (임시)

연결 풀러가 계속 실패하면, 직접 연결로 테스트해보세요:

```env
DATABASE_URL="postgresql://postgres.ggmoudegjlobgytngkgx:flslwl01%21%40%23@db.ggmoudegjlobgytngkgx.supabase.co:5432/postgres?sslmode=require"
```

**주의:** 직접 연결은 연결 수 제한이 있으므로, 프로덕션에서는 연결 풀러를 사용하는 것이 좋습니다.

## 참고 문서

- [Supabase Connection Pooling 문서](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [README.md - Prisma DATABASE_URL 섹션](../README.md#prisma-database_url)
- [docs/DATABASE_URL_TROUBLESHOOTING.md](./DATABASE_URL_TROUBLESHOOTING.md)

