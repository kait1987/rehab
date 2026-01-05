# DATABASE_URL 연결 문자열 에러 해결 가이드

## 에러 메시지

```
The provided database string is invalid. Error parsing connection string: empty host in database URL.
```

이 에러는 Prisma가 `DATABASE_URL` 환경 변수를 읽을 수 없거나, 연결 문자열 형식이 잘못되었을 때 발생합니다.

## 해결 방법

### 1. `.env` 파일 확인

프로젝트 루트 디렉토리(`nextjs-supabase-boilerplate-main/`)에 `.env` 파일이 있는지 확인하세요.

**파일 위치:**
```
nextjs-supabase-boilerplate-main/
├── .env          ← 여기에 있어야 함
├── package.json
├── prisma/
└── ...
```

### 2. DATABASE_URL 형식 확인

`.env` 파일의 `DATABASE_URL`이 다음 형식을 따라야 합니다:

```env
DATABASE_URL=postgresql://postgres.ggmoudegjlobgytngkgx:[비밀번호]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**중요 포인트:**
- `postgresql://` 또는 `postgres://`로 시작해야 함
- `@` 기호 앞에 사용자명과 비밀번호가 있어야 함
- `@` 기호 뒤에 호스트(host) 정보가 있어야 함
- 호스트 뒤에 포트 번호가 있어야 함 (`:6543` 또는 `:5432`)
- 마지막에 `/postgres` 데이터베이스명이 있어야 함

### 3. Supabase 연결 문자열 가져오기

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택 (프로젝트 ID: `ggmoudegjlobgytngkgx`)
3. 왼쪽 메뉴에서 **Settings** 클릭
4. **Database** 메뉴 클릭
5. **Connection string** 섹션으로 스크롤
6. **URI** 탭 선택
7. 연결 문자열 복사

**연결 문자열 예시:**
```
postgresql://postgres.ggmoudegjlobgytngkgx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

### 4. 비밀번호 교체

복사한 연결 문자열에서 `[YOUR-PASSWORD]` 부분을 실제 Supabase 데이터베이스 비밀번호로 교체하세요.

**비밀번호 확인 방법:**
- Supabase 대시보드 → Settings → Database
- **Database password** 섹션에서 비밀번호 확인
- 비밀번호를 잊어버린 경우: **Reset database password** 버튼으로 재설정

**특수 문자 포함 시:**
비밀번호에 특수 문자(`@`, `#`, `%`, `&` 등)가 포함된 경우 URL 인코딩이 필요할 수 있습니다:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`

### 5. 연결 문자열 형식 검증

올바른 형식 예시:

```env
# ✅ 올바른 형식 (연결 풀러 사용)
DATABASE_URL=postgresql://postgres.ggmoudegjlobgytngkgx:your_password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true

# ✅ 올바른 형식 (직접 연결)
DATABASE_URL=postgresql://postgres.ggmoudegjlobgytngkgx:your_password@db.ggmoudegjlobgytngkgx.supabase.co:5432/postgres?sslmode=require
```

잘못된 형식 예시:

```env
# ❌ 호스트 정보 없음
DATABASE_URL=postgresql://postgres.ggmoudegjlobgytngkgx:your_password@/postgres

# ❌ 비밀번호 플레이스홀더 그대로 사용
DATABASE_URL=postgresql://postgres.ggmoudegjlobgytngkgx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres

# ❌ 프로토콜 없음
DATABASE_URL=postgres.ggmoudegjlobgytngkgx:your_password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

### 6. 개발 서버 재시작

`.env` 파일을 수정한 후 **반드시 개발 서버를 재시작**해야 합니다:

```bash
# 개발 서버 중지 (Ctrl + C)
# 그 다음 다시 시작
pnpm dev
```

환경 변수는 서버 시작 시에만 로드되므로, 파일을 수정해도 실행 중인 서버에는 반영되지 않습니다.

### 7. Prisma Client 재생성 (선택사항)

문제가 계속되면 Prisma Client를 재생성하세요:

```bash
pnpm prisma:generate
```

## 자주 발생하는 문제

### 문제 1: "empty host in database URL"

**원인:** 연결 문자열에 호스트 정보가 없습니다.

**해결:**
- `@` 기호 뒤에 호스트가 있는지 확인
- Supabase 대시보드에서 연결 문자열을 다시 복사

### 문제 2: "invalid connection string"

**원인:** 연결 문자열 형식이 잘못되었습니다.

**해결:**
- `postgresql://`로 시작하는지 확인
- 모든 필수 부분(사용자명, 비밀번호, 호스트, 포트, 데이터베이스명)이 포함되어 있는지 확인

### 문제 3: 환경 변수가 로드되지 않음

**원인:** `.env` 파일이 프로젝트 루트에 없거나, 서버를 재시작하지 않았습니다.

**해결:**
- `.env` 파일이 `package.json`과 같은 디렉토리에 있는지 확인
- 개발 서버를 완전히 중지하고 다시 시작

### 문제 4: 비밀번호에 특수 문자 포함

**원인:** 비밀번호의 특수 문자가 URL 파싱을 방해합니다.

**해결:**
- 특수 문자를 URL 인코딩하거나
- Supabase에서 비밀번호를 재설정하여 특수 문자 없는 비밀번호 사용

## 추가 도움말

- [Prisma 연결 문자열 문서](https://www.prisma.io/docs/reference/database-reference/connection-urls)
- [Supabase 연결 가이드](https://supabase.com/docs/guides/database/connecting-to-postgres)
- 프로젝트 README.md의 "Prisma DATABASE_URL" 섹션 참고

## 검증 도구

프로젝트에 포함된 검증 도구가 자동으로 `DATABASE_URL`을 검증합니다:
- 개발 서버 시작 시 자동 검증
- 문제 발견 시 콘솔에 상세한 에러 메시지 출력
- `lib/utils/validate-database-url.ts` 파일 참고

