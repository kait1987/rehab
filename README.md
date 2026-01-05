This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 환경 변수 설정

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# Supabase 환경 변수
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_STORAGE_BUCKET=study

# Prisma 데이터베이스 연결 (Prisma 7 필수)
# Supabase PostgreSQL 연결 문자열 사용
# 형식: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require&connection_limit=5&pool_timeout=30&connect_timeout=30
# 연결 파라미터 설명:
# - connection_limit: 최대 연결 풀 크기 (권장: 5-10)
# - pool_timeout: 연결 풀 타임아웃 (초, 권장: 30)
# - connect_timeout: 연결 타임아웃 (초, 권장: 30)
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@[YOUR_PROJECT_REF].supabase.co:5432/postgres?sslmode=require&connection_limit=5&pool_timeout=30&connect_timeout=30

# 필요하면 DIRECT_URL을 추가로 설정해 Prisma CLI용 비풀링 연결을 쓸 수 있다
# DIRECT_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres?sslmode=require

# 네이버맵 API 환경 변수
# 서버 사이드 API 호출용 (장소 검색 등)
# 네이버 클라우드 플랫폼에서 발급받은 Client ID와 Client Secret을 입력하세요.
# 설정 방법: docs/NAVER_MAP_API_SETUP.md 참고
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# 클라이언트 사이드 지도 표시용 (네이버 지도 API v3)
# NEXT_PUBLIC_ 접두사가 붙으면 클라이언트 사이드에서 접근 가능합니다.
# 서버 사이드와 동일한 Client ID를 사용할 수 있습니다.
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id
```

**환경 변수 값 확인 방법:**

**Supabase:**
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. Settings > API 메뉴로 이동
4. `Project URL`과 `anon public` 키를 복사하여 `.env` 파일에 입력
5. `service_role` 키는 **절대 공개하지 마세요** (서버 사이드 전용)

**Prisma DATABASE_URL:**
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. Settings > Database 메뉴로 이동
4. `Connection string` 섹션에서 `URI` 형식 복사
5. `[YOUR-PASSWORD]` 부분을 실제 데이터베이스 비밀번호로 교체
6. `.env` 파일의 `DATABASE_URL`에 입력

**⚠️ 중요: 연결 문자열 형식 확인**
- 연결 문자열은 반드시 `postgresql://` 또는 `postgres://`로 시작해야 합니다
- 호스트(host) 정보가 반드시 포함되어 있어야 합니다
- 비밀번호에 특수 문자가 포함된 경우 URL 인코딩이 필요할 수 있습니다
- 예시 형식:
  ```
  postgresql://postgres.ggmoudegjlobgytngkgx:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
  ```
- 연결 풀러 사용 시: 포트 6543, `pgbouncer=true` 파라미터 필요
- 직접 연결 시: 포트 5432 사용

**에러 발생 시:**
- "empty host in database URL" 에러: 연결 문자열에 호스트 정보가 없습니다. Supabase 대시보드에서 URI 형식을 다시 복사하세요
- "invalid connection string" 에러: 연결 문자열 형식이 잘못되었습니다. 위의 예시 형식을 참고하세요
- "Can't reach database server" 에러: 연결 풀러(포트 6543)를 사용하는지 확인하세요. 직접 연결(포트 5432)은 실패할 수 있습니다
- "Tenant or user not found" 에러: 연결 풀러에서 사용자명 형식이 잘못되었을 수 있습니다. Supabase 대시보드에서 제공하는 연결 문자열을 확인하고, 사용자명이 `postgres`인지 `postgres.ggmoudegjlobgytngkgx`인지 확인하세요. `docs/FIX_TENANT_USER_NOT_FOUND.md` 참고
- 환경 변수 변경 후: **반드시 개발 서버를 완전히 재시작**하세요 (Ctrl + C로 중지 후 `pnpm dev`로 재시작)
- 문제가 계속되면: `docs/DATABASE_URL_TROUBLESHOOTING.md` 참고

**네이버맵 API:**
1. [네이버 클라우드 플랫폼 콘솔](https://console.ncloud.com/)에 로그인
2. **Services** > **Application Services** > **Maps** > **Application** 메뉴로 이동
3. 애플리케이션 등록 또는 기존 애플리케이션 선택
4. **Client ID**와 **Client Secret** 확인
5. **Dynamic Map** 설정이 활성화되어 있는지 확인
6. 상세한 설정 방법은 [docs/NAVER_MAP_API_SETUP.md](docs/NAVER_MAP_API_SETUP.md) 참고

### Prisma 설정 (Prisma 7)

이 프로젝트는 Prisma 7을 사용합니다. Prisma Client를 생성하려면:

```bash
# Prisma Client 생성
pnpm prisma:generate

# 데이터베이스 마이그레이션 (개발)
pnpm prisma:migrate:dev

# Prisma Studio 실행 (데이터베이스 GUI)
pnpm prisma:studio
```

**중요 사항:**
- 이 프로젝트는 **Supabase PostgreSQL만 사용**합니다
- `schema.prisma`의 `datasource`에서 `url = env("DATABASE_URL")`을 사용합니다
- `DATABASE_URL`은 Supabase 연결 문자열을 사용합니다

### 개발 서버 실행

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
